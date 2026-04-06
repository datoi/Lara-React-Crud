<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'tailor_id', 'order_number', 'order_type', 'status',
        'subtotal', 'shipping', 'total',
        'custom_design_data',
        'first_name', 'last_name', 'email', 'phone',
        'address', 'city', 'state', 'zip', 'country', 'notes',
    ];

    protected $casts = [
        'subtotal'           => 'float',
        'shipping'           => 'float',
        'total'              => 'float',
        'custom_design_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tailor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tailor_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
