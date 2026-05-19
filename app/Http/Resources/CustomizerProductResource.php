<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomizerProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'slug'              => $this->slug,
            'category'          => $this->category,
            'description'       => $this->description,
            'base_price'        => $this->base_price,
            'preview_image_url' => $this->preview_image_path
                                        ? asset('storage/' . $this->preview_image_path)
                                        : null,
            'layer_categories'  => LayerCategoryResource::collection(
                $this->whenLoaded('layerCategories')
            ),
            'fabrics'           => FabricResource::collection(
                $this->whenLoaded('fabrics')
            ),
        ];
    }
}
