<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LayerCategory extends Model
{
    protected $fillable = [
        'customizer_product_id',
        'name',
        'children_label',
        'slug',
        'z_index',
        'is_required',
        'is_colorable',
        'display_order',
    ];

    protected $casts = [
        'z_index'       => 'integer',
        'is_required'   => 'boolean',
        'is_colorable'  => 'boolean',
        'display_order' => 'integer',
    ];

    public function customizerProduct(): BelongsTo
    {
        return $this->belongsTo(CustomizerProduct::class);
    }

    /** Only top-level options (not children of another option) */
    public function options(): HasMany
    {
        return $this->hasMany(LayerOption::class)
                    ->whereNull('parent_option_id')
                    ->where('is_active', true)
                    ->orderBy('display_order');
    }

    public function allOptions(): HasMany
    {
        return $this->hasMany(LayerOption::class)
                    ->orderBy('display_order');
    }
}
