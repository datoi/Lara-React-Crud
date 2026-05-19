<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->foreignId('parent_option_id')
                  ->nullable()
                  ->after('layer_category_id')
                  ->constrained('layer_options')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->dropForeignIdFor(null, 'parent_option_id');
            $table->dropColumn('parent_option_id');
        });
    }
};
