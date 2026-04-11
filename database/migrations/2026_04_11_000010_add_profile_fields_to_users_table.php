<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('api_token');
            $table->string('specialty')->nullable()->after('bio');
            $table->unsignedSmallInteger('years_experience')->nullable()->after('specialty');
            $table->string('profile_image')->nullable()->after('years_experience');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'specialty', 'years_experience', 'profile_image']);
        });
    }
};
