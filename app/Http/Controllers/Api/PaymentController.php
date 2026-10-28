<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewOrderAlert;
use App\Mail\OrderConfirmation;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\User;
use App\Services\FlittService;
use App\Services\Notifier;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Card payment via Flitt: marketplace orders in full, remodels in two halves.
 *
 * An order is created unpaid, the client asks for a checkout token, and the
 * result arrives back one of two ways: Flitt's server callback, or the client
 * asking us to re-check. Both land in markPaid(), which is idempotent, so a
 * callback and a poll racing each other settle the order exactly once.
 *
 * Paying is what moves an order on: markPaid is where the tailor is told and
 * the customer's confirmation is sent, hanging off the single conditional
 * update so a callback and a poll racing cannot announce it twice.
 *
 * A remodel is paid in two stages (terms §7, §8): the first half with the
 * delivery fee once the customer accepts an offer, the second half once the
 * work is finished. Each stage has its own gateway reference, which names the
 * stage, so a payment is always credited to the half it was made for.
 *
 * Errors carry a `code` as well as a message, because the message is English
 * and the interface is not.
 */
class PaymentController extends Controller
{
    /** What each stage moves payment_status from and to. */
    private const STAGES = [
        'full' => ['from' => 'unpaid', 'to' => 'paid'],
        'deposit' => ['from' => 'unpaid', 'to' => 'deposit_paid'],
        'balance' => ['from' => 'deposit_paid', 'to' => 'paid'],
    ];

    public function __construct(private FlittService $flitt) {}

    // ─── POST /api/orders/{id}/pay ────────────────────────────────────────────
    // Start a payment: a checkout token for whatever the caller's order owes
    // now. The ownership check is the authorisation — an order id is guessable
    // and the token is worth money.

    public function pay(Request $request, int $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $stage = $this->stageDue($order);

        if (! is_string($stage)) {
            return $stage;
        }

        // Flitt renders its own page, so the language the customer is reading the
        // site in has to travel with the request. The client sends what it is
        // displaying; the service decides whether that is a language Flitt speaks.
        $requested = $request->input('lang');

        $token = $this->flitt->createCheckoutToken($order, is_string($requested) ? $requested : null, $stage);

        if (! $token) {
            return response()->json(['message' => 'Could not start the payment. Please try again.', 'code' => 'payment_start_failed'], 502);
        }

        return response()->json([
            'token'        => $token,
            'checkout_url' => $this->flitt->checkoutUrl($token),
            'order_number' => $order->order_number,
            'stage'        => $stage,
            'amount'       => $order->amountDue($stage),
            'currency'     => 'GEL',
        ]);
    }

    /**
     * The stage this order can be paid for now, or the refusal to send back.
     * An order that is no longer live is not payable: a cancelled order would
     * otherwise still mint a checkout token — taking money for work nobody is
     * going to do.
     *
     */
    private function stageDue(Order $order): string|JsonResponse
    {
        $stage = $order->paymentStageDue();

        if ($stage) {
            return $stage;
        }

        if ($order->order_type !== 'marketplace' && ! $order->isPaidRemodel()) {
            return $this->refuse('This order is not payable online.', 'order_not_payable_online', 422);
        }

        if ($order->payment_status === 'paid') {
            return $this->refuse('This order is already paid.', 'order_already_paid', 409);
        }

        return $this->refuse('Nothing is due on this order right now.', 'order_not_payable', 409);
    }

    private function refuse(string $message, string $code, int $status)
    {
        return response()->json(['message' => $message, 'code' => $code], $status);
    }

    // ─── POST /api/orders/{id}/verify-payment ─────────────────────────────────
    // Client-driven confirmation. Authoritative on its own, so checkout still
    // settles where the callback cannot reach us — local dev, or a webhook Flitt
    // is still retrying while the customer is watching a spinner.

