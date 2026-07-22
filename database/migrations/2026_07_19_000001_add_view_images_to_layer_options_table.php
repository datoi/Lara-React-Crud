<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->string('back_image_path')->nullable()->after('alt_image_path');
            $table->string('left_image_path')->nullable()->after('back_image_path');
            $table->string('right_image_path')->nullable()->after('left_image_path');
        });
    }

    public function down(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->dropColumn(['back_image_path', 'left_image_path', 'right_image_path']);
        });
    }
};
