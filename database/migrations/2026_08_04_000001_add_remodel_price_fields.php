<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Optional budget a remodel customer is willing to pay (₾). Null = no preference.
            $table->decimal('expected_price', 10, 2)->nullable()->after('total');
        });

        Schema::table('tailor_requests', function (Blueprint $table) {
            // Price a tailor offers for the job (₾). Null = no price quoted with the offer.
            $table->decimal('offered_price', 10, 2)->nullable()->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('expected_price');
        });

        Schema::table('tailor_requests', function (Blueprint $table) {
            $table->dropColumn('offered_price');
        });
    }
};
