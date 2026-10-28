<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A review is public only once Kere has read it (terms §20: feedback must
     * not name anyone, and Kere may withhold it). pending until an admin
     * decides, then published or hidden. Every existing review starts pending,
     * including those the home page used to show automatically with the
     * customer's full name.
     *
     * A plain string rather than an enum, so a later state needs no PostgreSQL
     * CHECK migration.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->string('status')->default('pending')->index();
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }
};
