<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('layer_option_colors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('layer_option_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('color_hex', 9);
            $table->string('image_path');
            $table->string('back_image_path')->nullable();
            $table->string('left_image_path')->nullable();
            $table->string('right_image_path')->nullable();
            $table->boolean('is_default')->default(false);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('layer_option_colors');
    }
};
