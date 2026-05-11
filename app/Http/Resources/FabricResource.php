<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FabricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'color_hex'       => $this->color_hex,
            'texture_url'     => $this->texture_image_path
                                     ? asset('storage/' . $this->texture_image_path)
                                     : null,
            'price_modifier'  => $this->price_modifier,
            'display_order'   => $this->display_order,
        ];
    }
}
