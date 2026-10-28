<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OfferSent;
use App\Mail\OrderStatusUpdated;
use App\Mail\TailorApproved;
use App\Mail\TailorRejected;
use App\Models\KereNotification;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderClaim;
use App\Models\Review;
use App\Models\TailorRequest;
use App\Models\User;
use App\Services\Notifier;
use App\Services\RefundService;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // GET /api/admin/orders
    public function orders()
    {
        $orders = Order::with(['user', 'tailor', 'items', 'payments', 'refunds', 'tailorRequests.tailor', 'review'])
            ->withCount(['messages', 'claims as open_claims_count' => fn ($q) => $q->where('status', 'open')])
            ->latest()
            ->get();

        $scores = Review::scoresForTailors($orders->flatMap(fn ($o) => $o->tailorRequests->pluck('tailor_id')));

        $orders = $orders->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'order_type' => $o->order_type,
                'status' => $o->status,
                'total' => $o->total,
                'created_at' => $o->created_at?->toDateString(),
                'customer' => $o->user ? [
                    'id' => $o->user->id,
                    'name' => $o->user->getFullName(),
                    'email' => $o->user->email,
                ] : null,
                'tailor_assignment_mode' => $o->tailor_assignment_mode ?? 'manual',
                'tailor' => $o->tailor ? [
                    'id' => $o->tailor->id,
                    'name' => $o->tailor->getFullName(),
                ] : null,
                'items' => $o->items->map(fn ($i) => [
                    'id' => $i->id,
                    'product_name' => $i->product_name,
                    'quantity' => $i->quantity,
                    'price' => $i->price,
                ])->values()->all(),
                'message_count' => $o->messages_count,
                'delivered_at' => $o->delivered_at?->toDateString(),
                'payment_status' => $o->payment_status,
                'paid_remodel' => $o->isPaidRemodel(),
                'deposit_amount' => $o->deposit_amount,
                'paid_total' => $o->paidTotal(),
                'refunded_total' => $o->refundedTotal(),
                'due_date' => $o->due_date?->toDateString(),
                'picked_up_at' => $o->picked_up_at?->toDateString(),
                'received_at' => $o->received_at?->toDateString(),
                'shipped_at' => $o->shipped_at?->toDateString(),
                'cancelled_at' => $o->cancelled_at?->toDateString(),
                'open_claims_count' => $o->open_claims_count,
                // The courier step an admin can take next, worked out here so
                // the buttons match what the endpoints below will accept.
                'next_courier_step' => $this->nextCourierStep($o),
                'refunds' => $o->refunds->sortByDesc('id')->values()->map(fn ($r) => [
                    'amount' => $r->amount,
                    'status' => $r->status,
                    'note' => $r->note,
                    'created_at' => $r->created_at?->toDateString(),
                ]),
                // Tailors' internal estimates, which only admins see, and the
                // offer Kere made the customer from one of them (terms §8).
                'estimates' => $o->tailorRequests->sortBy('id')->values()->map(fn ($r) => [
                    'id' => $r->id,
                    // The tailor's internal score sits beside their estimate,
                    // so it can inform which one becomes Kere's offer.
                    'tailor' => $r->tailor ? [
                        'id' => $r->tailor->id,
                        'name' => $r->tailor->getFullName(),
                        'score' => $scores->get($r->tailor->id),
                    ] : null,
                    'price' => $r->offered_price,
                    'days' => $r->ready_in_days,
                    'message' => $r->message,
                    'status' => $r->status,
                ]),
                'offer' => $o->hasOpenOffer() ? $o->offerSummary() + ['request_id' => $o->offer_request_id] : null,
                'review' => $o->review ? ['rating' => $o->review->rating, 'status' => $o->review->status] : null,
            ]);

        return response()->json(['orders' => $orders]);
    }

    /**
     * The courier step that comes next for an order (terms §13): collect a paid
     * remodel's garment, hand a finished and fully paid order to the courier,
     * or record it delivered. Null when nothing is waiting on Kere.
     */
    private function nextCourierStep(Order $order): ?string
    {
        if ($order->isPaidRemodel() && $order->status === 'pending' && ! $order->picked_up_at
            && in_array($order->payment_status, ['deposit_paid', 'paid'], true)) {
            return 'pickup';
        }

        if ($order->status === 'finished') {
            $paidUp = $order->order_type === 'custom' || $order->payment_status === 'paid' || $order->payment_status === 'not_required';

            return $paidUp ? 'ship' : null;
        }

        return $order->status === 'shipped' ? 'deliver' : null;
    }

    // PATCH /api/admin/orders/{id}/picked-up
    // The courier collected a remodel's garment from the customer.
    public function markPickedUp(int $id)
    {
        $order = Order::findOrFail($id);

        if ($this->nextCourierStep($order) !== 'pickup') {
            return response()->json(['message' => 'This order is not waiting for a pickup.', 'code' => 'step_not_available'], 409);
        }

        $order->update(['picked_up_at' => now()]);

        KereNotification::aboutOrder($order->user_id, $order, 'order_status', 'სამოსი წაღებულია', "კურიერმა წაიღო შეკვეთის #{$order->order_number} სამოსი და მკერავს მიუტანს.");
        KereNotification::aboutOrder($order->tailor_id, $order, 'order_status', 'სამოსი გზაშია', "შეკვეთის #{$order->order_number} სამოსი კურიერს გადაეცა. მიღებისას ატვირთეთ ფოტოები.");

        return response()->json(['picked_up_at' => $order->picked_up_at?->toDateString()]);
    }

    // PATCH /api/admin/orders/{id}/ship
    // A finished order, fully paid, goes to the courier for delivery.
    public function shipOrder(int $id)
    {
        $order = Order::with('user')->findOrFail($id);

        if ($this->nextCourierStep($order) !== 'ship') {
            return response()->json(['message' => 'This order cannot be handed to the courier yet.', 'code' => 'step_not_available'], 409);
        }

        $order->update(['status' => 'shipped', 'shipped_at' => now()]);

        KereNotification::aboutOrder($order->user_id, $order, 'order_status', 'შეკვეთა გზაშია', "შეკვეთა #{$order->order_number} კურიერს გადაეცა და მალე მოგიტანთ.");

        try {
            if ($order->user?->email) {
                Mail::to($order->user->email)->send(new OrderStatusUpdated($order, 'shipped'));
            }
        } catch (\Throwable $e) {
            Log::error('OrderStatusUpdated (shipped) email failed: '.$e->getMessage());
        }

        return response()->json(['status' => 'shipped', 'shipped_at' => $order->shipped_at?->toDateString()]);
    }

    // POST /api/admin/orders/{id}/refund
    public function refundOrder(Request $request, RefundService $refunds, int $id)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:99999',
            'note' => 'nullable|string|max:500',
        ]);

        $order = Order::findOrFail($id);
        $result = $refunds->refund($order, (float) $data['amount'], $request->user(), $data['note'] ?? null);

        if (! $result['ok']) {
            $status = match ($result['code']) {
                'refund_in_progress', 'refund_confirmed_earlier' => 409,
                'refund_exceeds_paid' => 422,
                default => 502,
            };

            return response()->json([
                'message' => 'The refund did not go through.',
                'code' => $result['code'],
                'refunded' => $result['refunded'],
            ], $status);
        }

        $order->load('payments');

        return response()->json([
            'refunded' => $result['refunded'],
            'refunded_total' => $order->refundedTotal(),
        ]);
    }

    // GET /api/admin/claims
    public function claims()
    {
        $claims = OrderClaim::with(['order', 'user'])
            ->orderByRaw("CASE WHEN status = 'open' THEN 0 ELSE 1 END")
            ->latest()
            ->limit(200)
            ->get()
            ->map(fn (OrderClaim $c) => [
                'id' => $c->id,
                'type' => $c->type,
                'status' => $c->status,
                'message' => $c->message,
                'photos' => $c->photos ?? [],
                'resolution_note' => $c->resolution_note,
                'created_at' => $c->created_at?->toISOString(),
                'resolved_at' => $c->resolved_at?->toISOString(),
                'order' => $c->order ? [
                    'id' => $c->order->id,
                    'order_number' => $c->order->order_number,
                    'order_type' => $c->order->order_type,
                    'total' => $c->order->total,
                    'delivered_at' => $c->order->delivered_at?->toDateString(),
                ] : null,
                'customer' => $c->user ? ['name' => $c->user->getFullName(), 'email' => $c->user->email, 'phone' => $c->user->phone] : null,
            ]);

        return response()->json(['claims' => $claims]);
    }

    // PATCH /api/admin/claims/{id}
    public function resolveClaim(Request $request, int $id)
    {
        $data = $request->validate([
            'status' => 'required|in:resolved,rejected',
            'note' => 'nullable|string|max:1000',
        ]);

        $claim = OrderClaim::with('order')->findOrFail($id);

        if ($claim->status !== 'open') {
            return response()->json(['message' => 'This claim is already closed.', 'code' => 'claim_closed'], 409);
        }

        $claim->update([
            'status' => $data['status'],
            'resolution_note' => $data['note'] ?? null,
            'resolved_at' => now(),
        ]);

        $what = $claim->type === 'return' ? 'დაბრუნების მოთხოვნა' : 'პრობლემის შეტყობინება';
        $body = $data['status'] === 'resolved'
            ? "შეკვეთის #{$claim->order->order_number} {$what} განხილულია."
            : "შეკვეთის #{$claim->order->order_number} {$what} არ დაკმაყოფილდა.";
        if (filled($data['note'] ?? null)) {
            $body .= " {$data['note']}";
        }
        KereNotification::aboutOrder($claim->user_id, $claim->order, 'order_status', $what, $body);

        return response()->json(['status' => $claim->status]);
    }

    // GET /api/admin/reviews — everything customers wrote, waiting ones first
    public function reviews()
    {
        $reviews = Review::with(['order.items', 'order.tailor', 'user'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest()
            ->limit(300)
            ->get()
            ->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'status' => $r->status,
                'created_at' => $r->created_at?->toISOString(),
                'order' => $r->order ? ['id' => $r->order->id, 'order_number' => $r->order->order_number] + $r->publicSubject() : null,
                // Who wrote it and who made the garment: for Kere only, never published.
                'customer' => $r->user ? ['name' => $r->user->getFullName(), 'email' => $r->user->email] : null,
                'tailor' => $r->order?->tailor ? ['id' => $r->order->tailor->id, 'name' => $r->order->tailor->getFullName()] : null,
            ]);

        return response()->json(['reviews' => $reviews]);
    }

    // PATCH /api/admin/reviews/{id} — publish or hide; either can be undone
    public function updateReview(Request $request, int $id)
    {
        $data = $request->validate(['status' => 'required|in:published,hidden']);

        $review = Review::findOrFail($id);
        $review->update(['status' => $data['status']]);

        return response()->json(['status' => $review->status]);
    }

    // PATCH /api/admin/orders/{id}/deliver
    public function deliverOrder(int $id)
    {
        $order = Order::with('user')->findOrFail($id);

        // A paid remodel goes through the courier hand-over first; other orders
        // made before the courier step existed can still be recorded delivered
        // straight from finished.
        $deliverable = $order->status === 'shipped' || ($order->status === 'finished' && ! $order->isPaidRemodel());

        if (! $deliverable) {
            return response()->json(['message' => 'Order must be finished before it can be delivered.'], 422);
        }

        $order->update(['status' => 'delivered', 'delivered_at' => now()]);

        if ($order->user_id) {
            KereNotification::create([
                'user_id' => $order->user_id,
                'type' => 'order_status',
                'title' => 'თქვენი შეკვეთა ჩაბარდა',
                'body' => "თქვენი შეკვეთა #{$order->order_number} ჩაბარებულია. შეგიძლიათ დატოვოთ შეფასება.",
                'data' => ['order_id' => $order->id, 'status' => 'delivered'],
                'is_read' => false,
            ]);
        }

        try {
            if ($order->user) {
                Mail::to($order->user->email)->send(new OrderStatusUpdated($order, 'delivered'));
            }
        } catch (\Throwable $e) {
            Log::error('OrderStatusUpdated (delivered) email failed: '.$e->getMessage());
        }

        return response()->json([
            'status' => 'delivered',
            'delivered_at' => $order->fresh()->delivered_at?->toDateString(),
        ]);
    }

    // GET /api/admin/orders/{orderId}/messages
    public function orderMessages(Request $request, string $orderId)
    {
        if (! ctype_digit($orderId)) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $order = Order::find($orderId);
        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $channel = $request->query('channel') === 'tailor' ? 'tailor' : 'customer';

        $messages = Message::with('sender')
            ->where('order_id', $orderId)
            ->where('channel', $channel)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'sender_name' => $m->sender->getFullName(),
                'message' => $m->message,
                'created_at' => $m->created_at->toISOString(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    // POST /api/admin/orders/{orderId}/messages
    // Kere answers in either conversation: with the customer, or with the
    // tailor. The two never meet (terms §18, privacy policy §9).
    public function postMessage(Request $request, string $orderId)
    {
        if (! ctype_digit($orderId)) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $order = Order::findOrFail($orderId);

        $data = $request->validate([
            'channel' => 'required|in:customer,tailor',
            'message' => 'required|string|max:2000',
        ]);

        $recipientId = $data['channel'] === 'tailor' ? $order->tailor_id : $order->user_id;

        if (! $recipientId) {
            return response()->json(['message' => 'This order has no tailor yet.', 'code' => 'no_tailor'], 422);
        }

        $message = Message::create([
            'order_id' => $order->id,
            'sender_id' => $request->user()->id,
            'channel' => $data['channel'],
            'message' => $data['message'],
        ]);

        KereNotification::aboutOrder($recipientId, $order, 'new_message', 'Kere', Str::limit($data['message'], 80));

        return response()->json(['message' => [
            'id' => $message->id,
            'sender_id' => $message->sender_id,
            'sender_name' => $request->user()->getFullName(),
            'message' => $message->message,
            'created_at' => $message->created_at->toISOString(),
        ]], 201);
    }

    // GET /api/admin/users
    public function users()
    {
        $users = User::latest()->get();
        $scores = Review::scoresForTailors($users->where('role', 'tailor')->pluck('id'));

        $users = $users->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->getFullName(),
            'email' => $u->email,
            'phone' => $u->phone,
            'role' => $u->role,
            'is_suspended' => (bool) $u->is_suspended,
            'approval_status' => $u->approval_status,
            // A sixteen- or seventeen-year-old whose guardian has not confirmed.
            // The account cannot order until they do, and nothing else would
            // show that it is waiting — the guardian's own details stay out of
            // this list, which is a queue to act on, not a place to read them.
            'guardian_consent_pending' => $u->needsGuardianConsent() && $u->guardian_consent_at === null,
            'score' => $u->role === 'tailor' ? $scores->get($u->id) : null,
            'created_at' => $u->created_at?->toDateString(),
        ]);

        return response()->json(['users' => $users]);
    }

    // PATCH /api/admin/orders/{id}/assign
    public function assignTailor(Request $request, int $id)
    {
        $data = $request->validate([
            'tailor_id' => 'required|integer|exists:users,id',
        ]);

        $tailor = User::where('id', $data['tailor_id'])
            ->where('role', 'tailor')
            ->firstOrFail();

        $order = Order::findOrFail($id);
        $wasUnassigned = $order->status === 'pending_assignment';

        // A remodel is priced and paid through Kere's offer (terms §7, §8);
        // handing it straight to a tailor would skip both.
        if ($wasUnassigned && $order->order_type === 'remodel') {
            return response()->json(['message' => 'Send the customer an offer instead.', 'code' => 'use_offer'], 409);
        }

        $updates = ['tailor_id' => $tailor->id];
        if ($wasUnassigned) {
            $updates['status'] = 'pending';
        }
        $order->update($updates);

        // Notify the customer that their order now has a tailor
        if ($wasUnassigned && $order->user_id) {
            KereNotification::create([
                'user_id' => $order->user_id,
                'type' => 'order_status',
                'title' => 'შეკვეთაზე მკერავი დაინიშნა',
                'body' => "თქვენს შეკვეთაზე #{$order->order_number} მკერავი დაინიშნა.",
                'data' => ['order_id' => $order->id],
                'is_read' => false,
            ]);
        }

        return response()->json([
            'tailor' => ['id' => $tailor->id, 'name' => $tailor->getFullName()],
            'status' => $order->fresh()->status,
        ]);
    }

    // POST /api/admin/orders/{id}/offer
    // Kere's offer to the customer, based on one tailor's estimate (terms §8).
    // The admin sets the price and time the customer sees; the estimate
    // decides who makes the order if the customer accepts. Sending again
    // replaces the offer.
    public function sendOffer(Request $request, int $id)
    {
        $data = $request->validate([
            'request_id' => 'required|integer',
            'price' => 'required|numeric|min:1|max:99999',
            'days' => 'required|integer|min:1|max:120',
            'note' => 'nullable|string|max:500',
        ]);

        $order = Order::with('user')->findOrFail($id);

        if ($order->status !== 'pending_assignment' || $order->tailor_id) {
            return response()->json(['message' => 'This order is no longer waiting for an offer.', 'code' => 'order_not_open'], 409);
        }

        $estimate = TailorRequest::with('tailor')->where('order_id', $order->id)->where('id', $data['request_id'])->first();

        if (! $estimate || $estimate->status !== 'pending' || ! $estimate->tailor?->canTakeWork()) {
            return response()->json(['message' => 'This estimate cannot be used for an offer.', 'code' => 'estimate_unavailable'], 422);
        }

        $order->update([
            'offer_request_id' => $estimate->id,
            'offer_price' => round((float) $data['price'], 2),
            'offer_days' => $data['days'],
            'offer_note' => $data['note'] ?? null,
            'offer_sent_at' => now(),
        ]);

        KereNotification::aboutOrder(
            $order->user_id,
            $order,
            'kere_offer',
            'Kere-ის შეთავაზება',
            "შეკვეთაზე #{$order->order_number} მზადაა შეთავაზება: ₾".number_format($order->offer_price, 2)." და მიწოდება, {$order->offer_days} დღე. დაადასტურეთ ან უარი თქვით თქვენს პანელზე."
        );

        try {
            if ($order->user?->email) {
                Mail::to($order->user->email)->send(new OfferSent($order));
            } elseif ($order->user?->phone) {
                (new SmsService)->send($order->user->phone, "Kere: შეკვეთაზე #{$order->order_number} მზადაა შეთავაზება. დაადასტურეთ ან უარი თქვით თქვენს პანელზე.");
            }
        } catch (\Throwable $e) {
            Log::error("OfferSent notification failed for {$order->order_number}: ".$e->getMessage());
        }

        return response()->json(['offer' => $order->offerSummary() + ['request_id' => $order->offer_request_id]]);
    }

    // PATCH /api/admin/users/{id}/suspend
    public function suspendUser(int $id)
    {
        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot suspend admin accounts.'], 422);
        }

        $user->update(['is_suspended' => ! $user->is_suspended]);

        return response()->json(['is_suspended' => (bool) $user->is_suspended]);
    }

    // GET /api/admin/tailors/pending
    public function pendingTailors()
    {
        $tailors = User::where('role', 'tailor')
            ->where('approval_status', 'pending')
            ->latest()
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->getFullName(),
                'email' => $u->email,
                'phone' => $u->phone,
                'created_at' => $u->created_at?->toDateString(),
            ]);

        return response()->json(['tailors' => $tailors]);
    }

    // POST /api/admin/tailors/{id}/approve
    public function approveTailor(int $id)
    {
        $tailor = User::where('role', 'tailor')->findOrFail($id);
        $tailor->update(['approval_status' => 'approved']);

        KereNotification::create([
            'user_id' => $tailor->id,
            'type' => 'account_approved',
            'title' => 'თქვენი ანგარიში დაადასტურეს',
            'body' => 'შეგიძლიათ შეხვიდეთ, დაამატოთ პროდუქტები და მიიღოთ შეკვეთები.',
            'data' => [],
            'is_read' => false,
        ]);

        (new Notifier)->dual(
            $tailor,
            'Kere: თქვენი ანგარიში დადასტურდა — შეგიძლიათ შეხვიდეთ, დაამატოთ პროდუქტები და მიიღოთ შეკვეთები.',
            new TailorApproved($tailor)
        );

        return response()->json(['approval_status' => 'approved']);
    }

    // POST /api/admin/tailors/{id}/reject
    public function rejectTailor(Request $request, int $id)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $tailor = User::where('role', 'tailor')->findOrFail($id);
        $tailor->update(['approval_status' => 'rejected']);

        $rejectSms = 'Kere: სამწუხაროდ, თქვენი განაცხადი ვერ დადასტურდა.';
        if (! empty($data['reason'])) {
            $rejectSms .= ' მიზეზი: '.$data['reason'];
        }
        (new Notifier)->dual(
            $tailor,
            $rejectSms,
            new TailorRejected($tailor, $data['reason'] ?? '')
        );

        return response()->json(['approval_status' => 'rejected']);
    }
}
