<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * What the 2026-10-13 terms promise, given somewhere to live:
 *  - a remodel paid online in two halves (terms §7, §8), each card payment
 *    kept so it can be refunded on its own (§14–§16);
 *  - the courier and the tailor's photos at each hand-over (§12, §13);
 *  - an agreed completion time that changes only with the customer's consent (§17);
 *  - returns within 14 days and problem reports (§15, §16);
 *  - when an order's measurements were deleted (privacy policy §13).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('deposit_amount', 10, 2)->nullable()->after('total');
            $table->timestamp('deposit_paid_at')->nullable()->after('paid_at');
            $table->unsignedSmallInteger('turnaround_days')->nullable()->after('needed_by');
            $table->date('due_date')->nullable()->after('turnaround_days');
            $table->date('proposed_due_date')->nullable()->after('due_date');
            $table->timestamp('picked_up_at')->nullable()->after('proposed_due_date');
            $table->timestamp('received_at')->nullable()->after('picked_up_at');
            $table->json('intake_photos')->nullable()->after('received_at');
            $table->text('intake_notes')->nullable()->after('intake_photos');
            $table->json('finished_photos')->nullable()->after('intake_notes');
            $table->timestamp('shipped_at')->nullable()->after('finished_photos');
            $table->timestamp('cancelled_at')->nullable()->after('delivered_at');
            $table->timestamp('measurements_purged_at')->nullable()->after('cancelled_at');
        });

        Schema::table('tailor_requests', function (Blueprint $table) {
            $table->unsignedSmallInteger('ready_in_days')->nullable()->after('offered_price');
        });

        // One row per card payment that went through. A remodel has two, and a
        // refund has to name the gateway reference of the payment it reverses.
        Schema::create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('stage', 16); // full | deposit | balance
            $table->string('reference')->unique();
            $table->string('gateway_payment_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->decimal('refunded_amount', 10, 2)->default(0);
            $table->timestamp('paid_at');
            $table->timestamps();
        });

        Schema::create('order_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_payment_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('status', 20); // pending | approved | processing | failed
            $table->string('reverse_id', 50)->unique();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->string('response_code')->nullable();
            $table->timestamps();
        });

        Schema::create('order_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16); // return | problem
            $table->text('message')->nullable();
            $table->json('photos')->nullable();
            $table->string('status', 16)->default('open')->index(); // open | resolved | rejected
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        // Marketplace orders already paid by card get their payment on record,
        // so they can be refunded from the admin panel like new ones. The
        // stored reference is the order's latest checkout attempt, which is the
        // one that was paid in every case but a customer finishing in an older
        // tab; a refund on such an order is declined by Flitt and done by hand.
        $paid = DB::table('orders')
            ->where('order_type', 'marketplace')
            ->where('payment_status', 'paid')
            ->get(['id', 'order_number', 'payment_reference', 'payment_id', 'total', 'paid_at', 'updated_at']);

        foreach ($paid as $order) {
            DB::table('order_payments')->insert([
                'order_id' => $order->id,
                'stage' => 'full',
                'reference' => $order->payment_reference ?: $order->order_number,
                'gateway_payment_id' => $order->payment_id,
                'amount' => $order->total,
                'refunded_amount' => 0,
                'paid_at' => $order->paid_at ?? $order->updated_at,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('order_claims');
        Schema::dropIfExists('order_refunds');
        Schema::dropIfExists('order_payments');

        Schema::table('tailor_requests', function (Blueprint $table) {
            $table->dropColumn('ready_in_days');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'deposit_amount', 'deposit_paid_at', 'turnaround_days', 'due_date', 'proposed_due_date',
                'picked_up_at', 'received_at', 'intake_photos', 'intake_notes', 'finished_photos',
                'shipped_at', 'cancelled_at', 'measurements_purged_at',
            ]);
        });
    }
};
