<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A card payment that went through, kept so it can be refunded by its own gateway reference. */
class OrderPayment extends Model
{
    protected $fillable = ['order_id', 'stage', 'reference', 'gateway_payment_id', 'amount', 'refunded_amount', 'paid_at'];

    protected $casts = [
        'amount' => 'float',
        'refunded_amount' => 'float',
        'paid_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function refundable(): float
    {
        return round($this->amount - $this->refunded_amount, 2);
    }
}
