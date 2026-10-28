<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

/**
 * A customer's feedback on a delivered order (terms §20). It concerns Kere's
 * service: the public sees only reviews an admin has published, with no
 * customer and no tailor named. Each tailor's score is internal, for admins
 * and for the tailor themselves.
 */
class Review extends Model
{
    public const STATUSES = ['pending', 'published', 'hidden'];

    protected $fillable = ['order_id', 'user_id', 'product_id', 'rating', 'comment', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    /**
     * What the review is about, as the public may see it: the kind of order,
     * and the product's name for a ready-made piece. Expects `order.items`.
     *
     * @return array{kind: string|null, product_name: string|null}
     */
    public function publicSubject(): array
    {
        $kind = $this->order?->order_type;

        return [
            'kind' => $kind,
            'product_name' => $kind === 'marketplace' ? $this->order->items->first()?->product_name : null,
        ];
    }

    /**
     * Each tailor's score: the average rating and the count over every reviewed
     * order they made, whatever its kind and whether or not it was published.
     * Hidden reviews still say how the work went.
     *
     * @param  iterable<int>  $tailorIds
     * @return Collection<int, array{average: float, count: int}> keyed by tailor id
     */
    public static function scoresForTailors(iterable $tailorIds): Collection
    {
        $ids = collect($tailorIds)->filter()->unique()->values();
        if ($ids->isEmpty()) {
            return collect();
        }

        return static::query()
            ->join('orders', 'orders.id', '=', 'reviews.order_id')
            ->whereIn('orders.tailor_id', $ids)
            ->groupBy('orders.tailor_id')
            ->selectRaw('orders.tailor_id as tailor_id, COUNT(reviews.id) as reviews_count, AVG(reviews.rating) as average_rating')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->tailor_id => [
                'average' => round((float) $row->average_rating, 1),
                'count' => (int) $row->reviews_count,
            ]]);
    }
}
