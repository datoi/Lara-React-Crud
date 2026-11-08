<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What a tailor wants to work on (App\Support\TailorWork). Null until they
 * answer; does_new_garments null means "not asked yet", which keeps them in
 * the design-request pool as before.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('work_preferences')->nullable()->after('does_remodeling');
            $table->boolean('does_new_garments')->nullable()->after('work_preferences');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['work_preferences', 'does_new_garments']);
        });
    }
};
