<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')->get();

        return response()->json(
            $categories->map(function ($cat) {
                // One random product with an actual image for the category card
                $product = Product::where('category_id', $cat->id)
                    ->where('images', '!=', '[]')
                    ->whereNotNull('images')
                    ->inRandomOrder()
                    ->first();

                $sampleImage = null;
                if ($product && is_array($product->images) && count($product->images) > 0) {
                    $sampleImage = $product->images[0];
                }

                return [
                    'id'             => $cat->id,
                    'name'           => $cat->name,
                    'slug'           => $cat->slug,
                    'products_count' => $cat->products_count,
                    'sample_image'   => $sampleImage,
                ];
            })
        );
    }
}
