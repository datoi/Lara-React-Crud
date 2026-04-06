<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('tailor_id')->nullable()->after('user_id')
                  ->constrained('users')->nullOnDelete();
            $table->string('order_type')->default('marketplace')->after('tailor_id'); // marketplace | custom
            $table->json('custom_design_data')->nullable()->after('order_type');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->json('cm_measurements')->nullable()->after('custom_design');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['tailor_id']);
            $table->dropColumn(['tailor_id', 'order_type', 'custom_design_data']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('cm_measurements');
        });
    }
};
