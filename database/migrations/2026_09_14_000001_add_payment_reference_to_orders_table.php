<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The id we hand the payment gateway, which is not the order number.
 *
 * Flitt refuses a second checkout token for an order_id it has already seen
 * ("1013 Duplicate order"), so sending order_number meant an order could be
 * paid once and only once — a customer who closed the tab and came back could
 * never pay, because every retry was a duplicate.
 *
 * Each attempt now gets its own reference, '<order_number>_<random>'. This
 * column holds the latest one, which is what a status query has to ask about.
 * The callback does not read it: it derives the order number from whatever
 * reference the gateway quotes back, so a payment finished in a stale tab
 * still lands on the right order after a newer attempt has superseded it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_reference')->nullable()->unique()->after('payment_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['payment_reference']);
            $table->dropColumn('payment_reference');
        });
    }
};
