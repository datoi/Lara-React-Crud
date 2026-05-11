<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLayerOptionRequest;
use App\Http\Resources\CustomizerProductResource;
use App\Http\Resources\FabricResource;
use App\Http\Resources\LayerCategoryResource;
use App\Http\Resources\LayerOptionResource;
use App\Models\CustomizerProduct;
use App\Models\Fabric;
use App\Models\LayerCategory;
use App\Models\LayerOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CustomizerAdminController extends Controller
{
    // ── Products ─────────────────────────────────────────────────────────────

    public function indexProducts(): JsonResponse
    {
        $products = CustomizerProduct::with('layerCategories.options')->get();

        return response()->json([
            'products' => CustomizerProductResource::collection($products),
        ]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['required', 'string', 'unique:customizer_products,slug'],
            'description' => ['nullable', 'string'],
            'base_price'  => ['required', 'numeric', 'min:0'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $product = CustomizerProduct::create($data);

        return response()->json(['product' => new CustomizerProductResource($product)], 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = CustomizerProduct::findOrFail($id);

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'slug'        => ['sometimes', 'string', 'unique:customizer_products,slug,' . $id],
            'description' => ['nullable', 'string'],
            'base_price'  => ['sometimes', 'numeric', 'min:0'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

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
            'name'                  => ['required', 'string', 'max:120'],
            'slug'                  => ['required', 'string', 'max:120'],
            'z_index'               => ['required', 'integer', 'min:1'],
            'is_required'           => ['nullable', 'boolean'],
            'is_colorable'          => ['nullable', 'boolean'],
            'display_order'         => ['nullable', 'integer', 'min:0'],
        ]);

        $category = LayerCategory::create($data);

        return response()->json(['category' => new LayerCategoryResource($category)], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = LayerCategory::findOrFail($id);

        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:120'],
            'z_index'       => ['sometimes', 'integer', 'min:1'],
            'is_required'   => ['nullable', 'boolean'],
            'is_colorable'  => ['nullable', 'boolean'],
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
        $file     = $request->file('image');
        $ext      = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $ext;
        $path     = $file->storeAs('layers', $filename, 'public');

        $option = LayerOption::create([
            'layer_category_id' => $request->layer_category_id,
            'name'              => $request->name,
            'slug'              => $request->slug,
            'image_path'        => $path,
            'thumbnail_path'    => $path, // Same file as thumbnail (no resize needed for SVG)
            'price_modifier'    => $request->price_modifier ?? 0,
            'is_default'        => $request->boolean('is_default', false),
            'is_active'         => true,
            'display_order'     => $request->display_order ?? 0,
        ]);

        return response()->json(['option' => new LayerOptionResource($option)], 201);
    }

    public function updateOption(Request $request, int $id): JsonResponse
    {
        $option = LayerOption::findOrFail($id);

        $data = $request->validate([
            'name'           => ['sometimes', 'string', 'max:120'],
            'price_modifier' => ['nullable', 'numeric', 'min:0'],
            'is_default'     => ['nullable', 'boolean'],
            'is_active'      => ['nullable', 'boolean'],
            'display_order'  => ['nullable', 'integer', 'min:0'],
        ]);

        // Handle optional image replacement
        if ($request->hasFile('image')) {
            $request->validate(['image' => ['file', 'mimes:png,svg', 'max:4096']]);
            $file     = $request->file('image');
            $ext      = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $ext;
            $newPath  = $file->storeAs('layers', $filename, 'public');

            // Delete old file
            if ($option->image_path) {
                Storage::disk('public')->delete($option->image_path);
            }

            $data['image_path']     = $newPath;
            $data['thumbnail_path'] = $newPath;
        }

        $option->update($data);

        return response()->json(['option' => new LayerOptionResource($option)]);
    }

    public function destroyOption(int $id): JsonResponse
    {
        $option = LayerOption::findOrFail($id);

        if ($option->image_path) {
            Storage::disk('public')->delete($option->image_path);
        }

        $option->delete();

        return response()->json(['message' => 'Option deleted.']);
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
            'name'                  => ['required', 'string', 'max:120'],
            'color_hex'             => ['required', 'string', 'max:9'],
            'price_modifier'        => ['nullable', 'numeric', 'min:0'],
            'is_active'             => ['nullable', 'boolean'],
            'display_order'         => ['nullable', 'integer', 'min:0'],
            'texture'               => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'max:2048'],
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
            'name'           => ['sometimes', 'string', 'max:120'],
            'color_hex'      => ['sometimes', 'string', 'max:9'],
            'price_modifier' => ['nullable', 'numeric', 'min:0'],
            'is_active'      => ['nullable', 'boolean'],
            'display_order'  => ['nullable', 'integer', 'min:0'],
            'texture'        => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'max:2048'],
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
