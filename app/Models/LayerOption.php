<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LayerOption extends Model
{
    protected $fillable = [
        'layer_category_id',
        'name',
        'slug',
        'image_path',
        'thumbnail_path',
        'alt_image_path',
        'display_scale',
        'price_modifier',
        'is_default',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'display_scale'  => 'float',
        'price_modifier' => 'float',
        'is_default'     => 'boolean',
        'is_active'      => 'boolean',
        'display_order'  => 'integer',
    ];

    public function layerCategory(): BelongsTo
    {
        return $this->belongsTo(LayerCategory::class);
    }
}
