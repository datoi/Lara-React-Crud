<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;

class CustomerOrderController extends Controller
{
    // GET /api/customer/orders
    public function index(Request $request)
    {
        $user = $request->user();

        $orders = Order::with(['items.product', 'tailor'])
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
                        'id'           => $item->id,
                        'product_id'   => $item->product_id,
                        'product_name' => $item->product?->name ?? 'Custom Design',
                        'image'        => $item->product?->images[0] ?? null,
                        'color'        => $item->color,
                        'size'         => $item->size,
                        'quantity'     => $item->quantity,
                        'price'        => $item->price,
                        'measurements' => $item->cm_measurements ?? [],
                    ];
                });

                return [
                    'id'                 => $order->id,
                    'order_type'         => $order->order_type ?? 'marketplace',
                    'status'             => $order->status,
                    'total'              => $order->total,
                    'tailor_id'          => $order->tailor_id,
                    'tailor_name'        => $tailorName,
                    'custom_design_data' => $order->custom_design_data,
                    'items'              => $items,
                    'created_at'         => $order->created_at->toISOString(),
                    'has_review'         => $reviewedOrderIds->has($order->id),
                ];
            });

        return response()->json(['orders' => $orders]);
    }
}
