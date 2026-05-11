<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->decimal('display_scale', 4, 2)->default(1.00)->after('alt_image_path');
        });
    }

    public function down(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->dropColumn('display_scale');
        });
    }
};
