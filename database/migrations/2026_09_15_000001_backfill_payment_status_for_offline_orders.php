<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Custom and remodel orders are settled offline, not by card.
 *
 * They were created without a payment_status and so took the column default,
 * 'unpaid' — the same value the payment path and the planned orders:expire-unpaid
 * job both read as "this order owes money". Nothing surfaced it, because the
 * dashboard only offers payment on marketplace orders, but scheduling that job
 * against this data would have cancelled every custom and remodel order in the
 * system.
 *
 * Only rows still sitting on the default are touched: anything already paid or
 * expired is a real state and is left exactly as it is.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')
            ->whereIn('order_type', ['custom', 'remodel'])
            ->where('payment_status', 'unpaid')
            ->update(['payment_status' => 'not_required']);
    }

    /**
     * Not reversible: 'unpaid' was never a meaningful state for these orders,
     * and restoring it would re-arm the very job this guards against.
     */
    public function down(): void
    {
        //
    }
};
