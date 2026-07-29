<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLayerOptionRequest;
use App\Http\Resources\CustomizerProductResource;
use App\Http\Resources\FabricResource;
use App\Http\Resources\LayerCategoryResource;
use App\Http\Resources\LayerOptionColorResource;
use App\Http\Resources\LayerOptionResource;
use App\Models\CustomizerProduct;
use App\Models\Fabric;
use App\Models\LayerCategory;
use App\Models\LayerOption;
use App\Models\LayerOptionColor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomizerAdminController extends Controller
{
    // ── Products ─────────────────────────────────────────────────────────────

    public function indexProducts(): JsonResponse
    {
        $products = CustomizerProduct::with('layerCategories.options.children.colors', 'layerCategories.options.colors')->get();

        return response()->json([
            'products' => CustomizerProductResource::collection($products),
        ]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'unique:customizer_products,slug'],
            'category' => ['nullable', 'string', 'max:80'],
            'gender' => ['nullable', 'in:men,women,unisex'],
            'description' => ['nullable', 'string'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'preview' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ]);

        $data['slug'] = $data['slug'] ?? $this->uniqueProductSlug($data['name']);

        if ($request->hasFile('preview')) {
            $data['preview_image_path'] = $request->file('preview')
                ->store('product-previews', 'public');
        }

        unset($data['preview']);
        $product = CustomizerProduct::create($data);

        return response()->json(['product' => new CustomizerProductResource($product)], 201);
    }

    /** Slugify the product name, appending -2, -3, … until unique. */
    private function uniqueProductSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $n = 2;

        while (CustomizerProduct::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$n}";
            $n++;
        }

        return $slug;
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = CustomizerProduct::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'unique:customizer_products,slug,'.$id],
            'category' => ['nullable', 'string', 'max:80'],
            'gender' => ['nullable', 'in:men,women,unisex'],
            'description' => ['nullable', 'string'],
            'base_price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'preview' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ]);

        if ($request->hasFile('preview')) {
            if ($product->preview_image_path) {
                Storage::disk('public')->delete($product->preview_image_path);
            }
            $data['preview_image_path'] = $request->file('preview')
                ->store('product-previews', 'public');
        }

        unset($data['preview']);
        $product->update($data);

        return response()->json(['product' => new CustomizerProductResource($product)]);
    }

    public function destroyProduct(int $id): JsonResponse
    {
        CustomizerProduct::findOrFail($id)->delete();

        return response()->json(['message' => 'Product deleted.']);
    }

    // ── Layer Categories ──────────────────────────────────────────────────────

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customizer_product_id' => ['required', 'integer', 'exists:customizer_products,id'],
            'name' => ['required', 'string', 'max:120'],
            'children_label' => ['nullable', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:120'],
            'z_index' => ['required', 'integer', 'min:1'],
            'is_required' => ['nullable', 'boolean'],
            'is_colorable' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = LayerCategory::create($data);

        return response()->json(['category' => new LayerCategoryResource($category)], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = LayerCategory::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'children_label' => ['nullable', 'string', 'max:120'],
            'z_index' => ['sometimes', 'integer', 'min:1'],
            'is_required' => ['nullable', 'boolean'],
            'is_colorable' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category->update($data);

        return response()->json(['category' => new LayerCategoryResource($category)]);
    }

    public function destroyCategory(int $id): JsonResponse
    {
        LayerCategory::findOrFail($id)->delete();

        return response()->json(['message' => 'Category deleted.']);
    }

    // ── Layer Options ─────────────────────────────────────────────────────────

    /**
     * Accepts PNG/SVG upload, stores under storage/app/public/layers/,
     * saves a thumbnail (same file — no resize lib required).
     */
    public function storeOption(StoreLayerOptionRequest $request): JsonResponse
    {
        $file = $request->file('image');
        $ext = $file->getClientOriginalExtension();
        $filename = Str::uuid().'.'.$ext;
        $path = $file->storeAs('layers', $filename, 'public');

        $option = LayerOption::create([
            'layer_category_id' => $request->layer_category_id,
            'parent_option_id' => $request->parent_option_id ?? null,
            'name' => $request->name,
            'slug' => $request->slug,
            'image_path' => $path,
            'thumbnail_path' => $path,
            'back_image_path' => $this->storeViewImage($request, 'back_image'),
            'left_image_path' => $this->storeViewImage($request, 'left_image'),
            'right_image_path' => $this->storeViewImage($request, 'right_image'),
            'color_hex' => $request->input('color_hex'),
            'price_modifier' => $request->price_modifier ?? 0,
            'is_default' => $request->boolean('is_default', false),
            'is_active' => true,
            'display_order' => $request->display_order ?? 0,
        ]);

        return response()->json(['option' => new LayerOptionResource($option)], 201);
    }

    public function updateOption(Request $request, int $id): JsonResponse
    {
        $option = LayerOption::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'color_hex' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'price_modifier' => ['nullable', 'numeric', 'min:0'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        // Handle optional image replacement
        if ($request->hasFile('image')) {
            $request->validate(['image' => ['file', 'mimes:png,svg,jpg,jpeg,webp', 'max:4096']]);
            $file = $request->file('image');
            $ext = $file->getClientOriginalExtension();
            $filename = Str::uuid().'.'.$ext;
            $newPath = $file->storeAs('layers', $filename, 'public');

            // Delete old file
            if ($option->image_path) {
                Storage::disk('public')->delete($option->image_path);
            }

            $data['image_path'] = $newPath;
            $data['thumbnail_path'] = $newPath;
        }

        // Optional rotation-view image uploads (back / left / right)
        foreach (['back_image', 'left_image', 'right_image'] as $viewField) {
            if (! $request->hasFile($viewField)) {
                continue;
            }

            $column = $viewField.'_path';
            $newPath = $this->storeViewImage($request, $viewField);

            if ($option->{$column}) {
                Storage::disk('public')->delete($option->{$column});
            }

            $data[$column] = $newPath;
        }

        $option->update($data);

        return response()->json(['option' => new LayerOptionResource($option)]);
    }

    public function destroyOption(int $id): JsonResponse
    {
        $option = LayerOption::findOrFail($id);

        foreach (['image_path', 'back_image_path', 'left_image_path', 'right_image_path'] as $column) {
            if ($option->{$column}) {
                Storage::disk('public')->delete($option->{$column});
            }
        }

        $option->delete();

        return response()->json(['message' => 'Option deleted.']);
    }

    // ── Option colours ────────────────────────────────────────────────────────

    public function storeOptionColor(Request $request, int $optionId): JsonResponse
    {
        $option = LayerOption::findOrFail($optionId);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'color_hex' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'image' => ['required', 'file', 'mimes:png,svg,jpg,jpeg,webp', 'max:4096'],
        ]);

        $color = $option->colors()->create([
            'name' => $data['name'],
            'color_hex' => strtolower($data['color_hex']),
            'image_path' => $this->storeViewImage($request, 'image'),
            'back_image_path' => $this->storeViewImage($request, 'back_image'),
            'left_image_path' => $this->storeViewImage($request, 'left_image'),
            'right_image_path' => $this->storeViewImage($request, 'right_image'),
            'is_default' => $option->colors()->count() === 0,
            'display_order' => $option->colors()->count(),
        ]);

        return response()->json(['color' => new LayerOptionColorResource($color)], 201);
    }

    public function updateOptionColor(Request $request, int $colorId): JsonResponse
    {
        $color = LayerOptionColor::findOrFail($colorId);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:60'],
            'color_hex' => ['sometimes', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_default' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if (isset($data['color_hex'])) {
            $data['color_hex'] = strtolower($data['color_hex']);
        }

        foreach (['image', 'back_image', 'left_image', 'right_image'] as $field) {
            if (! $request->hasFile($field)) {
                continue;
            }

            $column = $field === 'image' ? 'image_path' : $field.'_path';
            $newPath = $this->storeViewImage($request, $field);

            if ($color->{$column}) {
                Storage::disk('public')->delete($color->{$column});
            }

            $data[$column] = $newPath;
        }

        $color->update($data);

        if ($request->boolean('is_default')) {
            LayerOptionColor::where('layer_option_id', $color->layer_option_id)
                ->where('id', '!=', $color->id)
                ->update(['is_default' => false]);
        }

        return response()->json(['color' => new LayerOptionColorResource($color->fresh())]);
    }

    public function reorderOptionColors(Request $request, int $id): JsonResponse
    {
        $option = LayerOption::findOrFail($id);

        $data = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['integer'],
        ]);

        $ownIds = $option->colors()->pluck('id')->all();
        if (count($data['order']) !== count($ownIds) || array_diff($data['order'], $ownIds)) {
            return response()->json(['message' => "Order must be a permutation of this style's colours."], 422);
        }

        DB::transaction(function () use ($data) {
            foreach ($data['order'] as $position => $colorId) {
                LayerOptionColor::where('id', $colorId)->update(['display_order' => $position]);
            }
        });

        return response()->json([
            'colors' => LayerOptionColorResource::collection($option->colors()->get()),
        ]);
    }

    public function destroyOptionColor(int $colorId): JsonResponse
    {
        $color = LayerOptionColor::findOrFail($colorId);

        foreach (['image_path', 'back_image_path', 'left_image_path', 'right_image_path'] as $column) {
            if ($color->{$column}) {
                Storage::disk('public')->delete($color->{$column});
            }
        }

        $wasDefault = $color->is_default;
        $optionId = $color->layer_option_id;
        $color->delete();

        if ($wasDefault) {
            LayerOptionColor::where('layer_option_id', $optionId)
                ->orderBy('display_order')
                ->first()
                ?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Colour deleted.']);
    }

    /** Store an optional rotation-view upload; returns its storage path or null. */
    private function storeViewImage(Request $request, string $field): ?string
    {
        if (! $request->hasFile($field)) {
            return null;
        }

        $request->validate([$field => ['file', 'mimes:png,svg,jpg,jpeg,webp', 'max:4096']]);

        $file = $request->file($field);

        return $file->storeAs('layers', Str::uuid().'.'.$file->getClientOriginalExtension(), 'public');
    }

    // ── Fabrics ───────────────────────────────────────────────────────────────

    public function indexFabrics(): JsonResponse
    {
        $fabrics = Fabric::orderBy('display_order')->get();

        return response()->json(['fabrics' => FabricResource::collection($fabrics)]);
    }

    public function storeFabric(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customizer_product_id' => ['nullable', 'integer', 'exists:customizer_products,id'],
            'name' => ['required', 'string', 'max:120'],
            'color_hex' => ['required', 'string', 'max:9'],
            'price_modifier' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'texture' => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'max:2048'],
        ]);

        if ($request->hasFile('texture')) {
            $file = $request->file('texture');
            $data['texture_image_path'] = $file->store('fabrics', 'public');
        }

        unset($data['texture']);
        $fabric = Fabric::create($data);

        return response()->json(['fabric' => new FabricResource($fabric)], 201);
    }

    public function updateFabric(Request $request, int $id): JsonResponse
    {
        $fabric = Fabric::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'color_hex' => ['sometimes', 'string', 'max:9'],
            'price_modifier' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'texture' => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'max:2048'],
        ]);

        if ($request->hasFile('texture')) {
            if ($fabric->texture_image_path) {
                Storage::disk('public')->delete($fabric->texture_image_path);
            }
            $data['texture_image_path'] = $request->file('texture')->store('fabrics', 'public');
        }

        unset($data['texture']);
        $fabric->update($data);

        return response()->json(['fabric' => new FabricResource($fabric)]);
    }

    public function destroyFabric(int $id): JsonResponse
    {
        $fabric = Fabric::findOrFail($id);

        if ($fabric->texture_image_path) {
            Storage::disk('public')->delete($fabric->texture_image_path);
        }

        $fabric->delete();

        return response()->json(['message' => 'Fabric deleted.']);
    }
}
