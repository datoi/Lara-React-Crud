<?php

use App\Models\User;
use App\Models\Verification;

/**
 * A customer gives both an email and a phone and chooses which one receives
 * the verification code. The phone is only for that code — the email is the
 * channel everything afterwards goes to, so it stays mandatory either way.
 */
function customerPayload(array $override = []): array
{
    return array_merge([
        'first_name' => 'Data',
        'last_name' => 'Customer',
        'email' => 'customer@example.com',
        'phone' => '+995555300400',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'customer',
        'verify_via' => 'email',
    ], $override);
}

test('a customer must choose how to verify, from the two offered', function () {
    $this->postJson('/api/register/initiate', customerPayload(['verify_via' => null]))
        ->assertStatus(422)->assertJsonValidationErrors(['verify_via']);

    $this->postJson('/api/register/initiate', customerPayload(['verify_via' => 'carrier-pigeon']))
        ->assertStatus(422)->assertJsonValidationErrors(['verify_via']);
});

test('the email stays mandatory when the code goes to the phone', function () {
    $this->postJson('/api/register/initiate', customerPayload(['email' => null, 'verify_via' => 'phone']))
        ->assertStatus(422)->assertJsonValidationErrors(['email']);
});

test('a customer who chooses email is sent the code by email only', function () {
    $this->postJson('/api/register/initiate', customerPayload())
        ->assertStatus(200)->assertJsonPath('channel', 'email');

    $record = Verification::where('phone', '+995555300400')->firstOrFail();

    expect($record->otp_email)->not->toBeNull()
        ->and($record->otp_phone)->toBeNull();
});

test('a customer who chooses phone verifies by SMS and keeps their email', function () {
    $this->postJson('/api/register/initiate', customerPayload(['verify_via' => 'phone']))
        ->assertStatus(200)
        ->assertJsonPath('channel', 'phone')
        ->assertJsonPath('phone', '********0400');

    $record = Verification::where('phone', '+995555300400')->firstOrFail();

    expect($record->otp_phone)->not->toBeNull()
        ->and($record->otp_email)->toBeNull();

    $this->postJson('/api/register/verify-phone', [
        'verification_id' => $record->id,
        'code' => $record->otp_phone,
    ])->assertStatus(201)->assertJsonPath('user.role', 'customer');

    $user = User::where('phone', '+995555300400')->firstOrFail();

    expect($user->email)->toBe('customer@example.com')
        ->and($user->approval_status)->toBeNull();
});

test('a code cannot be verified or resent on the channel that was not chosen', function () {
    $this->postJson('/api/register/initiate', customerPayload(['verify_via' => 'phone']))->assertStatus(200);
    $record = Verification::where('phone', '+995555300400')->firstOrFail();

    $this->postJson('/api/register/verify-email', [
        'verification_id' => $record->id,
        'code' => $record->otp_phone,
    ])->assertStatus(422);

    $this->postJson('/api/register/resend', [
        'verification_id' => $record->id,
        'type' => 'email',
    ])->assertStatus(422);

    expect($record->fresh()->otp_email)->toBeNull();
});

test('a phone code can be resent', function () {
    $this->postJson('/api/register/initiate', customerPayload(['verify_via' => 'phone']))->assertStatus(200);
    $record = Verification::where('phone', '+995555300400')->firstOrFail();

    $this->postJson('/api/register/resend', [
        'verification_id' => $record->id,
        'type' => 'phone',
    ])->assertStatus(200);

    expect($record->fresh()->phone_resend_count)->toBe(1);
});
