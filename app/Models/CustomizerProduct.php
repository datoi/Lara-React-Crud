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

    public function fabrics(): HasMany
    {
        return $this->hasMany(Fabric::class);
    }

    public function savedDesigns(): HasMany
    {
        return $this->hasMany(SavedDesign::class);
    }
}
