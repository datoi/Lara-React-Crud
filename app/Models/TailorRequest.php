<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TailorRequest extends Model
{
    protected $fillable = [
        'order_id',
        'tailor_id',
        'message',
        'offered_price',
        'ready_in_days',
        'status',
    ];

    protected $casts = [
        'offered_price' => 'float',
        'ready_in_days' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function tailor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tailor_id');
    }
}
