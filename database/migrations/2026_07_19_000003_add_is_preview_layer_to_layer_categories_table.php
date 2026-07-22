<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('layer_categories', function (Blueprint $table) {
            $table->boolean('is_preview_layer')->default(true)->after('is_colorable');
        });
    }

    public function down(): void
    {
        Schema::table('layer_categories', function (Blueprint $table) {
            $table->dropColumn('is_preview_layer');
        });
    }
};
