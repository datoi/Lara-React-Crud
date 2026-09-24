<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Whether a tailor takes remodel work — altering a garment the customer
 * already owns. Remodel requests are offered only to tailors for whom this is
 * true: the notification, the open-orders feed and the offer itself.
 *
 * Null for everyone who is not a tailor. Tailors who registered before the
 * question existed are set to true, because until now every tailor received
 * remodel requests, and quietly cutting them off would shrink the pool no one
 * decided to shrink. They can turn it off from their profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('does_remodeling')->nullable()->after('business_type');
        });

        DB::table('users')->where('role', 'tailor')->update(['does_remodeling' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('does_remodeling');
        });
    }
};
