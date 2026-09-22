<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomizerProduct extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'category',
        'gender',
        'description',
        'base_price',
        'is_active',
        'preview_image_path',
    ];

    protected $casts = [
        'base_price' => 'float',
        'is_active'  => 'boolean',
    ];

    public function layerCategories(): HasMany
    {
        return $this->hasMany(LayerCategory::class)
                    ->orderBy('display_order');
    }

    /**
     * Whether any option of this garment has been photographed.
     *
     * A garment with none can be configured and never shown — the customer
     * picks it, specifies it, and the canvas answers that it has not been
     * photographed yet. It is offered here only once there is something to see.
     */
    public function isShowable(): bool
    {
        return $this->layerCategories
            ->flatMap->options
            ->contains(fn (LayerOption $option) => $option->colors->isNotEmpty());
    }

    /**
     * The option slugs this garment can actually be shown in, keyed by attribute.
     *
     * Read off the photography rather than maintained by hand. A photographed
     * option is available by definition; every other attribute takes its
     * available values from what those photographs depict — the shoot records
     * the rest of the cut it captured, so a tee shot body-fitting and cropped
     * says so, and the fits and lengths it was never shot in are not offered.
     *
     * An attribute that no photograph speaks to is absent from the result and
     * left alone by the caller: silence here means "nothing is known", which is
     * not the same as "nothing is available".
     */
    public function availableOptionSlugs(): array
    {
        $available = [];

        foreach ($this->layerCategories as $category) {
            foreach ($category->options as $option) {
                if ($option->colors->isEmpty()) {
                    continue;
                }

                $available[$category->slug][] = $option->slug;

                foreach ($option->depicts ?? [] as $attribute => $slug) {
                    $available[$attribute][] = $slug;
                }
            }
        }

        return array_map(fn (array $slugs) => array_values(array_unique($slugs)), $available);
    }

    public function fabrics(): HasMany
    {
        return $this->hasMany(Fabric::class);
    }

    public function savedDesigns(): HasMany
    {
        return $this->hasMany(SavedDesign::class);
    }
}
