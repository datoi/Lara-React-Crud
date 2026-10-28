<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KereNotification;
use App\Models\Message;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Order chat. Each order has two conversations, and Kere is in both: the
 * customer talks to Kere, and the tailor talks to Kere. The customer and the
 * tailor never reach each other (terms §18, privacy policy §9). Admins read
 * and answer through AdminController.
 */
class MessageController extends Controller
{
    // GET /api/orders/{orderId}/messages
    public function index(Request $request, string $orderId)
    {
        if (!ctype_digit($orderId)) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $user    = $request->user();
        $order   = Order::findOrFail($orderId);
        $channel = $this->channelFor($user, $order);

        if (!$channel) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $messages = Message::where('order_id', $orderId)
            ->where('channel', $channel)
            ->visibleTo($user)
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => $this->present($m, $user));

        return response()->json(['messages' => $messages]);
    }

    // POST /api/orders/{orderId}/messages
    public function store(Request $request, string $orderId)
    {
        if (!ctype_digit($orderId)) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $user    = $request->user();
        $order   = Order::findOrFail($orderId);
        $channel = $this->channelFor($user, $order);

        if (!$channel) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $msg = Message::create([
            'order_id'  => $order->id,
            'sender_id' => $user->id,
            'channel'   => $channel,
            'message'   => $data['message'],
        ]);

        // Whoever writes, it is Kere who answers.
        $who = $channel === 'tailor' ? 'მკერავი' : 'მომხმარებელი';
        KereNotification::toAdmins($order, 'new_message', "{$user->getFullName()} ({$who})", Str::limit($data['message'], 80));

        return response()->json(['message' => $this->present($msg, $user)], 201);
    }

    // GET /api/messages/counts — per-order count of Kere's messages to the
    // caller, for unread badges
    public function counts(Request $request)
    {
        $user     = $request->user();
        $channel  = $user->role === 'tailor' ? 'tailor' : 'customer';
        $orderIds = $channel === 'tailor'
            ? Order::where('tailor_id', $user->id)->releasedToTailor()->pluck('id')
            : Order::where('user_id', $user->id)->pluck('id');

        $counts = Message::whereIn('order_id', $orderIds)
            ->where('channel', $channel)
            ->fromKere()
            ->selectRaw('order_id, count(*) as total')
            ->groupBy('order_id')
            ->get()
            ->pluck('total', 'order_id');

        return response()->json(['counts' => $counts]);
    }

    /**
     * The conversation the caller takes part in on this order, if any. A
     * tailor has none on a marketplace order nobody has paid for yet: it is not
     * theirs until then (terms §6).
     */
    private function channelFor(User $user, Order $order): ?string
    {
        return match (true) {
            $order->user_id === $user->id => 'customer',
            $order->tailor_id !== null && $order->tailor_id === $user->id && $order->isReleasedToTailor() => 'tailor',
            default => null,
        };
    }

    /** The caller sees only their own messages and Kere's (Message::visibleTo), so anything not theirs is Kere's. */
    private function present(Message $m, User $viewer): array
    {
        return [
            'id'          => $m->id,
            'sender_id'   => $m->sender_id,
            'sender_name' => $m->sender_id === $viewer->id ? $viewer->getFullName() : 'Kere',
            'message'     => $m->message,
            'created_at'  => $m->created_at->toISOString(),
        ];
    }
}
