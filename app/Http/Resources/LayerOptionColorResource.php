<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LayerOptionColorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'color_hex' => $this->color_hex,
            'image_url' => $this->resolveUrl($this->image_path),
            'back_image_url' => $this->back_image_path ? $this->resolveUrl($this->back_image_path) : null,
            'left_image_url' => $this->left_image_path ? $this->resolveUrl($this->left_image_path) : null,
            'right_image_url' => $this->right_image_path ? $this->resolveUrl($this->right_image_path) : null,
            'is_default' => $this->is_default,
            'display_order' => $this->display_order,
        ];
    }

    /**
     * Paths starting with '/' are public assets (served directly).
     * Everything else is a storage-relative path.
     */
    private function resolveUrl(string $path): string
    {
        if (str_starts_with($path, 'http')) {
            return $path;
        }

        $encoded = implode('/', array_map('rawurlencode', explode('/', $path)));

        if (str_starts_with($path, '/')) {
            return $encoded;
        }

        return asset('storage/'.$encoded);
    }
}
