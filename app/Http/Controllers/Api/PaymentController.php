<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewOrderAlert;
use App\Mail\OrderConfirmation;
use App\Models\KereNotification;
use App\Models\Order;
use App\Services\FlittService;
use App\Services\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Card payment for marketplace orders, via Flitt.
 *
 * An order is created unpaid, the client asks for a checkout token, and the
 * result arrives back one of two ways: Flitt's server callback, or the client
 * asking us to re-check. Both land in markPaid(), which is idempotent, so a
 * callback and a poll racing each other settle the order exactly once.
 *
 * Paying is what announces an order: markPaid is where the tailor is told and
 * the customer's confirmation is sent, hanging off the single conditional
 * update so a callback and a poll racing cannot announce it twice.
 *
 * Live money is still gated on the merchant being approved — what remains is in
 * README §"Flitt go-live". Errors carry a `code` as well as a message, because
 * the message is English and the interface is not.
 */
class PaymentController extends Controller
{
    /** Order statuses that still have work ahead of them, and so may be paid for. */
    private const PAYABLE_STATUSES = ['pending', 'pending_assignment', 'processing'];

    public function __construct(private FlittService $flitt) {}

    // ─── POST /api/orders/{id}/pay ────────────────────────────────────────────
    // Start a payment: a checkout token for an unpaid marketplace order the
    // caller owns. The ownership check is the authorisation — an order id is
    // guessable and the token is worth money.

    public function pay(Request $request, int $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->order_type !== 'marketplace') {
            return response()->json(['message' => 'This order is not payable online.', 'code' => 'order_not_payable_online'], 422);
        }

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'This order is already paid.', 'code' => 'order_already_paid'], 409);
        }

        if ($order->payment_status !== 'unpaid') {
            return response()->json(['message' => 'This order can no longer be paid.', 'code' => 'order_not_payable'], 409);
        }

        // An order that is no longer live must not be payable. Cancelling only
        // writes `status`, so a cancelled order keeps payment_status 'unpaid'
        // and would otherwise still mint a checkout token — taking money for
        // work nobody is going to do.
        if (! in_array($order->status, self::PAYABLE_STATUSES, true)) {
            return response()->json(['message' => 'This order can no longer be paid.', 'code' => 'order_not_payable'], 409);
        }

        // Flitt renders its own page, so the language the customer is reading the
        // site in has to travel with the request. The client sends what it is
        // displaying; the service decides whether that is a language Flitt speaks.
        $requested = $request->input('lang');

        $token = $this->flitt->createCheckoutToken($order, is_string($requested) ? $requested : null);

        if (! $token) {
            return response()->json(['message' => 'Could not start the payment. Please try again.', 'code' => 'payment_start_failed'], 502);
        }

        return response()->json([
            'token'        => $token,
            'checkout_url' => $this->flitt->checkoutUrl($token),
            'order_number' => $order->order_number,
            'amount'       => $order->total,
            'currency'     => 'GEL',
        ]);
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

        if ($order->payment_status === 'paid') {
            return response()->json(['payment_status' => 'paid']);
        }

        // Ask about the attempt currently in flight. An order that has never been
        // handed to the gateway has no reference and nothing to ask about.
        if (! $order->payment_reference) {
            return response()->json(['payment_status' => $order->payment_status]);
        }

        $status = $this->flitt->fetchOrderStatus($order->payment_reference);

        if ($status && ($status['order_status'] ?? null) === 'approved') {
            $this->markPaid($order, $status);
        }

        return response()->json(['payment_status' => $order->fresh()->payment_status]);
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
            $this->markPaid($order, $data);
        }

        return response()->json(['status' => 'ok'], 200);
    }

    // ─── Finalise ─────────────────────────────────────────────────────────────

    /**
     * Credit a payment to an order, once. Called from both the webhook and the
     * client poll, so every branch below has to be safe to hit twice.
     */
    private function markPaid(Order $order, array $flitt): void
    {
        if ($order->payment_status === 'paid') {
            return;
        }

        // Only marketplace orders are ever handed to the gateway, so a payment
        // naming any other kind means something is wrong upstream — do not
        // credit it on the strength of a signature alone.
        if ($order->order_type !== 'marketplace') {
            Log::error("Flitt payment for non-marketplace order {$order->order_number} (order_type={$order->order_type}) — needs manual review.");

            return;
        }

        // Anything other than 'unpaid' here means the order was closed to
        // payment — cancelled, expired — and a payment landed anyway. Quietly
        // reopening it would revive an order nobody is working on, so it goes
        // to a human instead.
        if ($order->payment_status !== 'unpaid') {
            Log::error("Flitt payment on non-unpaid order {$order->order_number} (payment_status={$order->payment_status}) — needs manual review.");

            return;
        }

        // Never credit on the gateway's word about what was owed. A missing
        // currency is not treated as GEL: the check exists to catch exactly the
        // payload that does not say, so absence has to fail it.
        $expected = $this->flitt->minorUnits($order);
        $paid     = (int) ($flitt['amount'] ?? 0);
        $currency = $flitt['currency'] ?? null;

        if ($paid !== $expected || $currency !== 'GEL') {
            Log::error("Flitt amount mismatch for {$order->order_number}: got {$paid} ".($currency ?? 'no currency')." expected {$expected} GEL.");

            return;
        }

        // The callback and the client poll are designed to race, so the read
        // above cannot be trusted to still hold. Let the database decide: only
        // the update that finds the order still 'unpaid' wins, and anything
        // that must happen once per payment hangs off that single row.
        $credited = Order::where('id', $order->id)
            ->where('payment_status', 'unpaid')
            ->update([
                'payment_status' => 'paid',
                'payment_id'     => $flitt['payment_id'] ?? null,
                'paid_at'        => now(),
            ]);

        if ($credited === 1) {
            $order->refresh();
            $this->announcePaidOrder($order);
        }
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
}
