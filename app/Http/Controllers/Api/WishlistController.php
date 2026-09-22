<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = $request->user()->wishlistProducts()
            ->with(['category', 'tailor'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->orderByDesc('wishlist_items.created_at')
            ->get()
            ->each(function (Product $product) {
                $product->tailor_name = $product->tailor?->getFullName();
                $product->reviews_count = (int) $product->reviews_count;
                $product->average_rating = $product->reviews_avg_rating
                    ? round((float) $product->reviews_avg_rating, 1)
                    : null;
                unset($product->reviews_avg_rating);
            });

        return response()->json(['products' => $products]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlistProducts()->syncWithoutDetaching([$product->id]);

        return response()->json(['message' => 'Added to wishlist.'], 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlistProducts()->detach($product->id);

        return response()->json(['message' => 'Removed from wishlist.']);
    }
}
