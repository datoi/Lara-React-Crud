<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerOrderController extends Controller
{
    private function authedUser(Request $request): ?User
    {
        $raw = $request->bearerToken();
        if (!$raw) return null;
        return User::where('api_token', hash('sha256', $raw))->first();
    }

    // GET /api/customer/orders
    public function index(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $orders = Order::with(['items.product', 'tailor'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(function ($order) {
                $tailorName = null;
                if ($order->tailor) {
                    $tailorName = trim(($order->tailor->first_name ?? '') . ' ' . ($order->tailor->last_name ?? ''))
                        ?: $order->tailor->name;
                }

                $items = $order->items->map(function ($item) {
                    return [
                        'id'           => $item->id,
                        'product_id'   => $item->product_id,
                        'product_name' => $item->product->name ?? 'Custom Design',
                        'image'        => $item->product->images[0] ?? null,
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
                    'tailor_name'        => $tailorName,
                    'custom_design_data' => $order->custom_design_data,
                    'items'              => $items,
                    'created_at'         => $order->created_at->toISOString(),
                ];
            });

        return response()->json(['orders' => $orders]);
    }
}
