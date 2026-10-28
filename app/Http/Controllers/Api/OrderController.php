<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderConfirmation;
use App\Mail\OrderStatusUpdated;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\TailorRequest;
use App\Models\User;
use App\Support\Measurements;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
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

    /**
     * The open-order types a tailor may see and offer on. Remodels only reach
     * tailors who said they take that work; the feed and the offer share this,
     * so one cannot show an order the other would refuse.
     */
    private function openOrderTypesFor(User $tailor): array
    {
        return $tailor->does_remodeling ? ['custom', 'remodel'] : ['custom'];
    }

    /**
     * The design as stored: its measurements normalised into the one shape every
     * snapshot uses, or left out entirely when none were given. A copy — the
     * customer's profile is never referenced, so editing it later cannot change
     * an order already placed.
     */
    private function withMeasurementSnapshot(array $design): array
    {
        $measurements = Measurements::normalize($design['measurements'] ?? null);
        unset($design['measurements']);

        return $measurements === null ? $design : $design + ['measurements' => $measurements];
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
        $user = $request->user();

        // One gate for every kind of order, at the only door into them.
        //
        // An account exists from the moment its one-time code checks out, which
        // is before date of birth and the terms are asked for — and a sixteen-
        // or seventeen-year-old's account waits on an adult besides. Neither is
        // a state that may buy anything, and putting the check here rather than
        // in each of the three branches means a fourth kind of order cannot
        // quietly miss it.
        if (! $user->mayPlaceOrders()) {
            return response()->json([
                'message' => $user->registrationComplete()
                    ? 'This account is waiting for a parent or guardian to confirm.'
                    : 'Please finish setting up your account first.',
                'code' => $user->registrationComplete()
                    ? 'guardian_consent_pending'
                    : 'registration_incomplete',
            ], 403);
        }

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
        // cart checkout, which posts one request per delivery, the lines one
        // tailor makes. Both normalise into $lines so there is a single code
        // path below.
        $isCart = $request->has('items');

        if ($isCart) {
            $data = $request->validate([
                'items' => 'required|array|min:1|max:50',
                'items.*.product_id' => 'required|integer|exists:products,id',
                'items.*.color' => 'nullable|string|max:100',
                'items.*.size' => 'nullable|string|max:50',
                'items.*.quantity' => 'required|integer|min:1|max:1000',
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
                ...Measurements::rules('cm_measurements'),
                'customization_note' => ['nullable', 'string', 'max:1000'],
            ]);

            $lines = [[
                'product_id' => (int) $data['product_id'],
                'color' => $data['color'] ?? null,
                'size' => $data['size'] ?? null,
                'quantity' => (int) $data['quantity'],
                'cm_measurements' => Measurements::normalize($data['cm_measurements'] ?? null),
                'customization_note' => $data['customization_note'] ?? null,
            ]];
        }

        $products = Product::whereIn('id', array_column($lines, 'product_id'))->get()->keyBy('id');

        // A product its tailor cannot make without measurements cannot be ordered
        // without them. Cart lines carry none, so such a product is bought from
        // its own page, where the measurements are asked for.
        foreach ($lines as $line) {
            $required = Measurements::known($products[$line['product_id']]->required_measurements ?? []);
            $missing = array_values(array_diff($required, array_keys($line['cm_measurements'] ?? [])));

            if ($missing !== []) {
                return response()->json([
                    'message' => 'This product needs your measurements.',
                    'code' => 'measurements_required',
                    'missing' => $missing,
                ], 422);
            }
        }

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

        // Kere decides who makes it, never the customer (terms §3): the tailor
        // who listed the product, or for a product nobody listed, any tailor.
        $firstProduct = $products[$lines[0]['product_id']];
        $tailor = $firstProduct->tailor_id
            ? User::find($firstProduct->tailor_id)
            : $this->randomTailor();

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
                    // Stated rather than left to the column default, so the
                    // response carries it and the order is explicitly owed.
                    'payment_status' => 'unpaid',
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

                // Nobody is told about this order yet. A marketplace order is
                // created unpaid and the customer goes straight to the gateway,
                // where plenty of them will change their mind — announcing it
                // here puts tailors to work on orders that were never paid for.
                // PaymentController::markPaid does the announcing, once money
                // has actually arrived.

                return $order;
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'out_of_stock') {
                return response()->json(['message' => 'Not enough stock available.'], 422);
            }
            throw $e;
        }

        // The confirmation email and the tailor's SMS both wait for payment too
        // — see PaymentController::announcePaidOrder. Confirming an order the
        // customer has not paid for tells them the wrong thing just as surely as
        // it tells the tailor the wrong thing.

        return response()->json([
            // The id is what the client needs to open payment on the order it
            // has just placed; the number is what it shows the customer.
            'id' => $order->id,
            'order_number' => $order->order_number,
            'total' => $order->total,
            'payment_status' => $order->payment_status,
        ], 201);
    }

    private function storeCustomOrder(Request $request, User $user)
    {
        if (! config('app.custom_orders_open')) {
            return response()->json([
                'message' => 'Custom orders are not open yet.',
                'code' => 'custom_orders_paused',
            ], 409);
        }

        $data = $request->validate([
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
            // The colour asked for, by name. The id maps cannot express a colour
            // the chosen option was never photographed in, and without it the
            // design cannot be pictured again for the tailor.
            'custom_design_data.customization.color_name' => 'nullable|string|max:60',
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
            ...Measurements::rules('custom_design_data.measurements'),
            'custom_design_data.designElements' => 'nullable|array|max:20',
            'custom_design_data.designElements.*' => 'nullable|string|max:100',
            'custom_design_data.colorPalette' => 'nullable|array|max:10',
            'custom_design_data.colorPalette.*' => 'nullable|string|max:50',
        ]);

        // Resolve the canonical garment identifier (new field takes priority)
        $garmentType = $data['custom_design_data']['garment_type']
            ?? $data['custom_design_data']['clothingType']
            ?? null;

        if (! $garmentType) {
            return response()->json(['message' => 'Garment type is required.'], 422);
        }

        $shipping = (int) config('app.shipping_cost', 15);

        // The customer never picks a tailor (terms §3). The order goes to the
        // open pool, tailors send Kere their estimates, and Kere makes the
        // customer an offer based on one of them (AdminController::sendOffer).
        $order = DB::transaction(function () use ($data, $user, $shipping, $garmentType) {
            $order = Order::create([
                'user_id' => $user->id,
                'tailor_id' => null,
                'order_number' => 'ORD-'.strtoupper(Str::random(8)),
                'order_type' => 'custom',
                // Not card-paid here, so it must not sit at the 'unpaid'
                // default that the payment path reads as "owes money".
                'payment_status' => 'not_required',
                'tailor_assignment_mode' => 'random',
                'status' => 'pending_assignment',
                'subtotal' => 0,
                'shipping' => $shipping,
                'total' => $shipping,
                'custom_design_data' => $this->withMeasurementSnapshot($data['custom_design_data']),
                'first_name' => $user->first_name ?? $user->name,
                'last_name' => $user->last_name ?? '',
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => 'N/A',
                'city' => 'Tbilisi',
                'zip' => '0100',
                'country' => 'GE',
            ]);

            // Open pool: every approved tailor can see the design and send Kere an estimate
            User::where('role', 'tailor')
                ->where(fn ($q) => $q->where('approval_status', 'approved')->orWhereNull('approval_status'))
                ->where(fn ($q) => $q->where('is_suspended', false)->orWhereNull('is_suspended'))
                ->pluck('id')
                ->each(fn ($tailorId) => $this->notify(
                    $tailorId,
                    'open_order',
                    'ახალი მოთხოვნა',
                    "მომხმარებელმა შეუკვეთა ინდივიდუალური დიზაინი ({$garmentType}). თუ მისი შეკერვა გსურთ, გამოუგზავნეთ Kere-ს ფასის შეფასება თქვენი პანელიდან.",
                    $order->id,
                    ['clothing_type' => $garmentType]
                ));

            return $order;
        });

        try {
            Mail::to($user->email)->send(new OrderConfirmation($order));
        } catch (\Throwable $e) {
            Log::error('OrderConfirmation email failed (custom): '.$e->getMessage());
        }

        return response()->json([
            'order_number' => $order->order_number,
            'total' => $order->total,
            'status' => $order->status,
        ], 201);
    }

    // ─── POST /api/orders (order_type=remodel) ────────────────────────────────
    // Customer sends an existing garment to be altered/remodeled. Broadcast to the
    // open pool; tailors send Kere their estimates; Kere makes the customer one
    // offer (AdminController::sendOffer), which the customer accepts or declines.

    private function storeRemodelOrder(Request $request, User $user)
    {
        $data = $request->validate([
            'expected_price' => 'nullable|numeric|min:0|max:99999',
            'needed_by' => 'nullable|date_format:Y-m-d|after:today',
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:40',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:120',
            'zip' => 'nullable|string|max:20',
            'custom_design_data' => 'required|array|max:50',
            'custom_design_data.garment_type' => 'nullable|string|max:100',
            'custom_design_data.change_request' => 'required|string|max:2000',
            'custom_design_data.remodel_images' => 'required|array|min:1|max:10',
            'custom_design_data.remodel_images.*' => 'required|url|max:2000',
            ...Measurements::rules('custom_design_data.measurements'),
        ]);

        $shipping = (int) config('app.shipping_cost', 15);

        $order = DB::transaction(function () use ($data, $user, $shipping) {
            $order = Order::create([
                'user_id' => $user->id,
                'tailor_id' => null,
                'order_number' => 'RMD-'.strtoupper(Str::random(8)),
                'order_type' => 'remodel',
                // As with custom: priced and settled offline, never card-paid here.
                'payment_status' => 'not_required',
                'tailor_assignment_mode' => 'manual',
                'status' => 'pending_assignment',
                'subtotal' => 0,
                'shipping' => $shipping,
                'total' => $shipping,
                'expected_price' => $data['expected_price'] ?? null,
                'needed_by' => $data['needed_by'] ?? null,
                'custom_design_data' => $this->withMeasurementSnapshot($data['custom_design_data']),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'] ?? '',
                'email' => $user->email,
                'phone' => $data['phone'],
                'address' => $data['address'],
                'city' => $data['city'],
                'zip' => $data['zip'] ?? '',
                'country' => 'GE',
            ]);

            // Open pool: every approved, non-suspended tailor who takes remodel work is asked for an estimate
            User::where('role', 'tailor')
                ->where('does_remodeling', true)
                ->where(fn ($q) => $q->where('approval_status', 'approved')->orWhereNull('approval_status'))
                ->where(fn ($q) => $q->where('is_suspended', false)->orWhereNull('is_suspended'))
                ->pluck('id')
                ->each(fn ($tailorId) => $this->notify(
                    $tailorId,
                    'open_order',
                    'ახალი გადაკეთების მოთხოვნა',
                    'მომხმარებელს სამოსის გადაკეთება სურს. თუ სამუშაოს აიღებთ, გამოუგზავნეთ Kere-ს ფასისა და ვადის შეფასება თქვენი პანელიდან.',
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

        // A marketplace order becomes the tailor's once it is paid (terms §6):
        // before that it is a basket the customer has not settled, and showing
        // it let a tailor start work nobody had paid for.
        $orders = Order::with(['user', 'items.product'])
            ->where('tailor_id', $user->id)
            ->releasedToTailor()
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
            ->whereIn('order_type', $this->openOrderTypesFor($user))
            ->where('status', 'pending_assignment')
            ->whereNull('tailor_id')
            ->latest()
            ->get();

        $myRequests = TailorRequest::where('tailor_id', $user->id)
            ->whereIn('order_id', $orders->pluck('id'))
            ->pluck('status', 'order_id');

        // Every approved tailor reads this feed, and the privacy policy promises
        // the customer's name and measurements to the tailor they select — not to
        // everyone who might bid. So the feed carries a first name, and only how
        // many measurements were given, enough to price the job; the values
        // reach the tailor once the order is theirs (formatOrder).
        return response()->json(['orders' => $orders->map(function ($o) use ($myRequests) {
            $design = $o->custom_design_data ?? [];
            $measurementsCount = count($design['measurements'] ?? []);
            unset($design['measurements']);

            return [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'order_type' => $o->order_type,
                'created_at' => $o->created_at?->toISOString(),
                'custom_design_data' => $design,
                'measurements_count' => $measurementsCount,
                'expected_price' => $o->expected_price,
                'needed_by' => $o->needed_by?->toDateString(),
                // An older account may have only `name`, which holds the full name.
                'customer' => ['name' => $o->user->first_name ?: Str::before($o->user->getFullName(), ' ')],
                'requests_count' => $o->tailor_requests_count,
                'my_request_status' => $myRequests[$o->id] ?? null,
            ];
        })->values()]);
    }

    // ─── POST /api/tailor/orders/{id}/request ────────────────────────────────
    // A tailor's estimate for an open order. It goes to Kere, not the customer:
    // Kere bases its own offer on one estimate (terms §8), and the customer
    // never sees who sent it (terms §3).

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
            ->whereIn('order_type', $this->openOrderTypesFor($user))
            ->where('status', 'pending_assignment')
            ->whereNull('tailor_id')
            ->first();

        if (! $order) {
            return response()->json(['message' => 'This order is no longer open for estimates.'], 409);
        }

        // Kere's offer names a price and a completion time (terms §8), so an
        // estimate it can be based on has to give both.
        $data = $request->validate([
            'message' => 'nullable|string|max:500',
            'offered_price' => 'required|numeric|min:1|max:99999',
            // How long the work takes once the garment arrives (terms §8, §17).
            'ready_in_days' => 'required|integer|min:1|max:120',
        ]);

        if (TailorRequest::where('order_id', $order->id)->where('tailor_id', $user->id)->exists()) {
            return response()->json(['message' => 'You already sent an estimate for this order.'], 409);
        }

        try {
            $tailorRequest = TailorRequest::create([
                'order_id' => $order->id,
                'tailor_id' => $user->id,
                'message' => $data['message'] ?? null,
                'offered_price' => $data['offered_price'] ?? null,
                'ready_in_days' => $data['ready_in_days'] ?? null,
                'status' => 'pending',
            ]);
        } catch (QueryException) {
            // Unique (order_id, tailor_id) race — treat as duplicate
            return response()->json(['message' => 'You already sent an estimate for this order.'], 409);
        }

        KereNotification::toAdmins(
            $order,
            'estimate_received',
            'ახალი შეფასება',
            "{$user->getFullName()}: შეკვეთა #{$order->order_number} — ₾".number_format((float) $tailorRequest->offered_price, 2).", {$tailorRequest->ready_in_days} დღე. გაუგზავნეთ მომხმარებელს Kere-ის შეთავაზება."
        );

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
        $order = $this->tailorOrder($request, $id);

        if ($order instanceof JsonResponse) {
            return $order;
        }

        $data = $request->validate([
            'status' => 'required|in:pending,processing,finished,cancelled',
            // A remodel is finished with photos of the altered garment (terms §12).
            'photos' => 'nullable|array|min:1|max:10',
            'photos.*' => 'required|url|max:2000',
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

        // A paid remodel follows the steps the terms describe: work starts once
        // the garment has arrived and been photographed (§12), and it is
        // finished with photos of the result before it goes back (§12.4).
        if ($order->isPaidRemodel() && $newStatus === 'processing' && ! $order->received_at) {
            return response()->json(['message' => 'Confirm the garment has arrived first.', 'code' => 'garment_not_received'], 409);
        }

        if ($order->isPaidRemodel() && $newStatus === 'finished' && $oldStatus !== 'finished' && empty($data['photos'])) {
            return response()->json(['message' => 'Add photos of the finished garment.', 'code' => 'photos_required'], 422);
        }

        // Cancelling closes the order to payment, puts its stock back and tells
        // the admins what has to go back; Order::cancel does all of it, once.
        if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
            if (! $order->cancel('tailor')) {
                return response()->json(['message' => 'Invalid status transition.'], 422);
            }
        } else {
            $update = ['status' => $newStatus];

            if ($newStatus === 'finished') {
                $update['proposed_due_date'] = null;
                if (! empty($data['photos'])) {
                    $update['finished_photos'] = array_values($data['photos']);
                }
            }

            $order->update($update);
        }

        if ($order->isPaidRemodel() && $newStatus === 'finished' && $oldStatus !== 'finished') {
            KereNotification::aboutOrder(
                $order->user_id,
                $order,
                'order_status',
                'სამოსი მზადაა',
                "შეკვეთა #{$order->order_number} დასრულდა — ნახეთ ფოტოები და გადაიხადეთ დარჩენილი ₾".number_format($order->amountDue('balance'), 2).', რის შემდეგაც სამოსს კურიერი მოგიტანთ.'
            );
        }

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

    // ─── POST /api/tailor/orders/{id}/received ───────────────────────────────
    // The courier has brought the garment. Before any work, the tailor
    // photographs it as it arrived and notes any damage already there (terms
    // §12.2–12.3); the agreed completion time starts counting from here.

    public function markReceived(Request $request, int $id)
    {
        $order = $this->tailorOrder($request, $id);

        if ($order instanceof JsonResponse) {
            return $order;
        }

        $data = $request->validate([
            'photos' => 'required|array|min:1|max:10',
            'photos.*' => 'required|url|max:2000',
            'notes' => 'nullable|string|max:2000',
        ]);

        if (! $order->isPaidRemodel() || $order->status !== 'pending' || ! $order->picked_up_at || $order->received_at) {
            return response()->json(['message' => 'This order is not waiting for the garment.', 'code' => 'not_awaiting_garment'], 409);
        }

        $order->update([
            'received_at' => now(),
            'intake_photos' => array_values($data['photos']),
            'intake_notes' => $data['notes'] ?? null,
            'due_date' => $order->turnaround_days ? today()->addDays($order->turnaround_days)->toDateString() : null,
        ]);

        $body = "მკერავმა მიიღო შეკვეთის #{$order->order_number} სამოსი და ატვირთა მისი ფოტოები.";
        if (filled($data['notes'] ?? null)) {
            $body .= ' მკერავმა აღნიშნა არსებული ხარვეზი — ნახეთ შეკვეთის გვერდზე.';
        }
        KereNotification::aboutOrder($order->user_id, $order, 'order_status', 'სამოსი მკერავთანაა', $body);

        return response()->json(['order' => $this->formatOrder($order->fresh(['user', 'items.product']))]);
    }

    // ─── POST /api/tailor/orders/{id}/due-date ───────────────────────────────
    // A later completion date is only a proposal until the customer agrees to it
    // (terms §17).

    public function proposeDueDate(Request $request, int $id)
    {
        $order = $this->tailorOrder($request, $id);

        if ($order instanceof JsonResponse) {
            return $order;
        }

        $data = $request->validate([
            'due_date' => 'required|date_format:Y-m-d|after:today',
            'reason' => 'nullable|string|max:300',
        ]);

        if (! $order->due_date || ! in_array($order->status, ['pending', 'processing'], true)) {
            return response()->json(['message' => 'This order has no completion date to change.', 'code' => 'no_due_date'], 409);
        }

        $order->update(['proposed_due_date' => $data['due_date']]);

        // The customer hears it from Kere, not from the tailor (terms §17, §18).
        $body = "Kere გთავაზობთ შეკვეთის #{$order->order_number} ახალ ვადას: {$data['due_date']}. დაეთანხმეთ ან უარი თქვით შეკვეთის გვერდზე.";
        if (filled($data['reason'] ?? null)) {
            $body .= " მიზეზი: {$data['reason']}";
        }
        KereNotification::aboutOrder($order->user_id, $order, 'order_status', 'ახალი ვადის შეთავაზება', $body);

        return response()->json(['order' => $this->formatOrder($order->fresh(['user', 'items.product']))]);
    }

    /**
     * The calling tailor's own order, or the refusal to send back. An unpaid
     * marketplace order is not the tailor's yet (terms §6), so it is not found
     * here any more than it is listed.
     */
    private function tailorOrder(Request $request, int $id): Order|JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->approval_status === 'pending' || $user->approval_status === 'rejected') {
            return response()->json(['message' => 'Your account is pending approval.', 'code' => 'pending_approval'], 403);
        }

        return Order::with(['user', 'items.product'])
            ->where('id', $id)
            ->where('tailor_id', $user->id)
            ->releasedToTailor()
            ->firstOrFail();
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
            'needed_by' => $order->needed_by?->toDateString(),
            'payment_status' => $order->payment_status,
            'paid_remodel' => $order->isPaidRemodel(),
            'turnaround_days' => $order->turnaround_days,
            'due_date' => $order->due_date?->toDateString(),
            'proposed_due_date' => $order->proposed_due_date?->toDateString(),
            'picked_up_at' => $order->picked_up_at?->toISOString(),
            'received_at' => $order->received_at?->toISOString(),
            'intake_photos' => $order->intake_photos ?? [],
            'intake_notes' => $order->intake_notes,
            'finished_photos' => $order->finished_photos ?? [],
            'shipped_at' => $order->shipped_at?->toISOString(),
            'measurements_purged' => $order->measurements_purged_at !== null,
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
