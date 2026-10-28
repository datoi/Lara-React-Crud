<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    /** customer: the customer and Kere; tailor: the tailor and Kere. */
    protected $fillable = ['order_id', 'sender_id', 'channel', 'message'];

    /** Messages Kere wrote: anything an admin sent. */
    public function scopeFromKere(Builder $query): Builder
    {
        return $query->whereIn('sender_id', User::where('role', 'admin')->select('id'));
    }

    /**
     * What one participant sees of their conversation: their own messages and
     * Kere's. The tailor conversation belongs to the order, so after a
     * reassignment it also holds what the previous tailor wrote, which is
     * theirs and Kere's, not the new tailor's.
     */
    public function scopeVisibleTo(Builder $query, User $viewer): Builder
    {
        return $query->where(fn ($q) => $q->where('sender_id', $viewer->id)->orWhere(fn ($kere) => $kere->fromKere()));
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
