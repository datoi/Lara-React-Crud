<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('layer_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('layer_category_id')
                  ->constrained('layer_categories')
                  ->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            // Path relative to storage/app/public — served via /storage/...
            $table->string('image_path');
            $table->string('thumbnail_path')->nullable();
            $table->decimal('price_modifier', 8, 2)->default(0);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();

            $table->unique(['layer_category_id', 'slug']);
            $table->index('is_active');
            $table->index('is_default');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('layer_options');
    }
};
