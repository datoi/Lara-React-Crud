<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    /**
     * Products a customer can see and buy: Kere's own (no tailor) or a tailor's
     * who can take work, the same rule as User::canTakeWork(). A pending,
     * rejected or suspended tailor's products are off sale, since nobody would
     * ever make the order (QA_REPORT.md QA-04).
     */
    public function scopeOnSale(Builder $query): Builder
    {
        return $query->where(fn (Builder $q) => $q->whereNull('tailor_id')
            ->orWhereHas('tailor', fn (Builder $t) => $t->ableToTakeWork()));
    }

    /**
     * Whether the ready-made shop is shown at all: only while something is on
     * sale (owner's decision, 2026-11-08). The page shell states it in a meta
     * tag, so every link to the shop hides and returns with the first product.
     */
    public static function shopIsOpen(): bool
    {
        return self::onSale()->exists();
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
