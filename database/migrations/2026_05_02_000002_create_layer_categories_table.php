<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('layer_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customizer_product_id')
                  ->constrained('customizer_products')
                  ->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            // Lower z_index renders behind (layer 1 = bottom silhouette)
            $table->unsignedSmallInteger('z_index')->default(1);
            $table->boolean('is_required')->default(true);
            // Whether a fabric color tint can be applied to this layer
            $table->boolean('is_colorable')->default(false);
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();

            $table->unique(['customizer_product_id', 'slug']);
            $table->index('display_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('layer_categories');
    }
};
