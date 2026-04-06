<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('fabric')->nullable()->after('is_customizable');
            $table->string('texture')->nullable()->after('fabric');
            $table->json('required_measurements')->nullable()->after('texture');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['fabric', 'texture', 'required_measurements']);
        });
    }
};
