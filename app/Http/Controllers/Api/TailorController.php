<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class TailorController extends Controller
{
    private function authedUser(Request $request): ?User
    {
        $raw = $request->bearerToken();
        if (!$raw) return null;
        return User::where('api_token', hash('sha256', $raw))->first();
    }

    private function tailorData(User $tailor): array
    {
        $productIds    = Product::where('tailor_id', $tailor->id)->pluck('id');
        $reviewsCount  = Review::whereIn('product_id', $productIds)->count();
        $avgRating     = $reviewsCount > 0
            ? round(Review::whereIn('product_id', $productIds)->avg('rating'), 1)
            : null;
        $productsCount = $productIds->count();

        return [
            'id'               => $tailor->id,
            'name'             => trim(($tailor->first_name ?? '') . ' ' . ($tailor->last_name ?? '')) ?: $tailor->name,
            'bio'              => $tailor->bio,
            'specialty'        => $tailor->specialty,
            'years_experience' => $tailor->years_experience,
            'profile_image'    => $tailor->profile_image,
            'products_count'   => $productsCount,
            'reviews_count'    => $reviewsCount,
            'avg_rating'       => $avgRating,
        ];
    }

    // ─── GET /api/tailors ─────────────────────────────────────────────────────

    public function index()
    {
        $tailors = User::where('role', 'tailor')
            ->get()
            ->map(fn($t) => $this->tailorData($t))
            ->values();

        return response()->json(['tailors' => $tailors]);
    }

    // ─── GET /api/tailors/{id} ────────────────────────────────────────────────

    public function show(int $id)
    {
        $tailor = User::where('role', 'tailor')->findOrFail($id);

        $products = Product::with('category')
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('tailor_id', $tailor->id)
            ->latest()
            ->get()
            ->map(function ($p) use ($tailor) {
                return [
                    'id'             => $p->id,
                    'name'           => $p->name,
                    'price'          => $p->price,
                    'images'         => $p->images ?? [],
                    'category'       => $p->category?->name,
                    'tailor_name'    => trim(($tailor->first_name ?? '') . ' ' . ($tailor->last_name ?? '')) ?: $tailor->name,
                    'reviews_count'  => (int) $p->reviews_count,
                    'average_rating' => $p->reviews_avg_rating ? round((float) $p->reviews_avg_rating, 1) : null,
                    'is_customizable'=> $p->is_customizable,
                ];
            });

        return response()->json([
            'tailor'   => $this->tailorData($tailor),
            'products' => $products,
        ]);
    }

    // ─── PATCH /api/tailor/profile ────────────────────────────────────────────

    public function updateProfile(Request $request)
    {
        $user = $this->authedUser($request);
        if (!$user || $user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'bio'              => 'nullable|string|max:1000',
            'specialty'        => 'nullable|string|max:200',
            'years_experience' => 'nullable|integer|min:0|max:60',
            'profile_image'    => 'nullable|string|max:2000',
        ]);

        $user->update($data);

        return response()->json(['tailor' => $this->tailorData($user)]);
    }
}
