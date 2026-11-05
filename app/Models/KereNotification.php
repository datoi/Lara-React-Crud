<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KereNotification extends Model
{
    protected $table = 'kere_notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'is_read',
    ];

    protected $casts = [
        'data'    => 'array',
        'is_read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Tell someone about a step in an order. Never throws: the step has already
     * happened, and a failed notification must not undo it or hide it.
     */
    public static function aboutOrder(?int $userId, Order $order, string $type, string $title, string $body): void
    {
        if (! $userId) {
            return;
        }

        try {
            static::create([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'data' => ['order_id' => $order->id],
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Notification {$type} failed for {$order->order_number}: ".$e->getMessage());
        }
    }

    /** The same, to every admin. */
    public static function toAdmins(Order $order, string $type, string $title, string $body): void
    {
        User::where('role', 'admin')->pluck('id')->each(fn ($id) => static::aboutOrder($id, $order, $type, $title, $body));
    }

    /**
     * Tell every admin a tailor has applied and waits for approval. Never
     * throws: the account already exists.
     */
    public static function tailorApplied(User $tailor): void
    {
        try {
            User::where('role', 'admin')->pluck('id')->each(fn ($id) => static::create([
                'user_id' => $id,
                'type' => 'tailor_application',
                'title' => 'მკერავის ახალი განაცხადი',
                'body' => "{$tailor->getFullName()} დარეგისტრირდა მკერავად — განაცხადს „ადამიანები“ განყოფილებაში იხილავთ.",
                'data' => ['tailor_id' => $tailor->id],
                'is_read' => false,
            ]));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Tailor application notification for user {$tailor->id} failed: ".$e->getMessage());
        }
    }
}
