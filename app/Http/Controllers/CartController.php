<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index()
    {
        $items = CartItem::with('product.category')
            ->where('user_id', auth()->id())
            ->get();

        return Inertia::render('Cart/Index', ['items' => $items]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id'    => 'required|exists:products,id',
            'color'         => 'nullable|string',
            'size'          => 'nullable|string',
            'quantity'      => 'integer|min:1',
            'custom_design' => 'nullable|array',
        ]);

        $existing = CartItem::where('user_id', auth()->id())
            ->where('product_id', $request->product_id)
            ->where('color', $request->color)
            ->where('size', $request->size)
            ->first();

        if ($existing) {
            $existing->increment('quantity', $request->get('quantity', 1));
        } else {
            CartItem::create([
                'user_id'       => auth()->id(),
                'product_id'    => $request->product_id,
                'color'         => $request->color,
                'size'          => $request->size,
                'quantity'      => $request->get('quantity', 1),
                'custom_design' => $request->custom_design,
            ]);
        }

        return back()->with('success', 'Added to cart!');
    }

    public function update(Request $request, CartItem $cartItem)
    {
        abort_if($cartItem->user_id !== auth()->id(), 403);

        $request->validate(['quantity' => 'required|integer|min:1']);
        $cartItem->update(['quantity' => $request->quantity]);

        return back();
    }

    public function destroy(CartItem $cartItem)
    {
        abort_if($cartItem->user_id !== auth()->id(), 403);
        $cartItem->delete();

        return back()->with('success', 'Item removed.');
    }

    public function count()
    {
        $count = CartItem::where('user_id', auth()->id())->sum('quantity');
        return response()->json(['count' => $count]);
    }
}