    public function verify(Request $request, int $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        // Ask about the attempt currently in flight. An order that has never been
        // handed to the gateway has no reference and nothing to ask about.
        if (! $order->payment_reference) {
            return response()->json(['payment_status' => $order->payment_status, 'stage' => null, 'settled' => false]);
        }

        $reference = $order->payment_reference;
        $stage     = $this->flitt->stageFor($reference);

        if (! $this->stageSettled($order, $stage)) {
            $status = $this->flitt->fetchOrderStatus($reference);

            if ($status && ($status['order_status'] ?? null) === 'approved') {
                $this->markPaid($order, $status, $reference);
            }
        }

        $order->refresh();

        return response()->json([
            'payment_status' => $order->payment_status,
            'stage'          => $stage,
            'settled'        => $this->stageSettled($order, $stage),
        ]);
    }

    /** Whether the order has moved past the stage a payment was for. */
    private function stageSettled(Order $order, string $stage): bool
    {
        return $stage === 'deposit'
            ? in_array($order->payment_status, ['deposit_paid', 'paid'], true)
            : $order->payment_status === 'paid';
    }

    // ─── POST /api/payments/flitt/callback ────────────────────────────────────
    // Flitt's server-to-server webhook. Public, because Flitt carries no bearer
    // token — the signature is the trust boundary. Always answers 200: a non-2xx
    // puts Flitt into a retry loop over something a retry will never fix.

    public function callback(Request $request)
    {
        // Flitt posts either {"response": {…}} or the fields flat.
        $data = $request->input('response', $request->all());

        if (! is_array($data) || ! $this->flitt->verifyCallbackSignature($data)) {
            Log::warning('Flitt callback rejected: bad signature', [
                'order_id' => is_array($data) ? ($data['order_id'] ?? null) : null,
            ]);

            return response()->json(['status' => 'ignored'], 200);
        }

        // Resolve from the reference the gateway quotes rather than from the
        // order's current one: a customer who retried and then finished paying
        // in the older tab sends a superseded reference, and that payment is
        // just as real as one on the latest attempt.
        $reference = (string) ($data['order_id'] ?? '');
        $order     = Order::where('order_number', $this->flitt->orderNumberFor($reference))->first();

        if (! $order) {
            Log::warning('Flitt callback for unknown order', ['order_id' => $reference]);

            return response()->json(['status' => 'ignored'], 200);
        }

        if (($data['order_status'] ?? null) === 'approved') {
            $this->markPaid($order, $data, $reference);
        }

        return response()->json(['status' => 'ok'], 200);
    }

    // ─── Finalise ─────────────────────────────────────────────────────────────

