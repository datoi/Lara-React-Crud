<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customizer_products', function (Blueprint $table) {
            // men | women | unisex — unisex products surface in both sections.
            $table->string('gender', 10)->default('unisex')->after('category');
            $table->index('gender');
        });
    }

    public function down(): void
    {
        Schema::table('customizer_products', function (Blueprint $table) {
            $table->dropIndex(['gender']);
            $table->dropColumn('gender');
        });
    }
};
