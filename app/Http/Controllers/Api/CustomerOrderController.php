<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewOrderAlert;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\TailorRequest;
use App\Services\Notifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerOrderController extends Controller
{
    // GET /api/customer/orders
    public function index(Request $request)
    {
        $user = $request->user();

        $orders = Order::with(['items.product', 'tailor'])
            ->withCount('tailorRequests')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $reviewedOrderIds = Review::whereIn('order_id', $orders->pluck('id'))
            ->pluck('order_id')
            ->flip();

        $orders = $orders->map(function ($order) use ($reviewedOrderIds) {
            $tailorName = $order->tailor?->getFullName();

            $items = $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name ?? 'Custom Design',
                    'image' => $item->product?->images[0] ?? null,
                    'color' => $item->color,
                    'size' => $item->size,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'measurements' => $item->cm_measurements ?? [],
                    'customization_note' => $item->customization_note,
                ];
            });

            return [
                'id' => $order->id,
                'order_type' => $order->order_type ?? 'marketplace',
                'status' => $order->status,
                'total' => $order->total,
                'tailor_id' => $order->tailor_id,
                'tailor_name' => $tailorName,
                'custom_design_data' => $order->custom_design_data,
                'items' => $items,
                'created_at' => $order->created_at->toISOString(),
                'has_review' => $reviewedOrderIds->has($order->id),
                'tailor_requests_count' => $order->tailor_requests_count,
            ];
        });

        return response()->json(['orders' => $orders]);
    }

    // GET /api/customer/orders/{orderId}/requests
    public function requests(Request $request, int $orderId)
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)->where('user_id', $user->id)->firstOrFail();

        $tailorRequests = TailorRequest::with('tailor')
            ->where('order_id', $order->id)
            ->latest()
            ->get();

        // Weighted rating per tailor across their products' reviews
        $ratingStats = Product::whereIn('products.tailor_id', $tailorRequests->pluck('tailor_id'))
            ->join('reviews', 'reviews.product_id', '=', 'products.id')
            ->selectRaw('products.tailor_id, COUNT(reviews.id) as cnt, AVG(reviews.rating) as avg_r')
            ->groupBy('products.tailor_id')
            ->get()
            ->keyBy('tailor_id');

        return response()->json(['requests' => $tailorRequests->map(function ($tr) use ($ratingStats) {
            $stat = $ratingStats->get($tr->tailor_id);

            return [
                'id' => $tr->id,
                'status' => $tr->status,
                'message' => $tr->message,
                'created_at' => $tr->created_at?->toISOString(),
                'tailor' => [
                    'id' => $tr->tailor->id,
                    'name' => $tr->tailor->getFullName(),
                    'specialty' => $tr->tailor->specialty,
                    'years_experience' => $tr->tailor->years_experience,
                    'turnaround_days' => $tr->tailor->turnaround_days,
                    'profile_image' => $tr->tailor->profile_image,
                    'avg_rating' => $stat ? round((float) $stat->avg_r, 1) : null,
                    'reviews_count' => $stat ? (int) $stat->cnt : 0,
                ],
            ];
        })->values()]);
    }

    // POST /api/customer/orders/{orderId}/choose-tailor
    public function chooseTailor(Request $request, int $orderId)
    {
        $user = $request->user();

        $data = $request->validate([
            'request_id' => 'required|integer',
        ]);

        $order = Order::where('id', $orderId)->where('user_id', $user->id)->firstOrFail();

        if ($order->status !== 'pending_assignment' || $order->tailor_id) {
            return response()->json(['message' => 'This order already has a tailor assigned.'], 409);
        }

        $chosen = TailorRequest::with('tailor')
            ->where('order_id', $order->id)
            ->where('id', $data['request_id'])
            ->first();

        if (! $chosen || $chosen->status !== 'pending') {
            return response()->json(['message' => 'This offer is no longer available.'], 422);
        }

        $tailor = $chosen->tailor;
        $tailorEligible = $tailor
            && (! $tailor->approval_status || $tailor->approval_status === 'approved')
            && ! $tailor->is_suspended;

        if (! $tailorEligible) {
            return response()->json(['message' => 'This tailor is no longer available. Please choose another offer.'], 409);
        }

        $declinedTailorIds = DB::transaction(function () use ($order, $chosen) {
            $order->update(['tailor_id' => $chosen->tailor_id, 'status' => 'pending']);
            $chosen->update(['status' => 'accepted']);

            $declined = TailorRequest::where('order_id', $order->id)
                ->where('id', '!=', $chosen->id)
                ->where('status', 'pending');
            $declinedTailorIds = $declined->pluck('tailor_id');
            $declined->update(['status' => 'declined']);

            return $declinedTailorIds;
        });

        KereNotification::create([
            'user_id' => $chosen->tailor_id,
            'type' => 'request_accepted',
            'title' => 'Your Offer Was Accepted!',
            'body' => "{$user->getFullName()} chose you for order #{$order->order_number}. It's now in your orders list.",
            'data' => ['order_id' => $order->id],
            'is_read' => false,
        ]);

        foreach ($declinedTailorIds as $tailorId) {
            KereNotification::create([
                'user_id' => $tailorId,
                'type' => 'request_declined',
                'title' => 'Order Assigned to Another Tailor',
                'body' => "Order #{$order->order_number} was assigned to another tailor. Thanks for offering!",
                'data' => ['order_id' => $order->id],
                'is_read' => false,
            ]);
        }

        (new Notifier)->dual(
            $chosen->tailor,
            "Kere: თქვენი შემოთავაზება მიღებულია! შეკვეთა #{$order->order_number} — იხილეთ დეტალები თქვენს პანელზე.",
            new NewOrderAlert($order->fresh(), $user)
        );

        return response()->json(['order' => [
            'id' => $order->id,
            'status' => $order->status,
            'tailor_id' => $order->tailor_id,
            'tailor_name' => $chosen->tailor->getFullName(),
        ]]);
    }
}
