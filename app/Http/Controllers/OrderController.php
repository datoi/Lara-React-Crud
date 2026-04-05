<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with('items.product')
            ->where('user_id', auth()->id())
            ->latest()
            ->get();

        return Inertia::render('Orders/Index', ['orders' => $orders]);
    }

    public function checkout()
    {
        $items = CartItem::with('product')
            ->where('user_id', auth()->id())
            ->get();

        if ($items->isEmpty()) {
            return redirect()->route('cart.index');
        }

        $subtotal = $items->sum(fn($i) => $i->product->price * $i->quantity);
        $shipping = $subtotal >= 75 ? 0 : 9.99;

        return Inertia::render('Checkout/Index', [
            'items'    => $items,
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'total'    => $subtotal + $shipping,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'email'      => 'required|email',
            'phone'      => 'nullable|string',
            'address'    => 'required|string',
            'city'       => 'required|string',
            'state'      => 'nullable|string',
            'zip'        => 'required|string',
            'country'    => 'required|string',
            'notes'      => 'nullable|string',
        ]);

        $items = CartItem::with('product')
            ->where('user_id', auth()->id())
            ->get();

        if ($items->isEmpty()) {
            return redirect()->route('cart.index');
        }

        $subtotal = $items->sum(fn($i) => $i->product->price * $i->quantity);
        $shipping = $subtotal >= 75 ? 0 : 9.99;

        $order = Order::create([
            'user_id'      => auth()->id(),
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'status'       => 'pending',
            'subtotal'     => $subtotal,
            'shipping'     => $shipping,
            'total'        => $subtotal + $shipping,
            ...$request->only(['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'notes']),
        ]);

        foreach ($items as $item) {
            $order->items()->create([
                'product_id'    => $item->product_id,
                'product_name'  => $item->product->name,
                'color'         => $item->color,
                'size'          => $item->size,
                'quantity'      => $item->quantity,
                'price'         => $item->product->price,
                'custom_design' => $item->custom_design,
            ]);
        }

        CartItem::where('user_id', auth()->id())->delete();

        return redirect()->route('orders.index')->with('success', "Order #{$order->order_number} placed!");
    }

    public function show(Order $order)
    {
        abort_if($order->user_id !== auth()->id(), 403);
        $order->load('items.product');

        return Inertia::render('Orders/Show', ['order' => $order]);
    }
}
