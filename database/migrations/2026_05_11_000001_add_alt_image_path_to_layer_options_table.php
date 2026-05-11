<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->string('alt_image_path')->nullable()->after('thumbnail_path');
        });
    }

    public function down(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->dropColumn('alt_image_path');
        });
    }
};
