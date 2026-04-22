<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class TailorController extends Controller
{
    private function tailorData(User $tailor, int $productsCount = 0, int $reviewsCount = 0, ?float $avgRating = null): array
    {
        return [
            'id'               => $tailor->id,
            'name'             => $tailor->getFullName(),
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

    public function index(Request $request)
    {
        $query = User::where('role', 'tailor');

        // Optional category filter: only tailors with products in that category
        $category = $request->query('category');
        if ($category) {
            $tailorIds = Product::whereHas('category', fn ($q) =>
                $q->where('slug', $category)->orWhere('name', $category)
            )->pluck('tailor_id')->filter()->unique();
            $query->whereIn('id', $tailorIds);
        }

        $tailors = $query->get();

        $productsByTailor = Product::whereIn('tailor_id', $tailors->pluck('id'))
            ->select('id', 'tailor_id')
            ->get()
            ->groupBy('tailor_id');

        $allProductIds = $productsByTailor->flatten()->pluck('id');
        $reviewStats   = $allProductIds->isNotEmpty()
            ? Review::whereIn('product_id', $allProductIds)
                ->selectRaw('product_id, COUNT(*) as cnt, AVG(rating) as avg_r')
                ->groupBy('product_id')
                ->get()
                ->keyBy('product_id')
            : collect();

        $result = $tailors->map(function ($tailor) use ($productsByTailor, $reviewStats) {
            $products      = $productsByTailor->get($tailor->id, collect());
            $productsCount = $products->count();
            $reviewsCount  = 0;
            $weightedSum   = 0.0;

            foreach ($products->pluck('id') as $pid) {
                if ($reviewStats->has($pid)) {
                    $stat          = $reviewStats[$pid];
                    $reviewsCount += $stat->cnt;
                    $weightedSum  += $stat->avg_r * $stat->cnt;
                }
            }

            $avgRating = $reviewsCount > 0 ? round($weightedSum / $reviewsCount, 1) : null;

            return $this->tailorData($tailor, $productsCount, $reviewsCount, $avgRating);
        })->values();

        return response()->json(['tailors' => $result]);
    }

    // ─── GET /api/tailors/{id} ────────────────────────────────────────────────

    public function show(int $id)
    {
        $tailor = User::where('role', 'tailor')->findOrFail($id);

        // Fix #6: fetch models first, pluck IDs from the collection — eliminates the extra query below
        $productModels = Product::with('category')
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('tailor_id', $tailor->id)
            ->latest()
            ->get();

        $products = $productModels->map(function ($p) use ($tailor) {
            return [
                'id'              => $p->id,
                'name'            => $p->name,
                'price'           => $p->price,
                'images'          => $p->images ?? [],
                'category'        => $p->category?->name,
                'tailor_name'     => $tailor->getFullName(),
                'reviews_count'   => (int) $p->reviews_count,
                'average_rating'  => $p->reviews_avg_rating ? round((float) $p->reviews_avg_rating, 1) : null,
                'is_customizable' => $p->is_customizable,
            ];
        });

        // Aggregate tailor-level stats from already-loaded products — no extra DB queries
        $reviewsCount = (int) $productModels->sum('reviews_count');
        $avgRating    = null;
        if ($reviewsCount > 0) {
            $weightedSum = $productModels
                ->where('reviews_count', '>', 0)
                ->sum(fn($p) => $p->reviews_avg_rating * $p->reviews_count);
            $avgRating = round($weightedSum / $reviewsCount, 1);
        }

        return response()->json([
            'tailor'   => $this->tailorData($tailor, $productIds->count(), $reviewsCount, $avgRating),
            'products' => $products,
        ]);
    }

    // ─── PATCH /api/tailor/profile ────────────────────────────────────────────

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Minor #16: max years_experience is dynamic (current year − 1960)
        $maxExperience = (int) date('Y') - 1960;

        $data = $request->validate([
            'bio'              => 'nullable|string|max:1000',
            'specialty'        => 'nullable|string|max:200',
            'years_experience' => "nullable|integer|min:0|max:{$maxExperience}",
            'profile_image'    => 'nullable|string|max:2000',
        ]);

        $user->update($data);

        $productIds   = Product::where('tailor_id', $user->id)->pluck('id');
        $reviewsCount = Review::whereIn('product_id', $productIds)->count();
        $avgRating    = $reviewsCount > 0
            ? round(Review::whereIn('product_id', $productIds)->avg('rating'), 1)
            : null;

        return response()->json(['tailor' => $this->tailorData($user, $productIds->count(), $reviewsCount, $avgRating)]);
    }
}
