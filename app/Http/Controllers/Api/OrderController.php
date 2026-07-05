<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewOrderAlert;
use App\Mail\OrderConfirmation;
use App\Mail\OrderStatusUpdated;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    private function randomTailor(): ?User
    {
        return User::where('role', 'tailor')
            ->where(fn ($q) => $q->where('is_available', true)->orWhereNull('is_available'))
            ->inRandomOrder()
            ->first();
    }

    // Match the least-busy available tailor whose specialty matches the garment type
    private function matchTailorForGarment(string $garmentType): ?User
    {
        $keyword = '%' . str_replace(['-', '_'], ' ', strtolower($garmentType)) . '%';

        return User::where('role', 'tailor')
            ->where(fn ($q) => $q->where('is_available', true)->orWhereNull('is_available'))
            ->where(function ($q) use ($keyword) {
                $q->whereRaw('LOWER(specialty) LIKE ?', [$keyword])
                  ->orWhereNull('specialty'); // tailors without a specialty are eligible
            })
            ->orderByRaw(
                "(SELECT COUNT(*) FROM orders WHERE orders.tailor_id = users.id AND orders.status IN ('pending','processing')) ASC"
            )
            ->first();
    }

    private function notify(int $userId, string $type, string $title, string $body, int $orderId, array $extra = []): void
    {
        KereNotification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => array_merge(['order_id' => $orderId], $extra),
            'is_read' => false,
        ]);
    }

    // ─── POST /api/orders ────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $type = $request->input('order_type', 'marketplace');

        if ($type === 'custom') {
            return $this->storeCustomOrder($request, $request->user());
        }

        return $this->storeMarketplaceOrder($request, $request->user());
    }

    private function storeMarketplaceOrder(Request $request, User $user)
    {
        $data = $request->validate([
            'product_id'      => 'required|exists:products,id',
            'color'           => 'nullable|string|max:100',
            'size'            => 'nullable|string|max:50',
            'quantity'        => 'required|integer|min:1|max:1000',
            'cm_measurements'         => ['nullable', 'array'],
            'cm_measurements.chest'   => ['nullable', 'numeric', 'min:0'],
            'cm_measurements.waist'   => ['nullable', 'numeric', 'min:0'],
            'cm_measurements.hips'    => ['nullable', 'numeric', 'min:0'],
            'cm_measurements.length'  => ['nullable', 'numeric', 'min:0'],
            'tailor_id'               => 'nullable|integer|exists:users,id',
        ]);

        $product = Product::findOrFail($data['product_id']);

        // Critical #7: prevent overselling
        if ($product->stock < $data['quantity']) {
            return response()->json(['message' => 'Not enough stock available.'], 422);
        }

        $shipping = (int) config('app.shipping_cost', 15);

        // Customer-chosen tailor takes priority; fall back to product's tailor then random
        if (!empty($data['tailor_id'])) {
            $tailor = User::where('id', $data['tailor_id'])->where('role', 'tailor')->first();
            if (! $tailor) {
                return response()->json(['message' => 'Selected tailor is not available.'], 422);
            }
        } else {
            $tailor = $product->tailor_id
                ? User::find($product->tailor_id)
                : $this->randomTailor();
        }

        // Critical #3: no tailor available
        if (! $tailor) {
            return response()->json(['message' => 'No tailor is currently available. Please try again later.'], 503);
        }

        $unitPrice = $product->price;
        $subtotal  = $unitPrice * $data['quantity'];

        try {
        $order = DB::transaction(function () use ($data, $user, $tailor, $product, $unitPrice, $subtotal, $shipping) {
            // Critical #1: capture affected rows — throws so transaction rolls back if stock is gone
            $affected = Product::where('id', $product->id)
                ->where('stock', '>=', $data['quantity'])
                ->decrement('stock', $data['quantity']);

            if ($affected === 0) {
                throw new \RuntimeException('out_of_stock');
            }

            $order = Order::create([
                'user_id'      => $user->id,
                'tailor_id'    => $tailor->id,
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
                'price'           => $unitPrice,
                'cm_measurements' => $data['cm_measurements'] ?? null,
            ]);

            $this->notify(
                $tailor->id,
                'new_order',
                'New Order Received!',
                "You received a new order for \"{$product->name}\" from {$user->getFullName()}.",
                $order->id,
                ['product_name' => $product->name]
            );

            return $order;
        });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'out_of_stock') {
                return response()->json(['message' => 'Not enough stock available.'], 422);
            }
            throw $e;
        }

        try {
            $order->load('items');
            Mail::to($user->email)->send(new OrderConfirmation($order));
        } catch (\Throwable $e) {
            Log::error('OrderConfirmation email failed: ' . $e->getMessage());
        }

        try {
            Mail::to($tailor->email)->send(new NewOrderAlert($order, $user));
        } catch (\Throwable $e) {
            Log::error('NewOrderAlert email failed: ' . $e->getMessage());
        }

        return response()->json([
            'order_number' => $order->order_number,
            'total'        => $order->total,
            'tailor_name'  => $tailor->getFullName(),
        ], 201);
    }

    private function storeCustomOrder(Request $request, User $user)
    {
        $data = $request->validate([
            'tailor_assignment_mode'                  => 'nullable|in:manual,random',
            'custom_design_data'                      => 'required|array|max:50',
            // Support old shape (clothingType) and new shape (garment_type)
            'custom_design_data.clothingType'         => 'nullable|string|max:100',
            'custom_design_data.garment_type'         => 'nullable|string|max:100',
            // New fields from custom order flow
            'custom_design_data.design_file_url'      => 'nullable|url|max:2000',
            'custom_design_data.tailor_notes'         => 'nullable|string|max:500',
            'custom_design_data.customization'        => 'nullable|array|max:50',
            // Existing fields
            'custom_design_data.fabric'               => 'nullable|string|max:100',
            'custom_design_data.color'                => 'nullable|string|max:100',
            'custom_design_data.embroidery'           => 'nullable|string|max:200',
            'custom_design_data.pattern'              => 'nullable|string|max:100',
            'custom_design_data.notes'                => 'nullable|string|max:1000',
            'custom_design_data.measurements'         => 'nullable|array|max:20',
            'custom_design_data.measurements.*'       => 'nullable|numeric|min:0|max:999',
            'custom_design_data.designElements'       => 'nullable|array|max:20',
            'custom_design_data.designElements.*'     => 'nullable|string|max:100',
            'custom_design_data.colorPalette'         => 'nullable|array|max:10',
            'custom_design_data.colorPalette.*'       => 'nullable|string|max:50',
            'tailor_id'                               => 'nullable|integer|exists:users,id',
        ]);

        // Resolve the canonical garment identifier (new field takes priority)
        $garmentType = $data['custom_design_data']['garment_type']
            ?? $data['custom_design_data']['clothingType']
            ?? null;

        if (! $garmentType) {
            return response()->json(['message' => 'Garment type is required.'], 422);
        }

        $assignmentMode = $data['tailor_assignment_mode'] ?? 'manual';
        $shipping       = (int) config('app.shipping_cost', 15);
        $status         = 'pending';
        $tailor         = null;

        if ($assignmentMode === 'random') {
            $tailor = $this->matchTailorForGarment($garmentType);
            if (! $tailor) {
                $status = 'pending_assignment';
            }
        } else {
            // Manual: customer chose a specific tailor or left it null (fallback to random)
            if (! empty($data['tailor_id'])) {
                $tailor = User::where('id', $data['tailor_id'])
                    ->where('role', 'tailor')
                    ->where(fn ($q) => $q->where('is_available', true)->orWhereNull('is_available'))
                    ->first();

                if (! $tailor) {
                    // Tailor became unavailable between selection and submit
                    return response()->json([
                        'message' => 'This tailor is no longer available. Please choose another.',
                    ], 409);
                }
            } else {
                $tailor = $this->randomTailor();
                if (! $tailor) {
                    $status = 'pending_assignment';
                }
            }
        }

        $order = DB::transaction(function () use ($data, $user, $tailor, $shipping, $status, $assignmentMode, $garmentType) {
            $order = Order::create([
                'user_id'                => $user->id,
                'tailor_id'              => $tailor?->id,
                'order_number'           => 'ORD-' . strtoupper(Str::random(8)),
                'order_type'             => 'custom',
                'tailor_assignment_mode' => $assignmentMode,
                'status'                 => $status,
                'subtotal'               => 0,
                'shipping'               => $shipping,
                'total'                  => $shipping,
                'custom_design_data'     => $data['custom_design_data'],
                'first_name'             => $user->first_name ?? $user->name,
                'last_name'              => $user->last_name  ?? '',
                'email'                  => $user->email,
                'phone'                  => $user->phone,
                'address'                => 'N/A',
                'city'                   => 'Tbilisi',
                'zip'                    => '0100',
                'country'                => 'GE',
            ]);

            if ($tailor) {
                $this->notify(
                    $tailor->id,
                    'new_order',
                    'New Custom Design Order!',
                    "You received a custom {$garmentType} design from {$user->getFullName()}.",
                    $order->id,
                    ['clothing_type' => $garmentType]
                );
            } else {
                // Notify first admin of unassigned order
                $admin = User::where('role', 'admin')->first();
                if ($admin) {
                    $this->notify(
                        $admin->id,
                        'unassigned_order',
                        'Unassigned Order Needs Tailor',
                        "Order #{$order->order_number} needs a tailor assigned.",
                        $order->id
                    );
                }
            }

            return $order;
        });

        try {
            Mail::to($user->email)->send(new OrderConfirmation($order));
        } catch (\Throwable $e) {
            Log::error('OrderConfirmation email failed (custom): ' . $e->getMessage());
        }

        if ($tailor) {
            try {
                Mail::to($tailor->email)->send(new NewOrderAlert($order, $user));
            } catch (\Throwable $e) {
                Log::error('NewOrderAlert email failed (custom): ' . $e->getMessage());
            }
        }

        return response()->json([
            'order_number' => $order->order_number,
            'total'        => $order->total,
            'tailor_name'  => $tailor?->getFullName(),
            'status'       => $order->status,
        ], 201);
    }

    // ─── GET /api/tailor/orders ───────────────────────────────────────────────

    public function tailorOrders(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->approval_status === 'pending' || $user->approval_status === 'rejected') {
            return response()->json(['message' => 'Your account is pending approval.', 'code' => 'pending_approval'], 403);
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
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->approval_status === 'pending' || $user->approval_status === 'rejected') {
            return response()->json(['message' => 'Your account is pending approval.', 'code' => 'pending_approval'], 403);
        }

        $order = Order::with(['user', 'items.product'])
            ->where('id', $id)
            ->where('tailor_id', $user->id)
            ->firstOrFail();

        $data = $request->validate([
            'status' => 'required|in:pending,processing,finished,cancelled',
        ]);

        $oldStatus = $order->status;
        $newStatus = $data['status'];

        // Define valid forward-only transitions
        $validTransitions = [
            'pending'    => ['processing', 'cancelled'],
            'processing' => ['finished', 'cancelled'],
            'finished'   => [],
            'cancelled'  => [],
        ];

        $allowed = $validTransitions[$oldStatus] ?? [];
        if ($newStatus !== $oldStatus && !in_array($newStatus, $allowed, true)) {
            return response()->json(['message' => 'Invalid status transition.'], 422);
        }

        $order->update(['status' => $newStatus]);

        $notifyStatuses = ['processing', 'finished', 'cancelled'];
        $shouldNotify   = in_array($data['status'], $notifyStatuses) && $data['status'] !== $oldStatus;

        if ($shouldNotify) {
            $statusLabel = match ($data['status']) {
                'processing' => 'Accepted — In Progress',
                'finished'   => 'Completed',
                'cancelled'  => 'Cancelled',
                default      => ucfirst($data['status']),
            };

            try {
                $this->notify(
                    $order->user_id,
                    'order_status',
                    'Order #' . $order->id . ' Status Updated',
                    "Your order #{$order->id} status has been updated to: {$statusLabel}.",
                    $order->id,
                    ['status' => $data['status']]
                );
            } catch (\Throwable $e) {
                Log::error('OrderStatusNotification failed: ' . $e->getMessage());
            }

            try {
                Mail::to($order->user->email)->send(new OrderStatusUpdated($order, $data['status']));
            } catch (\Throwable $e) {
                Log::error('OrderStatusUpdated email failed: ' . $e->getMessage());
            }

            if ($data['status'] === 'finished') {
                try {
                    User::where('role', 'admin')->pluck('id')->each(
                        fn ($adminId) => $this->notify(
                            $adminId,
                            'order_finished',
                            'Order #' . $order->id . ' Ready for Delivery',
                            "{$user->getFullName()} finished order #{$order->id} — it's ready to be delivered to the customer.",
                            $order->id
                        )
                    );
                } catch (\Throwable $e) {
                    Log::error('Admin order_finished notification failed: ' . $e->getMessage());
                }
            }
        }

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
                'name' => $order->user->getFullName(),
            ],
            'items' => $order->items->map(fn($item) => [
                'id'              => $item->id,
                'product_name'    => $item->product_name,
                'product_image'   => (is_array($item->product?->images) && count($item->product->images))
                                        ? $item->product->images[0]
                                        : null,
                'color'           => $item->color,
                'size'            => $item->size,
                'quantity'        => $item->quantity,
                'price'           => $item->price,
                'cm_measurements' => $item->cm_measurements,
            ])->values()->all(),
        ];
    }
}
