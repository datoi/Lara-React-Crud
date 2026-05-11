<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SavedDesignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'configuration' => $this->configuration,
            'preview_url'   => $this->preview_image_path
                                   ? asset('storage/' . $this->preview_image_path)
                                   : null,
            'product'       => new CustomizerProductResource(
                $this->whenLoaded('customizerProduct')
            ),
            'created_at'    => $this->created_at->toISOString(),
            'updated_at'    => $this->updated_at->toISOString(),
        ];
    }
}
