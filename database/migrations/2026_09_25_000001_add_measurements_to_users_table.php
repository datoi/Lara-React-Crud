<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A customer's body measurements, kept so every order that needs a fit can be
 * prefilled rather than typed again. Null until the customer adds them.
 *
 * Orders never point here: each copies the values it was placed with into its
 * own snapshot, so editing the profile later leaves past orders as they were.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('measurements')->nullable()->after('does_remodeling');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('measurements');
        });
    }
};
