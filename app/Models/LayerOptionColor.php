<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LayerOptionColor extends Model
{
    protected $fillable = [
        'layer_option_id',
        'name',
        'color_hex',
        'image_path',
        'back_image_path',
        'left_image_path',
        'right_image_path',
        'is_default',
        'display_order',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'display_order' => 'integer',
    ];

    public function layerOption(): BelongsTo
    {
        return $this->belongsTo(LayerOption::class);
    }
}
