<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    // ─── Token helper ────────────────────────────────────────────────────────

    private function authedUser(Request $request): ?User
    {
        $raw = $request->bearerToken();
        if (!$raw) return null;

        return User::where('api_token', hash('sha256', $raw))->first();
    }

    private function randomTailor(): ?User
    {
        return User::where('role', 'tailor')->inRandomOrder()->first();
    }

    // ─── POST /api/orders ────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $type = $request->input('order_type', 'marketplace');

        if ($type === 'custom') {
            return $this->storeCustomOrder($request, $user);
        }

        return $this->storeMarketplaceOrder($request, $user);
    }

    private function storeMarketplaceOrder(Request $request, User $user)
    {
        $data = $request->validate([
            'product_id'      => 'required|exists:products,id',
            'color'           => 'nullable|string',
            'size'            => 'nullable|string',
            'quantity'        => 'required|integer|min:1',
            'cm_measurements' => 'nullable|array',
        ]);

        $product  = Product::findOrFail($data['product_id']);
        $subtotal = $product->price * $data['quantity'];
        $shipping = 15;
        // Use the product's assigned tailor; fall back to any available tailor
        $tailor   = $product->tailor_id
            ? \App\Models\User::find($product->tailor_id)
            : $this->randomTailor();

        $order = Order::create([
            'user_id'      => $user->id,
            'tailor_id'    => $tailor?->id,
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'order_type'   => 'marketplace',
            'status'       => 'pending',
            'subtotal'     => $subtotal,
            'shipping'     => $shipping,
            'total'        => $subtotal + $shipping,
            'first_name'   => $user->first_name ?? $user->name,
            'last_name'    => $user->last_name  ?? '',
            'email'        => $user->email,
            'phone'        => $user->phone,
            'address'      => 'N/A',
            'city'         => 'Tbilisi',
            'zip'          => '0100',
            'country'      => 'GE',
        ]);

        $order->items()->create([
            'product_id'      => $product->id,
            'product_name'    => $product->name,
            'color'           => $data['color'] ?? null,
            'size'            => $data['size']  ?? null,
            'quantity'        => $data['quantity'],
            'price'           => $product->price,
            'cm_measurements' => $data['cm_measurements'] ?? null,
        ]);

        return response()->json([
            'order_number' => $order->order_number,
            'total'        => $order->total,
        ], 201);
    }

    private function storeCustomOrder(Request $request, User $user)
    {
        $data = $request->validate([
            'custom_design_data'            => 'required|array',
            'custom_design_data.clothingType' => 'required|string',
        ]);

        $shipping = 15;
        $subtotal = 0; // Custom orders quoted by tailor
        $tailor   = $this->randomTailor();

        $order = Order::create([
            'user_id'            => $user->id,
            'tailor_id'          => $tailor?->id,
            'order_number'       => 'ORD-' . strtoupper(Str::random(8)),
            'order_type'         => 'custom',
            'status'             => 'pending',
            'subtotal'           => $subtotal,
            'shipping'           => $shipping,
            'total'              => $subtotal + $shipping,
            'custom_design_data' => $data['custom_design_data'],
            'first_name'         => $user->first_name ?? $user->name,
            'last_name'          => $user->last_name  ?? '',
            'email'              => $user->email,
            'phone'              => $user->phone,
            'address'            => 'N/A',
            'city'               => 'Tbilisi',
            'zip'                => '0100',
            'country'            => 'GE',
        ]);

        return response()->json([
            'order_number' => $order->order_number,
            'total'        => $order->total,
        ], 201);
    }

    // ─── GET /api/tailor/orders ───────────────────────────────────────────────

    public function tailorOrders(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user || $user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $orders = Order::with(['user', 'items.product'])
            ->where('tailor_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($o) => $this->formatOrder($o));

        return response()->json(['orders' => $orders]);
    }

    // ─── PATCH /api/tailor/orders/{id}/status ────────────────────────────────

    public function updateStatus(Request $request, int $id)
    {
        $user = $this->authedUser($request);
        if (!$user || $user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $order = Order::where('id', $id)->where('tailor_id', $user->id)->firstOrFail();

        $data = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
        ]);

        $order->update(['status' => $data['status']]);

        return response()->json(['order' => $this->formatOrder($order->fresh(['user', 'items.product']))]);
    }

    // ─── Shared formatter ────────────────────────────────────────────────────

    private function formatOrder(Order $order): array
    {
        return [
            'id'                 => $order->id,
            'order_number'       => $order->order_number,
            'order_type'         => $order->order_type,
            'status'             => $order->status,
            'subtotal'           => $order->subtotal,
            'shipping'           => $order->shipping,
            'total'              => $order->total,
            'created_at'         => $order->created_at?->toDateString(),
            'custom_design_data' => $order->custom_design_data,
            'customer' => [
                'name'  => trim(($order->user->first_name ?? '') . ' ' . ($order->user->last_name ?? '')) ?: $order->user->name,
                'email' => $order->user->email,
                'phone' => $order->user->phone ?? '',
            ],
            'items' => $order->items->map(fn($item) => [
                'id'              => $item->id,
                'product_name'    => $item->product_name,
                'color'           => $item->color,
                'size'            => $item->size,
                'quantity'        => $item->quantity,
                'price'           => $item->price,
                'cm_measurements' => $item->cm_measurements,
            ])->values()->all(),
        ];
    }
}
