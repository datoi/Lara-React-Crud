<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDesignRequest;
use App\Http\Resources\SavedDesignResource;
use App\Models\SavedDesign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedDesignController extends Controller
{
    /** GET /api/customizer/designs */
    public function index(Request $request): JsonResponse
    {
        $designs = SavedDesign::where('user_id', $request->user()->id)
            ->with('customizerProduct')
            ->latest()
            ->get();

        return response()->json([
            'designs' => SavedDesignResource::collection($designs),
        ]);
    }

    /** POST /api/customizer/designs */
    public function store(StoreDesignRequest $request): JsonResponse
    {
        $design = SavedDesign::create([
            'user_id'                => $request->user()->id,
            'customizer_product_id'  => $request->product_id,
            'name'                   => $request->name,
            'configuration'          => $request->configuration,
        ]);

        $design->load('customizerProduct');

        return response()->json([
            'design' => new SavedDesignResource($design),
        ], 201);
    }

    /** GET /api/customizer/designs/{id} */
    public function show(Request $request, int $id): JsonResponse
    {
        $design = SavedDesign::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with('customizerProduct.layerCategories.options')
            ->firstOrFail();

        return response()->json([
            'design' => new SavedDesignResource($design),
        ]);
    }

    /** PUT /api/customizer/designs/{id} */
    public function update(StoreDesignRequest $request, int $id): JsonResponse
    {
        $design = SavedDesign::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $design->update([
            'name'          => $request->name,
            'configuration' => $request->configuration,
        ]);

        $design->load('customizerProduct');

        return response()->json([
            'design' => new SavedDesignResource($design),
        ]);
    }

    /** DELETE /api/customizer/designs/{id} */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $design = SavedDesign::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $design->delete();

        return response()->json(['message' => 'Design deleted.']);
    }
}
