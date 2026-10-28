<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewOrderAlert;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\OrderClaim;
use App\Models\Review;
use App\Models\TailorRequest;
use App\Services\Notifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CustomerOrderController extends Controller
{
    // GET /api/customer/orders
    public function index(Request $request)
    {
        $user = $request->user();

        $orders = Order::with(['items.product', 'payments', 'claims'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $reviewedOrderIds = Review::whereIn('order_id', $orders->pluck('id'))
            ->pluck('order_id')
            ->flip();

        // No tailor is named here: the customer's contract is with Kere, and who
        // makes an order is not published to them (terms §3).
        $orders = $orders->map(function ($order) use ($reviewedOrderIds) {
            $items = $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'image' => $item->product?->images[0] ?? null,
                    'color' => $item->color,
                    'size' => $item->size,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'measurements' => $item->cm_measurements ?? [],
                    'customization_note' => $item->customization_note,
                ];
            });

            $stage = $order->paymentStageDue();
            // Sent only while a return can still be asked for: the button it
            // drives would otherwise outlive the 14 days and always fail.
            $returnableUntil = $order->claims->contains('type', 'return') ? null : $order->returnableUntil();
            $returnableUntil = $returnableUntil?->isFuture() ? $returnableUntil : null;

            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'order_type' => $order->order_type ?? 'marketplace',
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'subtotal' => $order->subtotal,
                'shipping' => $order->shipping,
                'total' => $order->total,
                'deposit_amount' => $order->deposit_amount,
                // What the customer can pay now, worked out where the pay
                // endpoint works it out, so the button and the server agree.
                'payment_due' => $stage ? ['stage' => $stage, 'amount' => $order->amountDue($stage)] : null,
                'paid_total' => $order->paidTotal(),
                'refunded_total' => $order->refundedTotal(),
                'offer' => $order->offerSummary(),
                'custom_design_data' => $order->custom_design_data,
                'expected_price' => $order->expected_price,
                'needed_by' => $order->needed_by?->toDateString(),
                'turnaround_days' => $order->turnaround_days,
                'due_date' => $order->due_date?->toDateString(),
                'proposed_due_date' => $order->proposed_due_date?->toDateString(),
                'deposit_paid_at' => $order->deposit_paid_at?->toISOString(),
                'paid_at' => $order->paid_at?->toISOString(),
                'picked_up_at' => $order->picked_up_at?->toISOString(),
                'received_at' => $order->received_at?->toISOString(),
                'intake_photos' => $order->intake_photos ?? [],
                'intake_notes' => $order->intake_notes,
                'finished_photos' => $order->finished_photos ?? [],
                'shipped_at' => $order->shipped_at?->toISOString(),
                'delivered_at' => $order->delivered_at?->toISOString(),
                'cancelled_at' => $order->cancelled_at?->toISOString(),
                'measurements_purged' => $order->measurements_purged_at !== null,
                'cancellable' => $order->isCancellableByCustomer(),
                'returnable_until' => $returnableUntil?->toDateString(),
                'reportable' => $order->status === 'delivered' && ! $order->claims->contains(fn ($c) => $c->type === 'problem' && $c->status === 'open'),
                'claims' => $order->claims->sortByDesc('id')->values()->map(fn (OrderClaim $c) => [
                    'id' => $c->id,
                    'type' => $c->type,
                    'status' => $c->status,
                    'message' => $c->message,
                    'photos' => $c->photos ?? [],
                    'resolution_note' => $c->resolution_note,
                    'created_at' => $c->created_at?->toISOString(),
                    'resolved_at' => $c->resolved_at?->toISOString(),
                ]),
                'items' => $items,
                'created_at' => $order->created_at->toISOString(),
                'has_review' => $reviewedOrderIds->has($order->id),
            ];
        });

        return response()->json(['orders' => $orders]);
    }

    // POST /api/customer/orders/{orderId}/accept-offer
    // The customer accepts Kere's offer (terms §8). The order goes to the
    // tailor whose estimate the offer was based on, at Kere's price; a remodel
    // then owes its first half with the delivery fee (terms §7).
    public function acceptOffer(Request $request, int $orderId)
    {
        $user = $request->user();

        $order = Order::with('offerRequest.tailor')->where('id', $orderId)->where('user_id', $user->id)->firstOrFail();

        if ($refusal = $this->refuseUnseenOffer($request, $order, 'accept')) {
            return $refusal;
        }

        $estimate = $order->offerRequest;
        $tailor = $estimate?->tailor;

        // What the offer was based on fell through after it was sent. The
        // customer cannot pick someone else (terms §3), so Kere is asked for a
        // new offer and the customer is told to wait for it.
        if (! $estimate || $estimate->status !== 'pending' || ! $tailor?->canTakeWork()) {
            $order->clearOffer();
            KereNotification::toAdmins($order, 'offer_lapsed', 'შეთავაზება გაუქმდა', "შეკვეთის #{$order->order_number} შეთავაზების მკერავი აღარ არის ხელმისაწვდომი — გაუგზავნეთ მომხმარებელს ახალი შეთავაზება.");

            return response()->json(['message' => 'This offer is no longer available. Kere will send you a new one.', 'code' => 'offer_unavailable'], 409);
        }

        $price = (float) $order->offer_price;
        $isRemodel = $order->order_type === 'remodel';

        $declinedTailorIds = DB::transaction(function () use ($order, $estimate, $price, $isRemodel) {
            $update = [
                'tailor_id' => $estimate->tailor_id,
                'status' => 'pending',
                'subtotal' => $price,
                'total' => $price + $order->shipping,
                'turnaround_days' => $order->offer_days,
            ];

            // A remodel is paid online from here on (terms §7, §8). A custom
            // order keeps 'not_required': it has no online payment yet.
            if ($isRemodel) {
                $update += [
                    'deposit_amount' => Order::firstPaymentFor($price, $order->shipping),
                    'payment_status' => 'unpaid',
                ];
            }

            $order->update($update);
            $estimate->update(['status' => 'accepted']);

            $declined = TailorRequest::where('order_id', $order->id)
                ->where('id', '!=', $estimate->id)
                ->where('status', 'pending');
            $declinedTailorIds = $declined->pluck('tailor_id');
            $declined->update(['status' => 'declined']);

            return $declinedTailorIds;
        });

        KereNotification::aboutOrder(
            $estimate->tailor_id,
            $order,
            'request_accepted',
            'შეფასება მიღებულია',
            $isRemodel
                ? "შეკვეთა #{$order->order_number} თქვენ გადმოგეცათ. სამუშაო დაიწყება მას შემდეგ, რაც მომხმარებელი პირველ ნახევარს გადაიხდის — მაშინ სამოსს კურიერი მოგიტანთ."
                : "შეკვეთა #{$order->order_number} თქვენ გადმოგეცათ — ის უკვე თქვენს შეკვეთებშია."
        );

        foreach ($declinedTailorIds as $tailorId) {
            KereNotification::aboutOrder($tailorId, $order, 'request_declined', 'შეკვეთა სხვას გადაეცა', "შეკვეთა #{$order->order_number} სხვა მკერავს გადაეცა. გმადლობთ შეფასებისთვის!");
        }

        KereNotification::toAdmins($order, 'offer_accepted', 'შეთავაზება მიღებულია', "მომხმარებელმა დაადასტურა შეკვეთის #{$order->order_number} შეთავაზება (₾".number_format($price, 2).').');

        // A remodel's tailor gets the full alert when the first half is paid
        // (PaymentController::announceDeposit) — before that there is no work.
        if (! $isRemodel) {
            (new Notifier)->dual(
                $tailor,
                "Kere: ახალი შეკვეთა #{$order->order_number} — იხილეთ დეტალები თქვენს პანელზე.",
                new NewOrderAlert($order->fresh(), $user)
            );
        }

        $order->refresh();
        $stage = $order->paymentStageDue();

        return response()->json(['order' => [
            'id' => $order->id,
            'status' => $order->status,
            'payment_due' => $stage ? ['stage' => $stage, 'amount' => $order->amountDue($stage)] : null,
        ]]);
    }

    // POST /api/customer/orders/{orderId}/decline-offer
    // The customer turns Kere's offer down (terms §8). The request stays open,
    // so Kere can send another, and the customer can still cancel it.
    public function declineOffer(Request $request, int $orderId)
    {
        $order = Order::where('id', $orderId)->where('user_id', $request->user()->id)->firstOrFail();

        if ($refusal = $this->refuseUnseenOffer($request, $order, 'decline')) {
            return $refusal;
        }

        $price = $order->offer_price;
        $order->clearOffer();

        KereNotification::toAdmins($order, 'offer_declined', 'შეთავაზება უარყოფილია', "მომხმარებელმა უარი თქვა შეკვეთის #{$order->order_number} შეთავაზებაზე (₾".number_format((float) $price, 2).'). შეგიძლიათ ჩატში დაუკავშირდეთ ან ახალი შეთავაზება გაუგზავნოთ.');

        return response()->json(['status' => $order->status]);
    }

    /**
     * The customer answers the offer they were shown, named by when it was
     * sent. Kere can replace an offer at any time (AdminController::sendOffer),
     * and accepting goes straight to payment, so an answer to an offer that has
     * since changed is refused rather than applied to a price nobody saw.
     */
    private function refuseUnseenOffer(Request $request, Order $order, string $action): ?JsonResponse
    {
        $data = $request->validate(['sent_at' => 'required|date']);

        if (! $order->hasOpenOffer()) {
            return response()->json(['message' => "There is no offer to {$action} on this order.", 'code' => 'no_offer'], 409);
        }

        if (Carbon::parse($data['sent_at'])->getTimestamp() !== $order->offer_sent_at->getTimestamp()) {
            return response()->json(['message' => 'Kere has changed this offer since you saw it.', 'code' => 'offer_changed'], 409);
        }

        return null;
    }

    // POST /api/customer/orders/{orderId}/cancel
    // Until work begins the customer can walk away (terms §14). Money already
    // paid is returned by an admin through the refund button, who can deduct
    // documented costs the terms allow; the admins are told it is due.
    public function cancel(Request $request, int $orderId)
    {
        $order = Order::with(['items', 'payments'])
            ->where('id', $orderId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (! $order->isCancellableByCustomer() || ! $order->cancel('customer')) {
            return response()->json(['message' => 'Work on this order has started. Please contact us to cancel it.', 'code' => 'order_not_cancellable'], 409);
        }

        $pending = TailorRequest::where('order_id', $order->id)->where('status', 'pending');
        $offeredTailorIds = $pending->pluck('tailor_id');
        $pending->update(['status' => 'declined']);

        KereNotification::aboutOrder($order->tailor_id, $order, 'order_status', 'შეკვეთა გაუქმდა', "მომხმარებელმა შეკვეთა #{$order->order_number} გააუქმა.");

        foreach ($offeredTailorIds as $tailorId) {
            KereNotification::aboutOrder($tailorId, $order, 'request_declined', 'შეკვეთა გაუქმდა', "მომხმარებელმა შეკვეთა #{$order->order_number} გააუქმა.");
        }

        return response()->json(['status' => 'cancelled']);
    }

    // POST /api/customer/orders/{orderId}/due-date
    // A new completion date takes effect only once the customer agrees (terms §17).
    public function respondToDueDate(Request $request, int $orderId)
    {
        $data = $request->validate(['accept' => 'required|boolean']);

        $order = Order::where('id', $orderId)->where('user_id', $request->user()->id)->firstOrFail();

        if (! $order->proposed_due_date) {
            return response()->json(['message' => 'There is no new date to answer.', 'code' => 'no_date_proposed'], 409);
        }

        $proposed = $order->proposed_due_date->toDateString();
        $order->update($data['accept']
            ? ['due_date' => $proposed, 'proposed_due_date' => null]
            : ['proposed_due_date' => null]);

        KereNotification::aboutOrder(
            $order->tailor_id,
            $order,
            'order_status',
            $data['accept'] ? 'ახალი ვადა მიღებულია' : 'ახალი ვადა უარყოფილია',
            $data['accept']
                ? "მომხმარებელი დაეთანხმა შეკვეთის #{$order->order_number} ახალ ვადას: {$proposed}."
                : "მომხმარებელი არ დაეთანხმა შეკვეთის #{$order->order_number} ახალ ვადას. ძალაში რჩება შეთანხმებული ვადა."
        );

        return response()->json([
            'due_date' => $order->due_date?->toDateString(),
            'proposed_due_date' => null,
        ]);
    }

    // POST /api/customer/orders/{orderId}/claims
    // A return within 14 days of delivery (terms §15) or a problem report with
    // photos (§16). The 24 hours the terms ask for is guidance, not a cut-off:
    // the same section says it does not shorten the customer's legal rights.
    public function storeClaim(Request $request, int $orderId)
    {
        $data = $request->validate([
            'type' => 'required|in:return,problem',
            'message' => 'nullable|required_if:type,problem|string|max:2000',
            'photos' => 'nullable|required_if:type,problem|array|max:10',
            'photos.*' => 'required|url|max:2000',
        ]);

        $order = Order::with(['items', 'claims'])
            ->where('id', $orderId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($data['type'] === 'return') {
            if ($order->order_type !== 'marketplace' || $order->status !== 'delivered' || $order->isMadeToMeasure()) {
                return response()->json(['message' => 'This order cannot be returned.', 'code' => 'return_not_available'], 422);
            }

            if (now()->greaterThan($order->returnableUntil())) {
                return response()->json(['message' => 'The 14 days to return this order have passed.', 'code' => 'return_window_closed'], 422);
            }

            if ($order->claims->contains('type', 'return')) {
                return response()->json(['message' => 'A return was already requested for this order.', 'code' => 'claim_exists'], 409);
            }
        } else {
            if ($order->status !== 'delivered') {
                return response()->json(['message' => 'A problem can be reported once the order is delivered.', 'code' => 'problem_not_available'], 422);
            }

            if ($order->claims->contains(fn ($c) => $c->type === 'problem' && $c->status === 'open')) {
                return response()->json(['message' => 'A problem report for this order is already open.', 'code' => 'claim_exists'], 409);
            }
        }

        $claim = OrderClaim::create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'type' => $data['type'],
            'message' => $data['message'] ?? null,
            'photos' => array_values($data['photos'] ?? []),
            'status' => 'open',
        ]);

        KereNotification::toAdmins(
            $order,
            'claim',
            $data['type'] === 'return' ? 'დაბრუნების მოთხოვნა' : 'პრობლემის შეტყობინება',
            $data['type'] === 'return'
                ? "მომხმარებელს სურს შეკვეთის #{$order->order_number} დაბრუნება (14-დღიანი უფლება). საჭიროა კურიერი."
                : "მომხმარებელმა შეკვეთაზე #{$order->order_number} პრობლემა შეგვატყობინა."
        );

        return response()->json(['claim' => [
            'id' => $claim->id,
            'type' => $claim->type,
            'status' => $claim->status,
        ]], 201);
    }
}
