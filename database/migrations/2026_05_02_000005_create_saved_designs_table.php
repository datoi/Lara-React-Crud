<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_designs', function (Blueprint $table) {
            $table->id();
            // Nullable for guest saves (not used yet but keeps schema future-proof)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->foreignId('customizer_product_id')
                  ->constrained('customizer_products')
                  ->onDelete('cascade');
            $table->string('name');
            // JSON: { "selections": { "<categoryId>": <optionId> }, "fabric_id": <id|null> }
            $table->json('configuration');
            // Optional: path to a generated preview image
            $table->string('preview_image_path')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('customizer_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_designs');
    }
};
