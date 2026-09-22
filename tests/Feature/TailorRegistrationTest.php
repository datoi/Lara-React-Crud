<?php

use App\Models\User;
use App\Models\Verification;

/**
 * What a tailor has to answer to sign up, and what a customer must not be asked.
 *
 * The consent rules are the trap: 'accepted' rejects a null rather than skipping
 * it, so guarding them with required_if + nullable broke customer registration
 * outright. They are excluded outside the tailor role instead, and that is what
 * the customer cases below hold in place.
 */
function tailorPayload(array $override = []): array
{
    return array_merge([
        'first_name' => 'Nino',
        'last_name' => 'Beridze',
        'phone' => '+995555100200',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'tailor',
        'business_type' => 'atelier',
        'workspace_address' => 'Rustaveli 12, Tbilisi',
        'experience_band' => '3_5',
        'legal_status' => 'sole_trader',
        'national_id' => '01001012345',
        'accept_partnership_terms' => true,
        'accept_data_processing' => true,
        'confirm_information_correct' => true,
    ], $override);
}

test('a tailor must answer every trade question', function () {
    $this->postJson('/api/register/initiate', [
        'first_name' => 'Nino',
        'last_name' => 'Beridze',
        'phone' => '+995555100200',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'tailor',
    ])->assertStatus(422)->assertJsonValidationErrors([
        'business_type', 'workspace_address', 'experience_band',
        'legal_status', 'national_id',
    ]);
});

test('every consent is mandatory on its own', function () {
    foreach (['accept_partnership_terms', 'accept_data_processing', 'confirm_information_correct'] as $consent) {
        $this->postJson('/api/register/initiate', tailorPayload([$consent => false]))
            ->assertStatus(422)
            ->assertJsonValidationErrors([$consent]);
    }
});

test('a customer is never asked any of it', function () {
    // The regression this guards: 'accepted' fails on a null, so a customer who
    // sends no consent boxes was being rejected for not ticking them.
    $this->postJson('/api/register/initiate', [
        'first_name' => 'Data',
        'last_name' => 'Customer',
        'email' => 'customer@example.com',
        'phone' => '+995555300400',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'customer',
    ])->assertStatus(200);
});

test('the trade answers are constrained, not trusted', function () {
    $this->postJson('/api/register/initiate', tailorPayload(['business_type' => 'something-else']))
        ->assertStatus(422)->assertJsonValidationErrors(['business_type']);

    $this->postJson('/api/register/initiate', tailorPayload(['legal_status' => 'pirate']))
        ->assertStatus(422)->assertJsonValidationErrors(['legal_status']);

    $this->postJson('/api/register/initiate', tailorPayload(['experience_band' => '42']))
        ->assertStatus(422)->assertJsonValidationErrors(['experience_band']);
});

test('the answers are carried to the account the verification becomes', function () {
    $this->postJson('/api/register/initiate', tailorPayload())->assertStatus(200);

    $record = Verification::where('phone', '+995555100200')->firstOrFail();

    $this->postJson('/api/register/verify-phone', [
        'verification_id' => $record->id,
        'code' => $record->otp_phone,
    ])->assertStatus(201);

    $user = User::where('phone', '+995555100200')->firstOrFail();

    expect($user->business_type)->toBe('atelier')
        ->and($user->workspace_address)->toBe('Rustaveli 12, Tbilisi')
        ->and($user->legal_status)->toBe('sole_trader')
        ->and($user->national_id)->toBe('01001012345')
        ->and($user->approval_status)->toBe('pending')
        ->and($user->terms_accepted_at)->not->toBeNull();
});

test('an experience band is stored as the number the profile already uses', function () {
    foreach (['under_1' => 0, '1_3' => 1, '3_5' => 3, '5_10' => 5, 'over_10' => 10] as $band => $years) {
        $phone = '+99555540'.str_pad((string) $years, 4, '0', STR_PAD_LEFT);

        $this->postJson('/api/register/initiate', tailorPayload(['phone' => $phone, 'experience_band' => $band]))
            ->assertStatus(200);

        $record = Verification::where('phone', $phone)->firstOrFail();

        expect($record->registration_data['years_experience'])->toBe($years);
    }
});

test('an identity document is never exposed by the model', function () {
    $user = User::factory()->create([
        'role' => 'tailor',
        'national_id' => '01001012345',
        'id_document_path' => 'tailor-ids/secret.pdf',
    ]);

    $serialized = $user->toArray();

    expect($serialized)->not->toHaveKey('national_id')
        ->and($serialized)->not->toHaveKey('id_document_path');
});

test('a public tailor profile carries neither', function () {
    $tailor = User::factory()->create([
        'role' => 'tailor',
        'approval_status' => 'approved',
        'national_id' => '01001012345',
        'id_document_path' => 'tailor-ids/secret.pdf',
    ]);

    $body = $this->getJson("/api/tailors/{$tailor->id}")->assertStatus(200)->getContent();

    expect($body)->not->toContain('01001012345')
        ->and($body)->not->toContain('secret.pdf');
});

test('a taken phone answers with a code, not an English sentence', function () {
    // The interface is Georgian; Laravel's wording is not. The client has no way
    // to translate prose, so anything a real user can trigger answers with a code.
    User::factory()->create(['phone' => '+995555100200']);

    $this->postJson('/api/register/initiate', tailorPayload())
        ->assertStatus(422)
        ->assertJsonPath('errors.phone.0', 'phone_taken');
});

test('a taken email answers with a code too', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/register/initiate', tailorPayload([
        'email' => 'taken@example.com',
        'phone' => '+995555777888',
    ]))->assertStatus(422)->assertJsonPath('errors.email.0', 'email_taken');
});
