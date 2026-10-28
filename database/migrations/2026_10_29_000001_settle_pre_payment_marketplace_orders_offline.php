<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Marketplace orders a tailor worked on before card payment went live were
 * settled offline, not by card.
 *
 * Card payment was switched on for kereforyou.com on 2026-09-25; before then
 * production had no Flitt credentials and no order could be paid online. Those
 * orders took the column default, 'unpaid', which since 2026-10-28 is what keeps
 * a marketplace order away from its tailor until the customer pays (terms §6).
 * Left as they were, an order a tailor was already making would vanish from
 * their dashboard, and a finished one would lose its courier step in the admin
 * panel. 'not_required' says what they are, as 2026_09_15_000001 did for
 * custom and remodel orders.
 *
 * Only orders the tailor had already taken on are settled. One still 'pending'
 * may be waiting for its customer to pay online (the owner's call, 2026-10-29),
 * so it stays 'unpaid', keeps its Pay button, and reaches the tailor once paid.
 * Anything paid or expired is a real state and is left exactly as it is.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')
            ->where('order_type', 'marketplace')
            ->where('payment_status', 'unpaid')
            ->whereIn('status', ['processing', 'finished', 'shipped', 'delivered'])
            ->where('created_at', '<', '2026-09-25 00:00:00')
            ->update(['payment_status' => 'not_required']);
    }

    /**
     * Not reversible: 'unpaid' was never a meaningful state for these orders,
     * and restoring it would hide them from their tailors again.
     */
    public function down(): void
    {
        //
    }
};
