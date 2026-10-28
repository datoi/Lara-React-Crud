<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One request to the gateway to give money back, and what it answered. */
class OrderRefund extends Model
{
    protected $fillable = ['order_id', 'order_payment_id', 'amount', 'status', 'reverse_id', 'admin_id', 'note', 'response_code'];

    protected $casts = ['amount' => 'float'];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(OrderPayment::class, 'order_payment_id');
    }
}
