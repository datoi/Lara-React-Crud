<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewOrderAlert;
use App\Mail\OrderConfirmation;
use App\Mail\OrderStatusUpdated;
use App\Mail\TailorRequestReceived;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\TailorRequest;
use App\Models\User;
use App\Services\Notifier;
use App\Services\SmsService;
use Illuminate\Database\QueryException;
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

    private function notify(int $userId, string $type, string $title, string $body, int $orderId, array $extra = []): void
    {
        KereNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => array_merge(['order_id' => $orderId], $extra),
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

        if ($type === 'remodel') {
            return $this->storeRemodelOrder($request, $request->user());
        }

        return $this->storeMarketplaceOrder($request, $request->user());
    }

    private function storeMarketplaceOrder(Request $request, User $user)
    {
        // Two shapes reach this endpoint: a single product (product page) and a
        // cart checkout, which posts one request per tailor carrying that tailor's
        // lines. Both normalise into $lines so there is a single code path below.
        $isCart = $request->has('items');

        if ($isCart) {
            $data = $request->validate([
                'items' => 'required|array|min:1|max:50',
                'items.*.product_id' => 'required|integer|exists:products,id',
                'items.*.color' => 'nullable|string|max:100',
                'items.*.size' => 'nullable|string|max:50',
                'items.*.quantity' => 'required|integer|min:1|max:1000',
                'tailor_id' => 'nullable|integer|exists:users,id',
            ]);

            $lines = array_map(fn ($i) => [
                'product_id' => (int) $i['product_id'],
                'color' => $i['color'] ?? null,
                'size' => $i['size'] ?? null,
                'quantity' => (int) $i['quantity'],
                'cm_measurements' => null,
                'customization_note' => null,
            ], $data['items']);
        } else {
            $data = $request->validate([
                'product_id' => 'required|exists:products,id',
                'color' => 'nullable|string|max:100',
                'size' => 'nullable|string|max:50',
                'quantity' => 'required|integer|min:1|max:1000',
                'cm_measurements' => ['nullable', 'array'],
                'cm_measurements.chest' => ['nullable', 'numeric', 'min:0'],
                'cm_measurements.waist' => ['nullable', 'numeric', 'min:0'],
                'cm_measurements.hips' => ['nullable', 'numeric', 'min:0'],
                'cm_measurements.length' => ['nullable', 'numeric', 'min:0'],
                'customization_note' => ['nullable', 'string', 'max:1000'],
                'tailor_id' => 'nullable|integer|exists:users,id',
            ]);

            $lines = [[
                'product_id' => (int) $data['product_id'],
                'color' => $data['color'] ?? null,
                'size' => $data['size'] ?? null,
                'quantity' => (int) $data['quantity'],
                'cm_measurements' => $data['cm_measurements'] ?? null,
                'customization_note' => $data['customization_note'] ?? null,
            ]];
        }

        $products = Product::whereIn('id', array_column($lines, 'product_id'))->get()->keyBy('id');

        // Critical #7: prevent overselling. Totalled per product first, since the
        // same product can appear on several lines in different sizes.
        $wanted = [];
        foreach ($lines as $line) {
            $wanted[$line['product_id']] = ($wanted[$line['product_id']] ?? 0) + $line['quantity'];
        }

        foreach ($wanted as $productId => $quantity) {
            if ($products[$productId]->stock < $quantity) {
                return response()->json(['message' => 'Not enough stock available.'], 422);
            }
        }

        $shipping = (int) config('app.shipping_cost', 15);

        // Customer-chosen tailor takes priority; fall back to product's tailor then random
        if (! empty($data['tailor_id'])) {
            $tailor = User::where('id', $data['tailor_id'])->where('role', 'tailor')->first();
            if (! $tailor) {
                return response()->json(['message' => 'Selected tailor is not available.'], 422);
            }
        } else {
            $firstProduct = $products[$lines[0]['product_id']];
            $tailor = $firstProduct->tailor_id
                ? User::find($firstProduct->tailor_id)
                : $this->randomTailor();
        }

        // Critical #3: no tailor available
        if (! $tailor) {
            return response()->json(['message' => 'No tailor is currently available. Please try again later.'], 503);
        }

        // An order belongs to one tailor, so every line has to be theirs to make.
        // The cart groups by tailor client-side; this enforces it server-side.
        foreach ($lines as $line) {
            $lineProduct = $products[$line['product_id']];
            if ($lineProduct->tailor_id && $lineProduct->tailor_id !== $tailor->id) {
                return response()->json(['message' => 'All items in an order must belong to the same tailor.'], 422);
            }
        }

        $subtotal = 0;
        foreach ($lines as $line) {
            $subtotal += $products[$line['product_id']]->price * $line['quantity'];
        }

        try {
            $order = DB::transaction(function () use ($lines, $products, $wanted, $user, $tailor, $subtotal, $shipping) {
                // Critical #1: capture affected rows — throws so transaction rolls back if stock is gone
                foreach ($wanted as $productId => $quantity) {
                    $affected = Product::where('id', $productId)
                        ->where('stock', '>=', $quantity)
                        ->decrement('stock', $quantity);

                    if ($affected === 0) {
                        throw new \RuntimeException('out_of_stock');
                    }
                }

                $order = Order::create([
                    'user_id' => $user->id,
                    'tailor_id' => $tailor->id,
                    'order_number' => 'ORD-'.strtoupper(Str::random(8)),
                    'order_type' => 'marketplace',
                    'status' => 'pending',
                    'subtotal' => $subtotal,
                    'shipping' => $shipping,
                    'total' => $subtotal + $shipping,
                    'first_name' => $user->first_name ?? $user->name,
                    'last_name' => $user->last_name ?? '',
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => 'N/A',
                    'city' => 'Tbilisi',
                    'zip' => '0100',
                    'country' => 'GE',
                ]);

                foreach ($lines as $line) {
                    $lineProduct = $products[$line['product_id']];
                    $order->items()->create([
                        'product_id' => $lineProduct->id,
                        'product_name' => $lineProduct->name,
                        'color' => $line['color'],
                        'size' => $line['size'],
                        'quantity' => $line['quantity'],
                        'price' => $lineProduct->price,
                        'cm_measurements' => $line['cm_measurements'],
                        // Only accept a customization note when the tailor allows customization
                        'customization_note' => $lineProduct->is_customizable ? $line['customization_note'] : null,
                    ]);
                }

                $leadProduct = $products[$lines[0]['product_id']];
                $extra = count($lines) - 1;
                $label = $extra > 0
                    ? "\"{$leadProduct->name}\" and {$extra} more item(s)"
                    : "\"{$leadProduct->name}\"";

                $this->notify(
                    $tailor->id,
                    'new_order',
                    'New Order Received!',
                    "You received a new order for {$label} from {$user->getFullName()}.",
                    $order->id,
                    ['product_name' => $leadProduct->name]
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
            Log::error('OrderConfirmation email failed: '.$e->getMessage());
        }

        (new Notifier)->dual(
            $tailor,
            "Kere: ახალი შეკვეთა #{$order->order_number} — იხილეთ დეტალები თქვენს პანელზე.",
            new NewOrderAlert($order, $user)
        );

        return response()->json([
            'order_number' => $order->order_number,
            'total' => $order->total,
            'tailor_name' => $tailor->getFullName(),
        ], 201);
    }

    private function storeCustomOrder(Request $request, User $user)
    {
        $data = $request->validate([
            'tailor_assignment_mode' => 'nullable|in:manual,random',
            'custom_design_data' => 'required|array|max:50',
            // Support old shape (clothingType) and new shape (garment_type)
            'custom_design_data.clothingType' => 'nullable|string|max:100',
            'custom_design_data.garment_type' => 'nullable|string|max:100',
            // New fields from custom order flow
            'custom_design_data.design_file_url' => 'nullable|url|max:2000',
            'custom_design_data.tailor_notes' => 'nullable|string|max:500',
            'custom_design_data.customization_request' => 'nullable|string|max:1000',
            'custom_design_data.customization' => 'nullable|array|max:50',
            // Every key of customization needs its own rule. validate() returns
            // only the sub-paths it was given rules for, so once spec.* was
            // added the id maps beside it were silently dropped from the stored
            // order — the design could still be read by a tailor but never
            // reopened, re-ordered or reported on. Bounded and typed because the
            // parent array only limits its top-level key count, so nested
            // content would otherwise be unvalidated free-form JSON.
            'custom_design_data.customization.selections' => 'nullable|array|max:30',
            'custom_design_data.customization.selections.*' => 'nullable|integer|min:1',
            'custom_design_data.customization.color_selections' => 'nullable|array|max:60',
            'custom_design_data.customization.color_selections.*' => 'nullable|integer|min:1',
            'custom_design_data.customization.sub_selections' => 'nullable|array|max:30',
            'custom_design_data.customization.sub_selections.*' => 'nullable|integer|min:1',
            'custom_design_data.customization.fabric_id' => 'nullable|integer|min:1',
            // What the customer was actually looking at, so an order names the
            // garment rather than only the taxonomy bucket it is filed under.
            'custom_design_data.customization.product_name' => 'nullable|string|max:120',
            'custom_design_data.customization.product_slug' => 'nullable|string|max:120',
            // Readable spec snapshot from the studio.
            'custom_design_data.customization.spec' => 'nullable|array|max:30',
            'custom_design_data.customization.spec.*.attribute' => 'required_with:custom_design_data.customization.spec|string|max:60',
            'custom_design_data.customization.spec.*.option' => 'required_with:custom_design_data.customization.spec|string|max:120',
            'custom_design_data.customization.spec.*.price_modifier' => 'nullable|numeric|min:-9999|max:9999',
            // Existing fields
            'custom_design_data.fabric' => 'nullable|string|max:100',
            'custom_design_data.color' => 'nullable|string|max:100',
            'custom_design_data.embroidery' => 'nullable|string|max:200',
            'custom_design_data.pattern' => 'nullable|string|max:100',
            'custom_design_data.notes' => 'nullable|string|max:1000',
            'custom_design_data.measurements' => 'nullable|array|max:20',
            'custom_design_data.measurements.*' => 'nullable|numeric|min:0|max:999',
            'custom_design_data.designElements' => 'nullable|array|max:20',
            'custom_design_data.designElements.*' => 'nullable|string|max:100',
            'custom_design_data.colorPalette' => 'nullable|array|max:10',
            'custom_design_data.colorPalette.*' => 'nullable|string|max:50',
            'tailor_id' => 'nullable|integer|exists:users,id',
        ]);

        // Resolve the canonical garment identifier (new field takes priority)
        $garmentType = $data['custom_design_data']['garment_type']
            ?? $data['custom_design_data']['clothingType']
            ?? null;

        if (! $garmentType) {
            return response()->json(['message' => 'Garment type is required.'], 422);
        }

        $assignmentMode = $data['tailor_assignment_mode'] ?? 'manual';
        $shipping = (int) config('app.shipping_cost', 15);
        $status = 'pending';
        $tailor = null;

        if ($assignmentMode === 'manual' && ! empty($data['tailor_id'])) {
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
            // No tailor chosen: the order goes to the open pool where tailors send offers
            $status = 'pending_assignment';
        }

        $order = DB::transaction(function () use ($data, $user, $tailor, $shipping, $status, $assignmentMode, $garmentType) {
            $order = Order::create([
                'user_id' => $user->id,
                'tailor_id' => $tailor?->id,
                'order_number' => 'ORD-'.strtoupper(Str::random(8)),
                'order_type' => 'custom',
                'tailor_assignment_mode' => $assignmentMode,
                'status' => $status,
                'subtotal' => 0,
                'shipping' => $shipping,
                'total' => $shipping,
                'custom_design_data' => $data['custom_design_data'],
                'first_name' => $user->first_name ?? $user->name,
                'last_name' => $user->last_name ?? '',
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => 'N/A',
                'city' => 'Tbilisi',
                'zip' => '0100',
                'country' => 'GE',
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
                // Open pool: every approved tailor can see the design and send an offer
                User::where('role', 'tailor')
                    ->where(fn ($q) => $q->where('approval_status', 'approved')->orWhereNull('approval_status'))
                    ->where(fn ($q) => $q->where('is_suspended', false)->orWhereNull('is_suspended'))
                    ->pluck('id')
                    ->each(fn ($tailorId) => $this->notify(
                        $tailorId,
                        'open_order',
                        'New Design Request Available',
                        "A customer placed a custom {$garmentType} order. Send an offer from your dashboard if you want to make it.",
                        $order->id,
                        ['clothing_type' => $garmentType]
                    ));
            }

            return $order;
        });

        try {
            Mail::to($user->email)->send(new OrderConfirmation($order));
        } catch (\Throwable $e) {
            Log::error('OrderConfirmation email failed (custom): '.$e->getMessage());
        }

        if ($tailor) {
            (new Notifier)->dual(
                $tailor,
                "Kere: ახალი შეკვეთა #{$order->order_number} — იხილეთ დეტალები თქვენს პანელზე.",
                new NewOrderAlert($order, $user)
            );
        }

        return response()->json([
            'order_number' => $order->order_number,
            'total' => $order->total,
            'tailor_name' => $tailor?->getFullName(),
            'status' => $order->status,
        ], 201);
    }

    // ─── POST /api/orders (order_type=remodel) ────────────────────────────────
    // Customer sends an existing garment to be altered/remodeled. Broadcast to the
    // open pool; tailors send a priced offer; the customer picks one (chooseTailor).

    private function storeRemodelOrder(Request $request, User $user)
    {
        $data = $request->validate([
            'expected_price' => 'nullable|numeric|min:0|max:99999',
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:40',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:120',
            'zip' => 'nullable|string|max:20',
            'custom_design_data' => 'required|array|max:50',
            'custom_design_data.garment_type' => 'nullable|string|max:100',
            'custom_design_data.change_request' => 'required|string|max:2000',
            'custom_design_data.remodel_images' => 'required|array|min:1|max:6',
            'custom_design_data.remodel_images.*' => 'required|url|max:2000',
        ]);

        $shipping = (int) config('app.shipping_cost', 15);

        $order = DB::transaction(function () use ($data, $user, $shipping) {
            $order = Order::create([
                'user_id' => $user->id,
                'tailor_id' => null,
                'order_number' => 'RMD-'.strtoupper(Str::random(8)),
                'order_type' => 'remodel',
                'tailor_assignment_mode' => 'manual',
                'status' => 'pending_assignment',
                'subtotal' => 0,
                'shipping' => $shipping,
                'total' => $shipping,
                'expected_price' => $data['expected_price'] ?? null,
                'custom_design_data' => $data['custom_design_data'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'] ?? '',
                'email' => $user->email,
                'phone' => $data['phone'],
                'address' => $data['address'],
                'city' => $data['city'],
                'zip' => $data['zip'] ?? '',
                'country' => 'GE',
            ]);

            // Open pool: every approved, non-suspended tailor is invited to offer
            User::where('role', 'tailor')
                ->where(fn ($q) => $q->where('approval_status', 'approved')->orWhereNull('approval_status'))
                ->where(fn ($q) => $q->where('is_suspended', false)->orWhereNull('is_suspended'))
                ->pluck('id')
                ->each(fn ($tailorId) => $this->notify(
                    $tailorId,
                    'open_order',
                    'New Remodel Request Available',
                    "A customer wants a garment altered. Send a priced offer from your dashboard if you want the job.",
                    $order->id,
                    ['order_type' => 'remodel']
                ));

            return $order;
        });

        try {
            Mail::to($user->email)->send(new OrderConfirmation($order));
        } catch (\Throwable $e) {
            Log::error('OrderConfirmation email failed (remodel): '.$e->getMessage());
        }

        return response()->json([
            'order_number' => $order->order_number,
            'total' => $order->total,
            'status' => $order->status,
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
            ->map(fn ($o) => $this->formatOrder($o));

        return response()->json(['orders' => $orders]);
    }

    // ─── GET /api/tailor/open-orders ─────────────────────────────────────────
    // Unassigned custom orders any approved tailor can offer to make

    public function openOrders(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->approval_status === 'pending' || $user->approval_status === 'rejected') {
            return response()->json(['message' => 'Your account is pending approval.', 'code' => 'pending_approval'], 403);
        }

        $orders = Order::with('user')
            ->withCount('tailorRequests')
            ->whereIn('order_type', ['custom', 'remodel'])
            ->where('status', 'pending_assignment')
            ->whereNull('tailor_id')
            ->latest()
            ->get();

        $myRequests = TailorRequest::where('tailor_id', $user->id)
            ->whereIn('order_id', $orders->pluck('id'))
            ->pluck('status', 'order_id');

        return response()->json(['orders' => $orders->map(fn ($o) => [
            'id' => $o->id,
            'order_number' => $o->order_number,
            'order_type' => $o->order_type,
            'created_at' => $o->created_at?->toISOString(),
            'custom_design_data' => $o->custom_design_data,
            'expected_price' => $o->expected_price,
            'customer' => ['name' => $o->user->getFullName()],
            'requests_count' => $o->tailor_requests_count,
            'my_request_status' => $myRequests[$o->id] ?? null,
        ])->values()]);
    }

    // ─── POST /api/tailor/orders/{id}/request ────────────────────────────────
    // Tailor offers to make an open order; the customer picks the winner

    public function requestOrder(Request $request, int $id)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->approval_status === 'pending' || $user->approval_status === 'rejected') {
            return response()->json(['message' => 'Your account is pending approval.', 'code' => 'pending_approval'], 403);
        }

        $order = Order::with('user')
            ->where('id', $id)
            ->whereIn('order_type', ['custom', 'remodel'])
            ->where('status', 'pending_assignment')
            ->whereNull('tailor_id')
            ->first();

        if (! $order) {
            return response()->json(['message' => 'This order is no longer open for offers.'], 409);
        }

        // A remodel is a priced job — the tailor must quote a price. Custom orders
        // keep price optional (settled later), so the rule depends on the order type.
        $priceRule = $order->order_type === 'remodel'
            ? 'required|numeric|min:0|max:99999'
            : 'nullable|numeric|min:0|max:99999';

        $data = $request->validate([
            'message' => 'nullable|string|max:500',
            'offered_price' => $priceRule,
        ]);

        if (TailorRequest::where('order_id', $order->id)->where('tailor_id', $user->id)->exists()) {
            return response()->json(['message' => 'You already sent an offer for this order.'], 409);
        }

        try {
            $tailorRequest = TailorRequest::create([
                'order_id' => $order->id,
                'tailor_id' => $user->id,
                'message' => $data['message'] ?? null,
                'offered_price' => $data['offered_price'] ?? null,
                'status' => 'pending',
            ]);
        } catch (QueryException) {
            // Unique (order_id, tailor_id) race — treat as duplicate
            return response()->json(['message' => 'You already sent an offer for this order.'], 409);
        }

        $isRemodel = $order->order_type === 'remodel';
        $title = $isRemodel ? 'A Tailor Offered on Your Remodel!' : 'A Tailor Wants to Make Your Design!';
        $verb = $isRemodel ? 'offered to remodel your garment for order' : 'offered to make your order';

        $this->notify(
            $order->user_id,
            'tailor_request',
            $title,
            "{$user->getFullName()} {$verb} #{$order->order_number}. Compare offers on your dashboard and choose your tailor.",
            $order->id,
            ['tailor_id' => $user->id, 'tailor_request_id' => $tailorRequest->id]
        );

        $smsBody = $isRemodel
            ? "Kere: მკერავმა შემოგთავაზათ თქვენი სამოსის გადაკეთება — შეკვეთა #{$order->order_number}. აირჩიეთ მკერავი თქვენს პანელზე."
            : "Kere: მკერავს სურს თქვენი დიზაინის შეკერვა — შეკვეთა #{$order->order_number}. აირჩიეთ მკერავი თქვენს პანელზე.";

        try {
            if ($order->user->email) {
                Mail::to($order->user->email)->send(new TailorRequestReceived($order, $user));
            } elseif ($order->user->phone) {
                (new SmsService)->send($order->user->phone, $smsBody);
            }
        } catch (\Throwable $e) {
            Log::error('TailorRequestReceived notification failed: '.$e->getMessage());
        }

        return response()->json(['request' => [
            'id' => $tailorRequest->id,
            'status' => $tailorRequest->status,
            'offered_price' => $tailorRequest->offered_price,
        ]], 201);
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
            'pending' => ['processing', 'cancelled'],
            'processing' => ['finished', 'cancelled'],
            'finished' => [],
            'cancelled' => [],
        ];

        $allowed = $validTransitions[$oldStatus] ?? [];
        if ($newStatus !== $oldStatus && ! in_array($newStatus, $allowed, true)) {
            return response()->json(['message' => 'Invalid status transition.'], 422);
        }

        $order->update(['status' => $newStatus]);

        $notifyStatuses = ['processing', 'finished', 'cancelled'];
        $shouldNotify = in_array($data['status'], $notifyStatuses) && $data['status'] !== $oldStatus;

        if ($shouldNotify) {
            $statusLabel = match ($data['status']) {
                'processing' => 'Accepted — In Progress',
                'finished' => 'Completed',
                'cancelled' => 'Cancelled',
                default => ucfirst($data['status']),
            };

            try {
                $this->notify(
                    $order->user_id,
                    'order_status',
                    'Order #'.$order->id.' Status Updated',
                    "Your order #{$order->id} status has been updated to: {$statusLabel}.",
                    $order->id,
                    ['status' => $data['status']]
                );
            } catch (\Throwable $e) {
                Log::error('OrderStatusNotification failed: '.$e->getMessage());
            }

            try {
                Mail::to($order->user->email)->send(new OrderStatusUpdated($order, $data['status']));
            } catch (\Throwable $e) {
                Log::error('OrderStatusUpdated email failed: '.$e->getMessage());
            }

            if ($data['status'] === 'finished') {
                try {
                    User::where('role', 'admin')->pluck('id')->each(
                        fn ($adminId) => $this->notify(
                            $adminId,
                            'order_finished',
                            'Order #'.$order->id.' Ready for Delivery',
                            "{$user->getFullName()} finished order #{$order->id} — it's ready to be delivered to the customer.",
                            $order->id
                        )
                    );
                } catch (\Throwable $e) {
                    Log::error('Admin order_finished notification failed: '.$e->getMessage());
                }
            }
        }

        return response()->json(['order' => $this->formatOrder($order->fresh(['user', 'items.product']))]);
    }

    // ─── Shared formatter ────────────────────────────────────────────────────

    private function formatOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_type' => $order->order_type,
            'status' => $order->status,
            'subtotal' => $order->subtotal,
            'shipping' => $order->shipping,
            'total' => $order->total,
            'created_at' => $order->created_at?->toDateString(),
            'custom_design_data' => $order->custom_design_data,
            'customer' => [
                'name' => $order->user->getFullName(),
            ],
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'product_image' => (is_array($item->product?->images) && count($item->product->images))
                                        ? $item->product->images[0]
                                        : null,
                'color' => $item->color,
                'size' => $item->size,
                'quantity' => $item->quantity,
                'price' => $item->price,
                'cm_measurements' => $item->cm_measurements,
                'customization_note' => $item->customization_note,
            ])->values()->all(),
        ];
    }
}
