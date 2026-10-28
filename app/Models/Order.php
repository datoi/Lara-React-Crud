<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'tailor_id', 'order_number', 'order_type', 'status', 'delivered_at',
        'tailor_assignment_mode', 'offer_request_id', 'offer_price', 'offer_days', 'offer_note', 'offer_sent_at',
        'payment_status', 'payment_id', 'payment_reference', 'paid_at',
        'subtotal', 'shipping', 'total', 'expected_price', 'needed_by',
        'custom_design_data',
        'deposit_amount', 'deposit_paid_at', 'turnaround_days', 'due_date', 'proposed_due_date',
        'picked_up_at', 'received_at', 'intake_photos', 'intake_notes', 'finished_photos',
        'shipped_at', 'cancelled_at', 'measurements_purged_at',
        'first_name', 'last_name', 'email', 'phone',
        'address', 'city', 'state', 'zip', 'country', 'notes',
    ];

    protected $casts = [
        'subtotal'           => 'float',
        'shipping'           => 'float',
        'total'              => 'float',
        'expected_price'     => 'float',
        'needed_by'          => 'date:Y-m-d',
        'custom_design_data' => 'array',
        'delivered_at'       => 'datetime',
        'paid_at'            => 'datetime',
        'deposit_amount'     => 'float',
        'deposit_paid_at'    => 'datetime',
        'turnaround_days'    => 'integer',
        'due_date'           => 'date:Y-m-d',
        'proposed_due_date'  => 'date:Y-m-d',
        'picked_up_at'       => 'datetime',
        'received_at'        => 'datetime',
        'intake_photos'      => 'array',
        'finished_photos'    => 'array',
        'shipped_at'         => 'datetime',
        'cancelled_at'       => 'datetime',
        'measurements_purged_at' => 'datetime',
        'offer_price'        => 'float',
        'offer_days'         => 'integer',
        'offer_sent_at'      => 'datetime',
    ];

    /** Days a ready-made item can be sent back without a reason (terms §15). */
    public const RETURN_DAYS = 14;

    /** Marketplace statuses that still have work ahead of them, and so may be paid for. */
    public const MARKETPLACE_PAYABLE_STATUSES = ['pending', 'pending_assignment', 'processing'];

    /**
     * Payment states in which a marketplace order is the tailor's to see and
     * work on (terms §6): paid, or placed before card payment went live and
     * settled offline.
     */
    public const RELEASED_PAYMENT_STATUSES = ['paid', 'not_required'];

    /**
     * Whether the assigned tailor may see and act on this order. A marketplace
     * order is a basket the customer has not settled until it is paid, so it
     * stays out of the tailor's dashboard, status changes and chat until then.
     */
    public function isReleasedToTailor(): bool
    {
        return $this->order_type !== 'marketplace' || in_array($this->payment_status, self::RELEASED_PAYMENT_STATUSES, true);
    }

    /** The same rule as a query, for the tailor's lists. */
    public function scopeReleasedToTailor(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('order_type', '!=', 'marketplace')->orWhereIn('payment_status', self::RELEASED_PAYMENT_STATUSES));
    }

    /**
     * A remodel paid online: the first half with the delivery fee when an offer
     * is accepted, the second half once the work is done (terms §7, §8).
     * Remodels from before 2026-10-13 were settled offline and keep
     * payment_status 'not_required', so they follow none of the paid steps.
     */
    public function isPaidRemodel(): bool
    {
        return $this->order_type === 'remodel' && $this->payment_status !== 'not_required';
    }

    /**
     * The payment the customer owes now, if any: 'full' for a marketplace
     * order, 'deposit' once a remodel offer is accepted, 'balance' once the
     * remodel is finished. Read by the pay endpoint and sent to the dashboard,
     * so the Pay button and the server cannot disagree.
     */
    public function paymentStageDue(): ?string
    {
        if ($this->order_type === 'marketplace') {
            return $this->payment_status === 'unpaid' && in_array($this->status, self::MARKETPLACE_PAYABLE_STATUSES, true) ? 'full' : null;
        }

        if (! $this->isPaidRemodel()) {
            return null;
        }

        if ($this->payment_status === 'unpaid' && $this->status === 'pending' && $this->tailor_id) {
            return 'deposit';
        }

        return $this->payment_status === 'deposit_paid' && $this->status === 'finished' ? 'balance' : null;
    }

    /** What a payment stage asks for: 'full' (marketplace), 'deposit' or 'balance'. */
    public function amountDue(string $stage): float
    {
        return match ($stage) {
            'deposit' => (float) $this->deposit_amount,
            'balance' => round($this->total - (float) $this->deposit_amount, 2),
            default => $this->total,
        };
    }

    /**
     * Whether Kere has made an offer the customer can still answer. A
     * tailor's price is only an internal estimate; what the customer accepts
     * is Kere's own offer, based on one of those estimates (terms §8).
     */
    public function hasOpenOffer(): bool
    {
        return $this->status === 'pending_assignment' && ! $this->tailor_id && $this->offer_sent_at !== null && $this->offer_request_id !== null;
    }

    /**
     * Kere's offer as the customer is asked to accept it: the price, the
     * delivery fee on top, and for a remodel the first payment that accepting
     * makes due. Null while there is no offer to answer.
     */
    public function offerSummary(): ?array
    {
        if (! $this->hasOpenOffer()) {
            return null;
        }

        return [
            'price' => $this->offer_price,
            'shipping' => $this->shipping,
            'total' => round($this->offer_price + $this->shipping, 2),
            'first_payment' => $this->order_type === 'remodel' ? self::firstPaymentFor($this->offer_price, $this->shipping) : null,
            'days' => $this->offer_days,
            'note' => $this->offer_note,
            'sent_at' => $this->offer_sent_at?->toISOString(),
        ];
    }

    /** Withdraw Kere's offer: declined by the customer, or its tailor dropped out. */
    public function clearOffer(): void
    {
        $this->update(['offer_request_id' => null, 'offer_price' => null, 'offer_days' => null, 'offer_note' => null, 'offer_sent_at' => null]);
    }

    /** A remodel's first payment: half the price, with the delivery fee (terms §7). */
    public static function firstPaymentFor(float $price, float $shipping): float
    {
        return round($price / 2, 2) + $shipping;
    }

    /** Made to the customer's own measurements or notes, so outside the 14-day return (terms §15). */
    public function isMadeToMeasure(): bool
    {
        if ($this->order_type !== 'marketplace') {
            return true;
        }

        return $this->items->contains(fn ($item) => ! empty($item->cm_measurements) || filled($item->customization_note));
    }

    /** The last day a return can be asked for, or null when this order cannot be returned. */
    public function returnableUntil(): ?Carbon
    {
        if ($this->status !== 'delivered' || ! $this->delivered_at || $this->isMadeToMeasure()) {
            return null;
        }

        return $this->delivered_at->copy()->addDays(self::RETURN_DAYS)->endOfDay();
    }

    /** Whether the customer can still cancel: until work on the order begins (terms §14). */
    public function isCancellableByCustomer(): bool
    {
        return in_array($this->status, ['pending_assignment', 'pending'], true);
    }

    /**
     * Cancel the order, once, on behalf of the customer or the tailor ($by).
     *
     * Cancels from the status the order was loaded with, so a customer and a
     * tailor cancelling together, or a cancel racing a status change, cannot
     * both go through. Nothing is owed any more, the stock a marketplace order
     * held goes back on sale, and the admins hear when money or a collected
     * garment has to go back. False when the order had already moved on.
     */
    public function cancel(string $by): bool
    {
        $from = $this->status;

        $won = DB::transaction(function () use ($from) {
            $updated = static::where('id', $this->id)->where('status', $from)->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'proposed_due_date' => null,
                // Decided by the database, not from what was read: a payment
                // credited in between has to stay 'paid', not become 'expired'.
                'payment_status' => DB::raw("CASE WHEN payment_status = 'unpaid' THEN 'expired' ELSE payment_status END"),
            ]);

            if ($updated !== 1) {
                return false;
            }

            if ($this->order_type === 'marketplace') {
                foreach ($this->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                    }
                }
            }

            return true;
        });

        if (! $won) {
            return false;
        }

        $this->refresh();

        $owed = round($this->paidTotal() - $this->refundedTotal(), 2);

        if ($owed > 0 || $this->picked_up_at) {
            $body = ($by === 'tailor' ? 'მკერავმა' : 'მომხმარებელმა')." შეკვეთა #{$this->order_number} გააუქმა.";
            if ($owed > 0) {
                $body .= ' მომხმარებელს დასაბრუნებელია ₾'.number_format($owed, 2).'.';
            }
            if ($this->picked_up_at) {
                $body .= ' სამოსი მომხმარებელს უნდა დაუბრუნდეს.';
            }
            KereNotification::toAdmins($this, 'refund_due', 'გაუქმებული შეკვეთა', $body);
        }

        return true;
    }

    public function paidTotal(): float
    {
        return round((float) $this->payments->sum('amount'), 2);
    }

    public function refundedTotal(): float
    {
        return round((float) $this->payments->sum('refunded_amount'), 2);
    }

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

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function tailorRequests(): HasMany
    {
        return $this->hasMany(TailorRequest::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(OrderPayment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(OrderRefund::class);
    }

    public function offerRequest(): BelongsTo
    {
        return $this->belongsTo(TailorRequest::class, 'offer_request_id');
    }

    public function claims(): HasMany
    {
        return $this->hasMany(OrderClaim::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
