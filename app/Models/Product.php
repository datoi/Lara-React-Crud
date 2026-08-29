<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\User;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'tailor_id', 'name', 'slug', 'description', 'price',
        'colors', 'sizes', 'images', 'is_customizable', 'is_featured', 'stock',
        'fabric', 'texture', 'required_measurements', 'status', 'gender',
    ];

    protected $casts = [
        'colors'                => 'array',
        'sizes'                 => 'array',
        'images'                => 'array',
        'required_measurements' => 'array',
        'is_customizable'       => 'boolean',
        'is_featured'           => 'boolean',
        'price'                 => 'float',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tailor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tailor_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function wishlistedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'wishlist_items')->withTimestamps();
    }
}
