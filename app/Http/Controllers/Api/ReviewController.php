<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // POST /api/reviews
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'order_id' => 'required|integer',
            'rating'   => 'required|integer|min:1|max:5',
            'comment'  => 'required|string|max:1000',
        ]);

        // Critical #4: ownership enforced at query level — no manual comparison needed
        $order = Order::with('items.product')
            ->where('user_id', $user->id)
            ->find($data['order_id']);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if (! in_array($order->status, ['shipped', 'finished', 'delivered'])) {
            return response()->json(['message' => 'You can only review a shipped, delivered, or finished order.'], 422);
        }

        if (Review::where('order_id', $order->id)->exists()) {
            return response()->json(['message' => 'You have already reviewed this order.'], 422);
        }

        $productId = null;
        if ($order->order_type === 'marketplace') {
            $productId = $order->items->first()?->product_id;
        }

        try {
            $review = Review::create([
                'order_id'   => $order->id,
                'user_id'    => $user->id,
                'product_id' => $productId,
                'rating'     => $data['rating'],
                'comment'    => $data['comment'],
            ]);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return response()->json(['message' => 'You have already reviewed this order.'], 422);
        }

        return response()->json(['review' => $review], 201);
    }

    // GET /api/products/{productId}/reviews
    public function productReviews(Request $request, int $productId)
    {
        // Major #8: paginated instead of hard-capped at 20
        $perPage = min((int) $request->get('per_page', 20), 50);

        $paginator = Review::with('user')
            ->where('product_id', $productId)
            ->latest()
            ->paginate($perPage);

        // Compute stats over the full set, not just the current page
        $stats = Review::where('product_id', $productId)
            ->selectRaw('COUNT(*) as total, AVG(rating) as avg_rating')
            ->first();

        $reviews = $paginator->getCollection()->map(fn($r) => [
            'id'         => $r->id,
            'rating'     => $r->rating,
            'comment'    => $r->comment,
            'created_at' => $r->created_at->toISOString(),
            'reviewer'   => $r->user->getFullName() ?: 'Customer',
        ]);

        return response()->json([
            'reviews'        => $reviews,
            'average_rating' => $stats->total > 0 ? round((float) $stats->avg_rating, 1) : null,
            'total'          => (int) $stats->total,
            'current_page'   => $paginator->currentPage(),
            'last_page'      => $paginator->lastPage(),
            'per_page'       => $paginator->perPage(),
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
                'reviewer' => $r->user->getFullName() ?: 'Customer',
            ]);

        return response()->json(['reviews' => $reviews]);
    }

    // GET /api/customer/orders/{orderId}/review-status
    public function orderReviewStatus(Request $request, int $orderId)
    {
        $user = $request->user();

        // Scope to this user's orders only
        $exists = Order::where('id', $orderId)->where('user_id', $user->id)->exists();
        if (! $exists) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $reviewed = Review::where('order_id', $orderId)->exists();
        return response()->json(['reviewed' => $reviewed]);
    }
}
