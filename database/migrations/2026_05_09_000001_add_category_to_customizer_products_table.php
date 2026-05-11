<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customizer_products', function (Blueprint $table) {
            $table->string('category')->default('shirt')->after('slug');
        });
    }

    public function down(): void
    {
        Schema::table('customizer_products', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
