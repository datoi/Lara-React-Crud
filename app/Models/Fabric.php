<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Fabric extends Model
{
    protected $fillable = [
        'customizer_product_id',
        'name',
        'texture_image_path',
        'color_hex',
        'price_modifier',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'price_modifier' => 'float',
        'is_active'      => 'boolean',
        'display_order'  => 'integer',
    ];

    public function customizerProduct(): BelongsTo
    {
        return $this->belongsTo(CustomizerProduct::class);
    }
}
