<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LayerOption extends Model
{
    protected $fillable = [
        'layer_category_id',
        'parent_option_id',
        'name',
        'slug',
        'image_path',
        'thumbnail_path',
        'alt_image_path',
        'back_image_path',
        'left_image_path',
        'right_image_path',
        'color_hex',
        'display_scale',
        'price_modifier',
        'is_default',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'display_scale' => 'float',
        'price_modifier' => 'float',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function layerCategory(): BelongsTo
    {
        return $this->belongsTo(LayerCategory::class);
    }

    /** Sub-options (e.g. collar variants that belong to a specific sleeve option) */
    public function children(): HasMany
    {
        return $this->hasMany(LayerOption::class, 'parent_option_id')
            ->where('is_active', true)
            ->orderBy('display_order');
    }

    /** Colour variants of this style (each with its own photos) */
    public function colors(): HasMany
    {
        return $this->hasMany(LayerOptionColor::class)
            ->orderBy('display_order');
    }
}
