<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Kere as the only seller (terms v1.1, privacy policy of 26 October 2026,
 * revised for Flitt's merchant review):
 *  - a tailor's price is an internal estimate for Kere, and Kere makes the
 *    customer one offer of its own, based on one of them (terms §8);
 *  - the customer talks to Kere and the tailor talks to Kere, never to each
 *    other (terms §18, privacy policy §9), so every message belongs to one of
 *    the two conversations.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // The estimate the offer was based on, which names the tailor who
            // gets the order if the customer accepts. Not a foreign key: the
            // estimates hang off the order, and a cycle of cascades between the
            // two tables is not worth what it would check.
            $table->unsignedBigInteger('offer_request_id')->nullable()->after('tailor_assignment_mode');
            $table->decimal('offer_price', 10, 2)->nullable()->after('offer_request_id');
            $table->unsignedSmallInteger('offer_days')->nullable()->after('offer_price');
            $table->text('offer_note')->nullable()->after('offer_days');
            $table->timestamp('offer_sent_at')->nullable()->after('offer_note');
        });

        Schema::table('messages', function (Blueprint $table) {
            // customer: the customer and Kere; tailor: the tailor and Kere.
            $table->string('channel', 16)->default('customer')->after('sender_id');
            $table->index(['order_id', 'channel']);
        });

        // Until now each order had one conversation, between its customer and
        // its tailor. Each side keeps what it wrote, in its own conversation
        // with Kere; admins still read both.
        DB::table('messages')
            ->whereIn('sender_id', DB::table('users')->where('role', 'tailor')->select('id'))
            ->update(['channel' => 'tailor']);
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['order_id', 'channel']);
            $table->dropColumn('channel');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['offer_request_id', 'offer_price', 'offer_days', 'offer_note', 'offer_sent_at']);
        });
    }
};
