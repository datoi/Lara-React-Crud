<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What a tailor tells us when they sign up.
 *
 * Two of these are not for showing. `national_id` and `id_document_path` exist
 * for Kere's own verification and must never reach a public profile — they are
 * in the model's $hidden and the tailor endpoints build explicit allowlists, so
 * neither leaks by being added here.
 *
 * Experience deliberately gets no column: registration asks it as a band, and
 * the bands map onto the `years_experience` integer that already exists and is
 * already shown and editable on the profile (0, 1, 3, 5, 10 — the lower bound
 * of each, which recovers the band exactly). One field the tailor can refine
 * later beats two that drift apart.
 *
 * The bank account the source document asks for is deliberately absent too: it
 * says itself that it belongs at the verification stage rather than the first
 * screen, and there is nothing to pay out to before a tailor is approved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // independent | atelier | workshop | designer
            $table->string('business_type')->nullable()->after('role');
            $table->string('workspace_address')->nullable()->after('business_type');
            // individual | sole_trader | llc | other
            $table->string('legal_status')->nullable()->after('workspace_address');
            $table->string('national_id')->nullable()->after('legal_status');
            $table->string('id_document_path')->nullable()->after('national_id');
            // All three consents are mandatory and given together, so one
            // timestamp records that the set was accepted, and when.
            $table->timestamp('terms_accepted_at')->nullable()->after('id_document_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'business_type', 'workspace_address', 'legal_status',
                'national_id', 'id_document_path', 'terms_accepted_at',
            ]);
        });
    }
};
