<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fabrics', function (Blueprint $table) {
            $table->id();
            // Nullable: null means this fabric is available for all products
            $table->foreignId('customizer_product_id')
                  ->nullable()
                  ->constrained('customizer_products')
                  ->onDelete('cascade');
            $table->string('name');
            // Optional tileable texture PNG — null means solid color only
            $table->string('texture_image_path')->nullable();
            // Hex color used for tinting (and as fallback when no texture)
            $table->string('color_hex', 9);
            $table->decimal('price_modifier', 8, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();

            $table->index('is_active');
            $table->index('customizer_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fabrics');
    }
};
