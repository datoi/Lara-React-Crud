<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Phone becomes a login identifier, so it must be unique. Clear duplicates
        // first (keeping the oldest account) or the index creation fails on live data.
        $seen = [];
        foreach (DB::table('users')->whereNotNull('phone')->where('phone', '!=', '')->orderBy('id')->get(['id', 'phone']) as $row) {
            if (isset($seen[$row->phone])) {
                DB::table('users')->where('id', $row->id)->update(['phone' => null]);
            } else {
                $seen[$row->phone] = true;
            }
        }
        DB::table('users')->where('phone', '')->update(['phone' => null]);

        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->unique('phone');
        });

        Schema::table('verifications', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->unsignedTinyInteger('phone_attempts')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone']);
            $table->string('email')->nullable(false)->change();
        });

        Schema::table('verifications', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->dropColumn('phone_attempts');
        });
    }
};
