<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tailor_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tailor_id')->constrained('users')->cascadeOnDelete();
            $table->string('message', 500)->nullable();
            $table->string('status', 20)->default('pending'); // pending | accepted | declined
            $table->timestamps();

            $table->unique(['order_id', 'tailor_id']);
            $table->index('tailor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tailor_requests');
    }
};
