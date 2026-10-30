<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An admin's internal note on an order; only admins ever see it. */
class OrderNote extends Model
{
    protected $fillable = ['order_id', 'admin_id', 'body'];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
