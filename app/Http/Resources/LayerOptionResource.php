<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LayerOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'slug'             => $this->slug,
            'image_url'        => $this->resolveUrl($this->image_path),
            'thumbnail_url'    => $this->resolveUrl($this->thumbnail_path ?? $this->image_path),
            'alt_image_url'    => $this->alt_image_path
                                      ? $this->resolveUrl($this->alt_image_path)
                                      : null,
            'back_image_url'   => $this->back_image_path
                                      ? $this->resolveUrl($this->back_image_path)
                                      : null,
            'left_image_url'   => $this->left_image_path
                                      ? $this->resolveUrl($this->left_image_path)
                                      : null,
            'right_image_url'  => $this->right_image_path
                                      ? $this->resolveUrl($this->right_image_path)
                                      : null,
            'color_hex'        => $this->color_hex,
            'display_scale'    => $this->display_scale ?? 1.0,
            'price_modifier'   => $this->price_modifier,
            'is_default'       => $this->is_default,
            'display_order'    => $this->display_order,
            'children'         => self::collection($this->whenLoaded('children')),
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

        // Encode each path segment so special chars (+, spaces, parentheses)
        // in filenames are safe in URLs, while slashes are preserved.
        $encoded = implode('/', array_map('rawurlencode', explode('/', $path)));

        if (str_starts_with($path, '/')) {
            return $encoded;
        }

        return asset('storage/' . $encoded);
    }
}
