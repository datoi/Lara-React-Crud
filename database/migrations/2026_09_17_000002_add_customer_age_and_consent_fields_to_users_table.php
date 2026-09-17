<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Age and consent, for customers.
 *
 * There is no new status column. Whether an account may act is read from these
 * fields rather than mirrored into a flag that can disagree with them: a
 * registration is unfinished while `date_of_birth` or `terms_accepted_at` is
 * null, and a sixteen- or seventeen-year-old is restricted while
 * `guardian_consent_at` is null. `approval_status` is left alone deliberately —
 * it means "an admin has vetted this tailor", and borrowing it here would put
 * every customer into the tailor approval queue.
 *
 * `guardian_consent_token` holds a SHA-256 hash, never the token itself. The
 * raw value goes out in one email to the guardian and is not recoverable from
 * the database, so a leaked dump cannot be used to consent on a child's behalf.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('phone');
            // Opt-in, so it defaults to off and only a ticked box turns it on.
            $table->boolean('marketing_opt_in')->default(false)->after('date_of_birth');

            // Only ever set for a customer who was 16 or 17 when they registered.
            $table->string('guardian_name')->nullable()->after('marketing_opt_in');
            $table->string('guardian_email')->nullable()->after('guardian_name');
            $table->string('guardian_phone')->nullable()->after('guardian_email');
            // parent | legal_guardian
            $table->string('guardian_relationship')->nullable()->after('guardian_phone');
            $table->string('guardian_consent_token')->nullable()->index()->after('guardian_relationship');
            $table->timestamp('guardian_consent_at')->nullable()->after('guardian_consent_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['guardian_consent_token']);
            $table->dropColumn([
                'date_of_birth', 'marketing_opt_in',
                'guardian_name', 'guardian_email', 'guardian_phone',
                'guardian_relationship', 'guardian_consent_token', 'guardian_consent_at',
            ]);
        });
    }
};
