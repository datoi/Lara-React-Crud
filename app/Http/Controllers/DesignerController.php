<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DesignerController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with('category')
            ->where('is_customizable', true)
            ->get();

        $selectedProduct = null;
        if ($request->filled('product')) {
            $selectedProduct = Product::find($request->product);
        }

        return Inertia::render('Designer/Index', [
            'products'        => $products,
            'selectedProduct' => $selectedProduct,
        ]);
    }
}
