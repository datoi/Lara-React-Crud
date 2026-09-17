<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // unpaid | paid | expired | not_required. Custom and remodel settle
            // offline and are 'not_required'; 'expired' is written when an unpaid
            // order is cancelled, which closes it to payment.
            $table->string('payment_status')->default('unpaid')->after('status');
            $table->string('payment_id')->nullable()->after('payment_status'); // Flitt payment_id
            $table->timestamp('paid_at')->nullable()->after('payment_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_id', 'paid_at']);
        });
    }
};
