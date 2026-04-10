<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    private function authedUser(Request $request): ?User
    {
        $raw = $request->bearerToken();
        if (!$raw) return null;
        return User::where('api_token', hash('sha256', $raw))->first();
    }

    // POST /api/reviews
    public function store(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $data = $request->validate([
            'order_id' => 'required|integer',
            'rating'   => 'required|integer|min:1|max:5',
            'comment'  => 'required|string|max:1000',
        ]);

        $order = Order::with('items.product')->find($data['order_id']);

        if (!$order || $order->user_id !== $user->id) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if ($order->status !== 'finished') {
            return response()->json(['message' => 'You can only review a finished order.'], 422);
        }

        if (Review::where('order_id', $order->id)->exists()) {
            return response()->json(['message' => 'You have already reviewed this order.'], 422);
        }

        // For marketplace orders attach the first item's product_id
        $productId = null;
        if ($order->order_type === 'marketplace') {
            $productId = $order->items->first()?->product_id;
        }

        $review = Review::create([
            'order_id'   => $order->id,
            'user_id'    => $user->id,
            'product_id' => $productId,
            'rating'     => $data['rating'],
            'comment'    => $data['comment'],
        ]);

        return response()->json(['review' => $review], 201);
    }

    // GET /api/products/{productId}/reviews
    public function productReviews(int $productId)
    {
        $reviews = Review::with('user')
            ->where('product_id', $productId)
            ->latest()
            ->take(20)
            ->get()
            ->map(fn($r) => [
                'id'         => $r->id,
                'rating'     => $r->rating,
                'comment'    => $r->comment,
                'created_at' => $r->created_at->toISOString(),
                'reviewer'   => trim(($r->user->first_name ?? '') . ' ' . ($r->user->last_name ?? ''))
                                ?: ($r->user->name ?? 'Customer'),
            ]);

        $avg = $reviews->avg('rating');

        return response()->json([
            'reviews'        => $reviews,
            'average_rating' => $avg ? round($avg, 1) : null,
            'total'          => $reviews->count(),
        ]);
    }

    // GET /api/reviews/landing  — latest 5-star reviews for carousel
    public function landing()
    {
        $reviews = Review::with('user')
            ->where('rating', 5)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($r) => [
                'id'       => $r->id,
                'comment'  => $r->comment,
                'rating'   => $r->rating,
                'reviewer' => trim(($r->user->first_name ?? '') . ' ' . ($r->user->last_name ?? ''))
                              ?: ($r->user->name ?? 'Customer'),
            ]);

        return response()->json(['reviews' => $reviews]);
    }

    // GET /api/customer/orders/{orderId}/review-status
    public function orderReviewStatus(Request $request, int $orderId)
    {
        $user = $this->authedUser($request);
        if (!$user) return response()->json(['message' => 'Unauthorized.'], 401);

        $reviewed = Review::where('order_id', $orderId)->exists();
        return response()->json(['reviewed' => $reviewed]);
    }
}
