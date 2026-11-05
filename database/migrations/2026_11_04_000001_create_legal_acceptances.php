<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Proof of what each person agreed to (App\Support\LegalDocuments).
 *
 * legal_document_versions keeps the exact text of every version anyone has
 * accepted. legal_acceptances is append-only: one row per box ticked, never
 * edited. A user with acceptances cannot be deleted (restrictOnDelete), so the
 * proof cannot vanish by accident; the privacy policy keeps account records
 * for five years after an account closes (§13). orders.terms_version_id names
 * the terms an order was placed, or Kere's offer accepted, under.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_document_versions', function (Blueprint $table) {
            $table->id();
            $table->string('document', 40);
            $table->string('version', 20);
            $table->char('sha256', 64);
            $table->longText('content');
            $table->timestamp('created_at')->nullable();
            $table->unique(['document', 'version', 'sha256']);
        });

        Schema::create('legal_acceptances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('document', 40);
            $table->string('version', 20)->nullable();
            $table->foreignId('legal_document_version_id')->nullable()->constrained()->restrictOnDelete();
            $table->boolean('accepted')->default(true);
            $table->string('context', 20);
            $table->string('locale', 5)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamp('accepted_at');
            $table->timestamp('created_at')->nullable();
            $table->index(['user_id', 'document']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('terms_version_id')->nullable()->constrained('legal_document_versions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('terms_version_id');
        });

        Schema::dropIfExists('legal_acceptances');
        Schema::dropIfExists('legal_document_versions');
    }
};
