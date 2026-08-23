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
            'configuration' => $this->preserveMaps($this->configuration),
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

    /**
     * Keep integer-keyed maps as JSON objects.
     *
     * configuration.selections is layer_category_id => layer_option_id. Every
     * key is numeric, so JsonResource::removeMissingValues() decides the array
     * is a list and runs array_values() over it — the response arrives as
     * [173,178,182] and which attribute each option belonged to is gone, so a
     * reopened design silently falls back to defaults. Casting maps to objects
     * takes them out of that array-filtering path; genuine lists (spec) stay
     * lists.
     */
    private function preserveMaps(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        $mapped = array_map(fn ($item) => $this->preserveMaps($item), $value);

        return array_is_list($mapped) ? $mapped : (object) $mapped;
    }
}