    /**
     * Credit a payment to an order, once. Called from both the webhook and the
     * client poll, so every branch below has to be safe to hit twice.
     */
    private function markPaid(Order $order, array $flitt, string $reference): void
    {
        $stage = $this->flitt->stageFor($reference);

        // A marketplace order is paid in full and a remodel in halves; a payment
        // naming any other combination means something is wrong upstream — do
        // not credit it on the strength of a signature alone.
        $expectedStages = match (true) {
            $order->order_type === 'marketplace' => ['full'],
            $order->isPaidRemodel() => ['deposit', 'balance'],
            default => [],
        };

        if (! in_array($stage, $expectedStages, true)) {
            Log::error("Flitt {$stage} payment for {$order->order_type} order {$order->order_number} — needs manual review.");

            return;
        }

        ['from' => $from, 'to' => $to] = self::STAGES[$stage];

        // The callback and the client poll report the same payment; whichever
        // arrives second finds it on record and has nothing to do.
        if (OrderPayment::where('reference', $reference)->exists()) {
            return;
        }

        // Anything other than the expected starting point means this payment
        // came after the order moved on: cancelled, expired, or already paid
        // under another reference (a second tab finishing an older checkout).
        // That is real money taken twice or for nothing, so a human refunds it;
        // quietly reopening the order would revive one nobody is working on.
        if ($order->payment_status !== $from) {
            $this->recordLatePayment($order, $flitt, $reference, $stage);

            return;
        }

        // Never credit on the gateway's word about what was owed. A missing
        // currency is not treated as GEL: the check exists to catch exactly the
        // payload that does not say, so absence has to fail it.
        $expected = $this->flitt->minorUnits($order, $stage);
        $paid     = (int) ($flitt['amount'] ?? 0);
        $currency = $flitt['currency'] ?? null;

        if ($paid !== $expected || $currency !== 'GEL') {
            Log::error("Flitt amount mismatch for {$order->order_number} ({$stage}): got {$paid} ".($currency ?? 'no currency')." expected {$expected} GEL.");

            return;
        }

        // The callback and the client poll are designed to race, so the read
        // above cannot be trusted to still hold. Let the database decide: only
        // the update that finds the order still at its starting point wins, and
        // anything that must happen once per payment hangs off that single row.
        $credited = DB::transaction(function () use ($order, $flitt, $reference, $stage, $from, $to) {
            $update = ['payment_status' => $to];
            $update[$stage === 'deposit' ? 'deposit_paid_at' : 'paid_at'] = now();
            if ($stage !== 'balance') {
                $update['payment_id'] = $flitt['payment_id'] ?? null;
            }

            $won = Order::where('id', $order->id)->where('payment_status', $from)->update($update);

            if ($won === 1) {
                OrderPayment::create([
                    'order_id' => $order->id,
                    'stage' => $stage,
                    'reference' => $reference,
                    'gateway_payment_id' => isset($flitt['payment_id']) ? (string) $flitt['payment_id'] : null,
                    'amount' => $order->amountDue($stage),
                    'paid_at' => now(),
                ]);
            }

            return $won;
        });

        if ($credited !== 1) {
            return;
        }

        $order->refresh();

        match ($stage) {
            'deposit' => $this->announceDeposit($order),
            'balance' => $this->announceBalance($order),
            default => $this->announcePaidOrder($order),
        };
    }

    /**
     * Keep a payment the order no longer wanted on record, without crediting
     * it. The record is what lets the admin panel's refund button give the
     * money back (RefundService refunds recorded payments only), and the
     * admins are told it is waiting. The callback and the poll can both get
     * here; the unique reference lets only one of them record it.
     */
    private function recordLatePayment(Order $order, array $flitt, string $reference, string $stage): void
    {
        Log::error("Flitt {$stage} payment {$reference} on {$order->order_number} with payment_status={$order->payment_status} — not credited, recorded for a refund.");

        $paid = (int) ($flitt['amount'] ?? 0);

        if ($paid <= 0 || ($flitt['currency'] ?? null) !== 'GEL') {
            return;
        }

        try {
            OrderPayment::create([
                'order_id' => $order->id,
                'stage' => $stage,
                'reference' => $reference,
                'gateway_payment_id' => isset($flitt['payment_id']) ? (string) $flitt['payment_id'] : null,
                'amount' => round($paid / 100, 2),
                'paid_at' => now(),
            ]);
        } catch (QueryException) {
            return;
        }

        KereNotification::toAdmins(
            $order,
            'refund_due',
            'გადახდა დასაბრუნებელია',
            "შეკვეთაზე #{$order->order_number} ₾".number_format($paid / 100, 2).' გადაიხადეს მაშინ, როცა შეკვეთა გადახდას აღარ ელოდებოდა (გაუქმებული ან უკვე გადახდილი). თანხა შეკვეთას არ ჩაეთვალა — დაუბრუნეთ მომხმარებელს ბარათზე.'
        );
    }

