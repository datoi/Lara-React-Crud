<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LayerCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'slug'          => $this->slug,
            'z_index'       => $this->z_index,
            'is_required'   => $this->is_required,
            'is_colorable'  => $this->is_colorable,
            'display_order' => $this->display_order,
            'options'       => LayerOptionResource::collection($this->whenLoaded('options')),
        ];
    }
}
