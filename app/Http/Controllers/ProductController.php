<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    // ─── GET /api/products ────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Product::with(['category', 'tailor'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating');

        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhereHas('tailor', fn($tq) => $tq->where('name', 'like', $term)
                      ->orWhere('first_name', 'like', $term)
                      ->orWhere('last_name', 'like', $term));
            });
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        $sort = $request->get('sort', 'newest');
        match ($sort) {
            'price_asc'  => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name'       => $query->orderBy('name', 'asc'),
            'popular'    => $query->orderByDesc('reviews_count'),
            'rating'     => $query->orderByDesc('reviews_avg_rating'),
            default      => $query->latest(),
        };

        $paginator = $query->paginate(24)->withQueryString();

        // Append tailor_name and review summary to each product
        $paginator->getCollection()->transform(function ($p) {
            $p->tailor_name    = $p->tailor?->getFullName();
            $p->reviews_count  = (int) $p->reviews_count;
            $p->average_rating = $p->reviews_avg_rating ? round((float) $p->reviews_avg_rating, 1) : null;
            unset($p->reviews_avg_rating);
            return $p;
        });

        return response()->json($paginator);
    }

    // ─── GET /api/products/{product} ─────────────────────────────────────────

    public function show(Product $product)
    {
        $product->loadCount('reviews')->loadAvg('reviews', 'rating');
        $product->load(['category', 'tailor']);
        $product->tailor_name    = $product->tailor?->getFullName();
        $product->reviews_count  = (int) $product->reviews_count;
        $product->average_rating = $product->reviews_avg_rating ? round((float) $product->reviews_avg_rating, 1) : null;
        unset($product->reviews_avg_rating);

        $related = Product::with('tailor')
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get()
            ->each(function ($p) {
                $p->tailor_name = $p->tailor?->getFullName();
            });

        return response()->json([
            'product' => $product,
            'related' => $related,
        ]);
    }

    // ─── GET /api/products/{id}/meta ─────────────────────────────────────────

    public function meta(int $id)
    {
        $product = Product::with('category')->findOrFail($id);
        $image   = is_array($product->images) && count($product->images) ? $product->images[0] : null;

        return response()->json([
            'title'       => $product->name . ' — Custom ' . ($product->category->name ?? 'Garment') . ' | Kere',
            'description' => $product->description
                ? substr($product->description, 0, 160)
                : 'Order a custom ' . strtolower($product->name) . ' handcrafted by a local Georgian tailor on Kere.',
            'image'       => $image,
        ]);
    }

    // ─── GET /api/platform/stats ─────────────────────────────────────────────

    public function platformStats()
    {
        $tailorCount    = User::where('role', 'tailor')->count();
        $customerCount  = User::where('role', 'customer')->count();
        $ordersCount    = \App\Models\Order::whereNotIn('status', ['cancelled'])->count();
        $reviewsCount   = Review::count();
        $avgRating      = $reviewsCount > 0 ? round(Review::avg('rating'), 1) : null;

        return response()->json([
            'tailors_count'   => $tailorCount,
            'customers_count' => $customerCount,
            'orders_count'    => $ordersCount,
            'avg_rating'      => $avgRating,
            'reviews_count'   => $reviewsCount,
        ]);
    }

    // ─── GET /api/tailor/stats ────────────────────────────────────────────────

    public function tailorStats(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $productIds = Product::where('tailor_id', $user->id)->pluck('id');

        $reviewsCount = Review::whereIn('product_id', $productIds)->count();
        $avgRating    = $reviewsCount > 0
            ? round(Review::whereIn('product_id', $productIds)->avg('rating'), 1)
            : null;

        return response()->json([
            'avg_rating'      => $avgRating,
            'reviews_count'   => $reviewsCount,
            'profile_complete' => !empty($user->bio) && !empty($user->specialty),
        ]);
    }

    // ─── GET /api/tailor/products ─────────────────────────────────────────────

    public function tailorProducts(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $products = Product::with('category')
            ->where('tailor_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($p) => $this->formatProduct($p));

        return response()->json(['products' => $products]);
    }

    // ─── POST /api/tailor/products ────────────────────────────────────────────

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'tailor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'name'                  => 'required|string|max:200',
            'description'           => 'nullable|string',
            'price'                 => 'required|numeric|min:1',
            'category_id'           => 'required|exists:categories,id',
            'images'                => 'nullable|array',
            'images.*'              => 'nullable|string|url',
            'colors'                => 'nullable|array',
            'colors.*'              => 'nullable|string',
            'sizes'                 => 'nullable|array',
            'sizes.*'               => 'nullable|string',
            'fabric'                => 'nullable|string|max:100',
            'texture'               => 'nullable|string|max:100',
            'required_measurements' => 'nullable|array',
            'required_measurements.*' => 'string',
            'is_customizable'       => 'boolean',
        ]);

        $slug = Str::slug($data['name']) . '-' . Str::random(6);

        $product = Product::create([
            'tailor_id'             => $user->id,
            'category_id'           => $data['category_id'],
            'name'                  => $data['name'],
            'slug'                  => $slug,
            'description'           => $data['description'] ?? null,
            'price'                 => $data['price'],
            'images'                => array_filter($data['images'] ?? []),
            'colors'                => $data['colors'] ?? [],
            'sizes'                 => $data['sizes'] ?? [],
            'fabric'                => $data['fabric'] ?? null,
            'texture'               => $data['texture'] ?? null,
            'required_measurements' => $data['required_measurements'] ?? [],
            'is_customizable'       => $data['is_customizable'] ?? true,
            'stock'                 => 100,
        ]);

        $product->load('category');

        return response()->json([
            'product' => $this->formatProduct($product),
        ], 201);
    }

    // ─── Formatter ────────────────────────────────────────────────────────────

    private function formatProduct(Product $p): array
    {
        return [
            'id'                    => $p->id,
            'name'                  => $p->name,
            'category'              => $p->category->name ?? '—',
            'category_id'           => $p->category_id,
            'price'                 => $p->price,
            'description'           => $p->description,
            'images'                => $p->images ?? [],
            'colors'                => $p->colors ?? [],
            'sizes'                 => $p->sizes ?? [],
            'fabric'                => $p->fabric,
            'texture'               => $p->texture,
            'required_measurements' => $p->required_measurements ?? [],
            'is_customizable'       => $p->is_customizable,
            'orders'                => 0,
            'status'                => 'active',
        ];
    }
}
