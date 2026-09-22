<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Customers who registered before there was an age step.
 *
 * Registration now asks for a date of birth and the terms, and an account that
 * has answered neither cannot place an order — which is right for someone who
 * abandoned the new flow halfway, and badly wrong for the people who signed up
 * under the old one. They did accept the terms of the day; the form simply never
 * recorded when, and nobody ever asked their birthday.
 *
 * Backfilling their acceptance is what keeps them able to order. Their date of
 * birth stays null on purpose rather than being invented: an unknown age reads
 * as "no guardian needed", which is the same answer the old flow gave them, and
 * a made-up birthday would be a worse record than an absent one.
 *
 * Only rows that predate this migration are touched — anyone registering after
 * it gets both fields at once, from the step that asks.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'customer')
            ->whereNull('terms_accepted_at')
            ->update(['terms_accepted_at' => now()]);
    }

    /**
     * Not reversible: clearing these would lock the same accounts out again, and
     * the acceptance they record is real regardless of when it was written down.
     */
    public function down(): void
    {
        //
    }
};
