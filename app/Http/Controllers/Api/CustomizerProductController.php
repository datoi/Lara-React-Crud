<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PreviewDesignRequest;
use App\Http\Resources\CustomizerProductResource;
use App\Models\CustomizerProduct;
use App\Models\Fabric;
use App\Models\LayerOption;
use Illuminate\Http\JsonResponse;

class CustomizerProductController extends Controller
{
    /** GET /api/customizer/products */
    public function index(): JsonResponse
    {
        $products = CustomizerProduct::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'products' => CustomizerProductResource::collection($products),
        ]);
    }

    /** GET /api/customizer/products/{slug} */
    public function show(string $slug): JsonResponse
    {
        $product = CustomizerProduct::where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'layerCategories.options.children',
                'fabrics' => fn ($q) => $q->where('is_active', true)->orderBy('display_order'),
            ])
            ->firstOrFail();

        // Merge global fabrics (product_id = null) with product-specific ones
        $globalFabrics = Fabric::whereNull('customizer_product_id')
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get();

        // Combine: product-specific first, then global
        $allFabrics = $product->fabrics->concat($globalFabrics);

        return response()->json([
            'product' => (new CustomizerProductResource($product))
                ->additional(['fabrics_override' => $allFabrics]),
            // Flatten for convenience
            'layer_categories' => \App\Http\Resources\LayerCategoryResource::collection(
                $product->layerCategories
            ),
            'fabrics' => \App\Http\Resources\FabricResource::collection($allFabrics),
        ]);
    }

    /**
     * POST /api/customizer/preview
     * Validates a configuration and returns the computed total price.
     * Does NOT require auth — lets guests preview pricing.
     */
    public function preview(PreviewDesignRequest $request): JsonResponse
    {
        $product = CustomizerProduct::where('slug', $request->product_slug)->firstOrFail();

        $selections = $request->selections; // [ categoryId => optionId ]
        $fabricId   = $request->fabric_id;

        $optionModifiers = 0.0;
        $resolvedSelections = [];

        foreach ($selections as $categoryId => $optionId) {
            $option = LayerOption::find($optionId);
            if ($option && $option->layerCategory->customizer_product_id === $product->id) {
                $optionModifiers += $option->price_modifier;
                $resolvedSelections[(int) $categoryId] = (int) $optionId;
            }
        }

        $fabricModifier = 0.0;
        if ($fabricId) {
            $fabric = Fabric::find($fabricId);
            if ($fabric) {
                $fabricModifier = $fabric->price_modifier;
            }
        }

        $total = $product->base_price + $optionModifiers + $fabricModifier;

        return response()->json([
            'base_price'       => $product->base_price,
            'option_modifiers' => $optionModifiers,
            'fabric_modifier'  => $fabricModifier,
            'total'            => round($total, 2),
            'selections'       => $resolvedSelections,
            'fabric_id'        => $fabricId,
        ]);
    }
}
