<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'description', 'price',
        'colors', 'sizes', 'images', 'is_customizable', 'is_featured', 'stock',
    ];

    protected $casts = [
        'colors' => 'array',
        'sizes' => 'array',
        'images' => 'array',
        'is_customizable' => 'boolean',
        'is_featured' => 'boolean',
        'price' => 'float',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
