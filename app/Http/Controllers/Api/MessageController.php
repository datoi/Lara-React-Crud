<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KereNotification;
use App\Models\Message;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    // GET /api/orders/{orderId}/messages
    public function index(Request $request, int $orderId)
    {
        $user  = $request->user();
        $order = Order::findOrFail($orderId);

        if ($order->user_id !== $user->id && $order->tailor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $messages = Message::with('sender')
            ->where('order_id', $orderId)
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'          => $m->id,
                'sender_id'   => $m->sender_id,
                'sender_name' => $m->sender->getFullName(),
                'message'     => $m->message,
                'created_at'  => $m->created_at->toISOString(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    // POST /api/orders/{orderId}/messages
    public function store(Request $request, int $orderId)
    {
        $user  = $request->user();
        $order = Order::findOrFail($orderId);

        if ($order->user_id !== $user->id && $order->tailor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $msg = Message::create([
            'order_id'  => $order->id,
            'sender_id' => $user->id,
            'message'   => $data['message'],
        ]);

        $msg->load('sender');

        // Notify the other party
        $recipientId = ($user->id === $order->user_id) ? $order->tailor_id : $order->user_id;
        if ($recipientId) {
            KereNotification::create([
                'user_id' => $recipientId,
                'type'    => 'new_message',
                'title'   => $user->getFullName(),
                'body'    => Str::limit($data['message'], 80),
                'data'    => ['order_id' => $order->id],
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => [
                'id'          => $msg->id,
                'sender_id'   => $msg->sender_id,
                'sender_name' => $msg->sender->getFullName(),
                'message'     => $msg->message,
                'created_at'  => $msg->created_at->toISOString(),
            ],
        ], 201);
    }

    // GET /api/messages/counts — per-order count of messages from others (for unread badges)
    public function counts(Request $request)
    {
        $user     = $request->user();
        $orderIds = Order::where('user_id', $user->id)
            ->orWhere('tailor_id', $user->id)
            ->pluck('id');

        $counts = Message::whereIn('order_id', $orderIds)
            ->where('sender_id', '!=', $user->id)
            ->selectRaw('order_id, count(*) as total')
            ->groupBy('order_id')
            ->get()
            ->pluck('total', 'order_id');

        return response()->json(['counts' => $counts]);
    }
}
