<?php

namespace App\Services;

use App\Models\KereNotification;
use App\Models\Order;
use App\Models\OrderRefund;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Gives a customer money back through Flitt (terms §9, §14–§16).
 *
 * An admin names an amount; it is taken from the order's card payments, the
 * latest first, each reversed by its own gateway reference — a remodel's two
 * halves are two separate Flitt orders. Every request to the gateway is kept
 * as an OrderRefund row with its own idempotency key, so the record shows what
 * was asked for and what Flitt answered even when the answer was no.
 *
 * Money only counts as refunded once Flitt says 'approved' or 'processing'.
 * Anything else stops the run and reports how far it got: half a refund is a
 * state an admin has to see, not one to paper over.
 *
 * A request Flitt never answered stays 'pending': the reverse may have gone
 * through with only the answer lost. Nothing new is sent on that order until
 * it is settled, by asking again with its own reverse_id, which Flitt cannot
 * carry out twice. Sending a fresh request instead is how a lost answer turns
 * into the same money refunded twice.
 */
class RefundService
{
    /** Gateway answers that mean the money is on its way back. */
    private const ACCEPTED = ['approved', 'processing', 'created', 'reversed'];

    public function __construct(private FlittService $flitt) {}

    /**
     * @return array{ok: bool, code?: string, refunded: float}
     */
    public function refund(Order $order, float $amount, User $admin, ?string $note = null): array
    {
        $amount = round($amount, 2);

        // Two admins, or one double click, must not both reverse the same money.
        $lock = Cache::lock("order-refund-{$order->id}", 120);

        if (! $lock->get()) {
            return ['ok' => false, 'code' => 'refund_in_progress', 'refunded' => 0.0];
        }

        try {
            $unanswered = $order->refunds()->where('status', 'pending')->with('payment')->orderBy('id')->get();

            if ($unanswered->isNotEmpty()) {
                $confirmed = 0.0;

                foreach ($unanswered as $attempt) {
                    $outcome = $this->send($attempt, retry: true);

                    if ($outcome === null) {
                        return $this->finish($order, 'refund_unresolved', $confirmed);
                    }

                    if ($outcome) {
                        $confirmed += $attempt->amount;
                    }
                }

                // The money the admin is asking about may be exactly what just
                // turned out to have gone back, so nothing more is sent until
                // they have seen it.
                if ($confirmed > 0) {
                    return $this->finish($order, 'refund_confirmed_earlier', $confirmed);
                }
            }

            $payments = $order->payments()->orderByDesc('paid_at')->orderByDesc('id')->get();
            $available = round($payments->sum(fn ($p) => $p->refundable()), 2);

            if ($amount <= 0 || $amount > $available) {
                return ['ok' => false, 'code' => 'refund_exceeds_paid', 'refunded' => 0.0];
            }

            $remaining = $amount;
            $refunded = 0.0;

            foreach ($payments as $payment) {
                $part = round(min($remaining, $payment->refundable()), 2);

                if ($part <= 0) {
                    continue;
                }

                $attempt = OrderRefund::create([
                    'order_id' => $order->id,
                    'order_payment_id' => $payment->id,
                    'amount' => $part,
                    'status' => 'pending',
                    'reverse_id' => Str::lower(Str::random(32)),
                    'admin_id' => $admin->id,
                    'note' => $note,
                ]);
                $attempt->setRelation('payment', $payment);

                $outcome = $this->send($attempt, retry: false);

                if ($outcome !== true) {
                    return $this->finish($order, $outcome === null ? 'refund_unresolved' : 'refund_failed', $refunded);
                }

                $refunded = round($refunded + $part, 2);
                $remaining = round($remaining - $part, 2);

                if ($remaining <= 0) {
                    break;
                }
            }

            return $this->finish($order, null, $refunded);
        } finally {
            $lock->release();
        }
    }

    /**
     * Ask Flitt to carry out one refund request and record its answer: true
     * when the money is on its way back, false when Flitt refused, null when
     * the outcome is still unknown and the request stays pending.
     */
    private function send(OrderRefund $attempt, bool $retry): ?bool
    {
        $payment = $attempt->payment;
        $response = $this->flitt->reverse($payment->reference, $this->flitt->toMinor($attempt->amount), $attempt->reverse_id, $attempt->note);

        if ($response === null) {
            return null;
        }

        $status = $response['reverse_status'] ?? null;

        if (($response['response_status'] ?? null) !== 'success' || ! in_array($status, self::ACCEPTED, true)) {
            // Asked a second time, Flitt may answer the repeated reverse_id
            // with an error rather than with what became of the first request,
            // which says nothing about whether the money went back. Only an
            // explicit decline settles it.
            if ($retry && $status !== 'declined') {
                return null;
            }

            $attempt->update([
                'status' => 'failed',
                'response_code' => (string) ($response['error_code'] ?? $response['response_code'] ?? $status ?? 'unknown'),
            ]);

            return false;
        }

        $attempt->update(['status' => $status === 'approved' || $status === 'reversed' ? 'approved' : 'processing']);
        $payment->increment('refunded_amount', $attempt->amount);

        return true;
    }

    /**
     * The result to report, after telling the customer about whatever money
     * did go back — also when the run stopped part way.
     *
     * @return array{ok: bool, code?: string, refunded: float}
     */
    private function finish(Order $order, ?string $code, float $refunded): array
    {
        $refunded = round($refunded, 2);

        if ($refunded > 0) {
            KereNotification::aboutOrder(
                $order->user_id,
                $order,
                'order_status',
                'თანხა დაბრუნდა',
                "შეკვეთაზე #{$order->order_number} ₾".number_format($refunded, 2).' დაგიბრუნდათ ბარათზე. ბანკს ჩარიცხვას რამდენიმე დღე შეიძლება დასჭირდეს.'
            );
        }

        return $code === null
            ? ['ok' => true, 'refunded' => $refunded]
            : ['ok' => false, 'code' => $code, 'refunded' => $refunded];
    }
}
