<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedDesign extends Model
{
    protected $fillable = [
        'user_id',
        'customizer_product_id',
        'name',
        'configuration',
        'preview_image_path',
    ];

    protected $casts = [
        'configuration' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customizerProduct(): BelongsTo
    {
        return $this->belongsTo(CustomizerProduct::class);
    }
}
