<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Order;
use Illuminate\Http\Request;

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
}
