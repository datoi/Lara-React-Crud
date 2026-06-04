<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email');
            $table->string('phone');
            $table->string('otp_email', 6)->nullable();
            $table->string('otp_phone', 6)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->json('registration_data');
            $table->unsignedTinyInteger('email_resend_count')->default(0);
            $table->unsignedTinyInteger('phone_resend_count')->default(0);
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index('email');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verifications');
    }
};
