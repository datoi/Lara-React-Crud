<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // orders: user_id already has a FK index (constrained()), but tailor_id was added later
        Schema::table('orders', function (Blueprint $table) {
            $table->index('tailor_id');
            $table->index('status');
        });

        // order_items: product_id has no index (added via plain foreignId in original migration)
        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id');
            $table->index('product_id');
        });

        // reviews: product_id is nullable and heavily queried for rating aggregates
        Schema::table('reviews', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('user_id');
        });

        // kere_notifications: user_id + is_read are queried together on every bell open
        Schema::table('kere_notifications', function (Blueprint $table) {
            $table->index(['user_id', 'is_read']);
        });

        // messages: order_id is the primary access pattern for chat polling
        Schema::table('messages', function (Blueprint $table) {
            // index('order_id') already added in create migration; skip to avoid duplicate
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['tailor_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
            $table->dropIndex(['product_id']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('kere_notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_read']);
        });
    }
};