    /**
     * Tell the people waiting on a marketplace order that it is real.
     *
     * Hangs off the single conditional update above, so the callback and the
     * client poll racing each other cannot produce two "new order" alerts — the
     * loser updates no rows and announces nothing.
     *
     * Nothing here may throw. The money is already taken and the order already
     * credited; a mail server being down is not a reason to leave the payment
     * unrecorded, so every channel logs its own failure and the rest continue.
     */
    private function announcePaidOrder(Order $order): void
    {
        $order->loadMissing(['items', 'tailor', 'user']);

        $customer = $order->user;
        $tailor   = $order->tailor;

        if ($customer) {
            try {
                Mail::to($customer->email)->send(new OrderConfirmation($order));
            } catch (\Throwable $e) {
                Log::error("OrderConfirmation email failed for {$order->order_number}: ".$e->getMessage());
            }
        }

        if (! $tailor || ! $customer) {
            return;
        }

        $lead  = $order->items->first()?->product_name ?? 'your order';
        $extra = max($order->items->count() - 1, 0);
        $label = $extra > 0 ? "\"{$lead}\" and {$extra} more item(s)" : "\"{$lead}\"";

        try {
            KereNotification::create([
                'user_id' => $tailor->id,
                'type'    => 'new_order',
                'title'   => 'New Order Received!',
                'body'    => "You received a new order for {$label} from {$customer->getFullName()}.",
                'data'    => ['order_id' => $order->id, 'product_name' => $lead],
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            Log::error("Tailor notification failed for {$order->order_number}: ".$e->getMessage());
        }

        try {
            (new Notifier)->dual(
                $tailor,
                "Kere: ახალი შეკვეთა #{$order->order_number} — იხილეთ დეტალები თქვენს პანელზე.",
                new NewOrderAlert($order, $customer)
            );
        } catch (\Throwable $e) {
            Log::error("Tailor alert failed for {$order->order_number}: ".$e->getMessage());
        }
    }

    /**
     * The first half of a remodel is in: the tailor can expect the garment, and
     * Kere books the courier to collect it (terms §8, §13).
     */
    private function announceDeposit(Order $order): void
    {
        $order->loadMissing(['tailor', 'user']);

        KereNotification::aboutOrder($order->user_id, $order, 'order_status', 'გადახდა მიღებულია', "შეკვეთის #{$order->order_number} პირველი გადახდა მიღებულია. კურიერი დაგიკავშირდებათ სამოსის წასაღებად.");

        if ($order->tailor) {
            KereNotification::aboutOrder($order->tailor->id, $order, 'new_order', 'შეკვეთა დადასტურდა', "მომხმარებელმა გადაიხადა შეკვეთის #{$order->order_number} პირველი ნახევარი. სამოსს კურიერი მოგიტანთ.");

            try {
                (new Notifier)->dual(
                    $order->tailor,
                    "Kere: შეკვეთა #{$order->order_number} დადასტურდა — სამოსს კურიერი მოგიტანთ. დეტალები თქვენს პანელზე.",
                    new NewOrderAlert($order, $order->user)
                );
            } catch (\Throwable $e) {
                Log::error("Tailor alert failed for {$order->order_number}: ".$e->getMessage());
            }
        }

        KereNotification::toAdmins($order, 'courier_pickup', 'დაჯავშნეთ კურიერი', "შეკვეთის #{$order->order_number} პირველი გადახდა მიღებულია — საჭიროა კურიერი სამოსის მომხმარებლისგან წასაღებად.");
    }

    /** The second half is in: the garment can go back to its owner. */
    private function announceBalance(Order $order): void
    {
        KereNotification::aboutOrder($order->user_id, $order, 'order_status', 'გადახდა მიღებულია', "შეკვეთის #{$order->order_number} საბოლოო გადახდა მიღებულია. სამოსს მალე კურიერი მოგიტანთ.");

        if ($order->tailor_id) {
            KereNotification::aboutOrder($order->tailor_id, $order, 'order_status', 'შეკვეთა სრულად გადახდილია', "შეკვეთა #{$order->order_number} სრულად გადახდილია — სამოსს კურიერი წაიღებს მომხმარებლისთვის დასაბრუნებლად.");
        }

        KereNotification::toAdmins($order, 'courier_return', 'დაჯავშნეთ კურიერი', "შეკვეთა #{$order->order_number} სრულად გადახდილია — საჭიროა კურიერი სამოსის მომხმარებლისთვის დასაბრუნებლად.");
    }
}
