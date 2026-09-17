<?php

use App\Mail\GuardianConsentRequest;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Age and consent, which decide whether an account may buy anything.
 *
 * The account exists from the moment the one-time code checks out — before date
 * of birth and the terms are asked for — so "signed up" and "may place orders"
 * are different questions, and both are answered from the stored answers rather
 * than a flag that could disagree with them.
 */
function customer(array $attributes = []): array
{
    $raw = 'tok-'.Str::random(10);

    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'api_token' => hash('sha256', $raw),
        'date_of_birth' => null,
        'terms_accepted_at' => null,
    ], $attributes));

    return [$user, $raw];
}

function birthdayFor(int $age): string
{
    return now()->subYears($age)->subDays(1)->toDateString();
}

beforeEach(fn () => Mail::fake());

// ─── Age ──────────────────────────────────────────────────────────────────────

test('an adult finishes registration in one step', function () {
    [$user, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(30),
        'accept_terms' => true,
        'accept_privacy' => true,
    ])->assertStatus(200)->assertJson([
        'registration_complete' => true,
        'needs_guardian_consent' => false,
        'may_place_orders' => true,
    ]);

    expect($user->fresh()->terms_accepted_at)->not->toBeNull();
});

test('someone under sixteen is refused', function () {
    [$user, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(15),
        'accept_terms' => true,
        'accept_privacy' => true,
    ])->assertStatus(422)->assertJsonPath('code', 'below_minimum_age');

    expect($user->fresh()->date_of_birth)->toBeNull()
        ->and($user->fresh()->mayPlaceOrders())->toBeFalse();
});

test('a future date of birth is refused', function () {
    [, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => now()->addDay()->toDateString(),
        'accept_terms' => true,
        'accept_privacy' => true,
    ])->assertStatus(422)->assertJsonValidationErrors(['date_of_birth']);
});

test('both required consents really are required', function () {
    [, $token] = customer();

    foreach (['accept_terms', 'accept_privacy'] as $box) {
        $this->withToken($token)->postJson('/api/register/profile', [
            'date_of_birth' => birthdayFor(30),
            'accept_terms' => true,
            'accept_privacy' => true,
            $box => false,
        ])->assertStatus(422)->assertJsonValidationErrors([$box]);
    }
});

test('marketing is off unless it is asked for', function () {
    [$user, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(30),
        'accept_terms' => true,
        'accept_privacy' => true,
    ])->assertStatus(200);

    expect($user->fresh()->marketing_opt_in)->toBeFalse();
});

// ─── Guardian ─────────────────────────────────────────────────────────────────

test('a sixteen year old must name a guardian', function () {
    [, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(16),
        'accept_terms' => true,
        'accept_privacy' => true,
    ])->assertStatus(422)->assertJsonValidationErrors([
        'guardian_name', 'guardian_email', 'guardian_phone', 'guardian_relationship',
    ]);
});

test('a seventeen year old is restricted until an adult confirms', function () {
    [$user, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(17),
        'accept_terms' => true,
        'accept_privacy' => true,
        'guardian_name' => 'Mariam Beridze',
        'guardian_email' => 'guardian@example.com',
        'guardian_phone' => '+995555111222',
        'guardian_relationship' => 'parent',
    ])->assertStatus(200)->assertJson([
        'needs_guardian_consent' => true,
        'may_place_orders' => false,
    ]);

    $user->refresh();

    expect($user->registrationComplete())->toBeTrue()
        ->and($user->mayPlaceOrders())->toBeFalse();

    Mail::assertSent(GuardianConsentRequest::class);
});

test('the consent token is stored only as a hash', function () {
    [$user, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(17),
        'accept_terms' => true,
        'accept_privacy' => true,
        'guardian_name' => 'Mariam Beridze',
        'guardian_email' => 'guardian@example.com',
        'guardian_phone' => '+995555111222',
        'guardian_relationship' => 'parent',
    ])->assertStatus(200);

    $stored = $user->fresh()->guardian_consent_token;

    // 64 hex characters and nothing that could be used as a link.
    expect($stored)->toMatch('/^[0-9a-f]{64}$/');
});

test('consent lifts the restriction, and the link is spent', function () {
    [$user, $token] = customer();
    $raw = null;

    Mail::assertNothingSent();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(17),
        'accept_terms' => true,
        'accept_privacy' => true,
        'guardian_name' => 'Mariam Beridze',
        'guardian_email' => 'guardian@example.com',
        'guardian_phone' => '+995555111222',
        'guardian_relationship' => 'legal_guardian',
    ])->assertStatus(200);

    Mail::assertSent(GuardianConsentRequest::class, function ($mail) use (&$raw) {
        $raw = Str::afterLast($mail->consentUrl, '/');

        return true;
    });

    $this->getJson("/api/guardian-consent/{$raw}")->assertStatus(200)
        ->assertJsonPath('customer_name', $user->getFullName());

    $this->postJson("/api/guardian-consent/{$raw}")->assertStatus(200)
        ->assertJson(['consented' => true]);

    expect($user->fresh()->mayPlaceOrders())->toBeTrue();

    // Spent: a consent link that still works is a consent link that replays.
    $this->postJson("/api/guardian-consent/{$raw}")->assertStatus(404)
        ->assertJsonPath('code', 'consent_link_invalid');
});

test('a guessed consent token gives nothing away', function () {
    $this->getJson('/api/guardian-consent/'.Str::random(64))
        ->assertStatus(404)->assertJsonPath('code', 'consent_link_invalid');
});

test('an adult cannot file guardian details against their own account', function () {
    [$user, $token] = customer();

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(30),
        'accept_terms' => true,
        'accept_privacy' => true,
        'guardian_name' => 'Someone Else',
        'guardian_email' => 'someone@example.com',
        'guardian_phone' => '+995555111222',
        'guardian_relationship' => 'parent',
    ])->assertStatus(200);

    expect($user->fresh()->guardian_name)->toBeNull();
});

// ─── The gate ─────────────────────────────────────────────────────────────────

test('an unfinished account cannot order', function () {
    [, $token] = customer();

    $this->withToken($token)->postJson('/api/orders', ['order_type' => 'marketplace'])
        ->assertStatus(403)->assertJsonPath('code', 'registration_incomplete');
});

test('a minor awaiting consent cannot order', function () {
    [, $token] = customer([
        'date_of_birth' => birthdayFor(17),
        'terms_accepted_at' => now(),
        'guardian_consent_at' => null,
    ]);

    $this->withToken($token)->postJson('/api/orders', ['order_type' => 'marketplace'])
        ->assertStatus(403)->assertJsonPath('code', 'guardian_consent_pending');
});

test('a consented minor is past the gate', function () {
    [, $token] = customer([
        'date_of_birth' => birthdayFor(17),
        'terms_accepted_at' => now(),
        'guardian_consent_at' => now(),
    ]);

    // Past the age gate, so it fails on the order payload instead of 403.
    $this->withToken($token)->postJson('/api/orders', ['order_type' => 'marketplace'])
        ->assertStatus(422);
});

test('registration cannot be completed twice', function () {
    [, $token] = customer(['date_of_birth' => birthdayFor(30), 'terms_accepted_at' => now()]);

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(20),
        'accept_terms' => true,
        'accept_privacy' => true,
    ])->assertStatus(409)->assertJsonPath('code', 'already_complete');
});

test('a tailor is not sent down this path', function () {
    [, $token] = customer(['role' => 'tailor']);

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(30),
        'accept_terms' => true,
        'accept_privacy' => true,
    ])->assertStatus(403)->assertJsonPath('code', 'not_a_customer');
});

// ─── Resending the consent link ───────────────────────────────────────────────

test('asking again retires the link that went missing', function () {
    [$user, $token] = customer([
        'date_of_birth' => birthdayFor(17),
        'terms_accepted_at' => now(),
        'guardian_email' => 'guardian@example.com',
    ]);

    $first = null;
    $second = null;

    $this->withToken($token)->postJson('/api/register/guardian-consent/resend')->assertStatus(200);
    Mail::assertSent(GuardianConsentRequest::class, function ($mail) use (&$first) {
        $first = Str::afterLast($mail->consentUrl, '/');

        return true;
    });

    $this->withToken($token)->postJson('/api/register/guardian-consent/resend')->assertStatus(200);
    Mail::assertSent(GuardianConsentRequest::class, function ($mail) use (&$second, $first) {
        $candidate = Str::afterLast($mail->consentUrl, '/');
        if ($candidate !== $first) $second = $candidate;

        return true;
    });

    expect($second)->not->toBeNull()->and($second)->not->toBe($first);

    // Two live links to one child's account is one too many.
    $this->getJson("/api/guardian-consent/{$first}")->assertStatus(404);
    $this->getJson("/api/guardian-consent/{$second}")->assertStatus(200);
});

test('a corrected guardian address is where the link goes', function () {
    [$user, $token] = customer([
        'date_of_birth' => birthdayFor(17),
        'terms_accepted_at' => now(),
        'guardian_email' => 'typo@example.com',
    ]);

    $this->withToken($token)->postJson('/api/register/guardian-consent/resend', [
        'guardian_email' => 'correct@example.com',
    ])->assertStatus(200)->assertJsonPath('guardian_email', 'correct@example.com');

    expect($user->fresh()->guardian_email)->toBe('correct@example.com');
    Mail::assertSent(GuardianConsentRequest::class);
});

test('an adult has nothing to resend', function () {
    [, $token] = customer(['date_of_birth' => birthdayFor(30), 'terms_accepted_at' => now()]);

    $this->withToken($token)->postJson('/api/register/guardian-consent/resend')
        ->assertStatus(422)->assertJsonPath('code', 'consent_not_required');
});

test('a consented account cannot ask again', function () {
    [, $token] = customer([
        'date_of_birth' => birthdayFor(17),
        'terms_accepted_at' => now(),
        'guardian_email' => 'guardian@example.com',
        'guardian_consent_at' => now(),
    ]);

    $this->withToken($token)->postJson('/api/register/guardian-consent/resend')
        ->assertStatus(409)->assertJsonPath('code', 'consent_already_given');
});

test('me reports what the account may do, not what it is made of', function () {
    [$user, $token] = customer([
        'date_of_birth' => birthdayFor(17),
        'terms_accepted_at' => now(),
        'guardian_email' => 'guardian@example.com',
    ]);

    $body = $this->withToken($token)->getJson('/api/me')->assertStatus(200);

    $body->assertJsonPath('user.may_place_orders', false)
        ->assertJsonPath('user.guardian_consent_pending', true)
        ->assertJsonPath('user.guardian_email', 'guardian@example.com');

    // The date of birth is not handed back with it.
    expect($body->getContent())->not->toContain('date_of_birth');
});

// ─── Self-consent ─────────────────────────────────────────────────────────────

test('a minor cannot name their own email as the guardian', function () {
    // Otherwise the consent link arrives in the child's own inbox and the whole
    // control is a minor ticking their own box.
    [$user, $token] = customer(['email' => 'minor@example.com']);

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(17),
        'accept_terms' => true,
        'accept_privacy' => true,
        'guardian_name' => 'Not A Guardian',
        'guardian_email' => 'minor@example.com',
        'guardian_phone' => '+995555111222',
        'guardian_relationship' => 'parent',
    ])->assertStatus(422)->assertJsonPath('errors.guardian_email.0', 'guardian_contact_is_own');

    expect($user->fresh()->guardian_consent_token)->toBeNull();
    Mail::assertNothingSent();
});

test('a minor cannot name their own phone as the guardian', function () {
    [, $token] = customer(['email' => 'minor2@example.com', 'phone' => '+995555777000']);

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => birthdayFor(17),
        'accept_terms' => true,
        'accept_privacy' => true,
        'guardian_name' => 'Not A Guardian',
        'guardian_email' => 'someone@example.com',
        'guardian_phone' => '+995555777000',
        'guardian_relationship' => 'parent',
    ])->assertStatus(422)->assertJsonPath('errors.guardian_phone.0', 'guardian_contact_is_own');
});

test('resending cannot redirect the link to the minor', function () {
    // The correction path must not become the way around the first check.
    [, $token] = customer([
        'email' => 'minor3@example.com',
        'date_of_birth' => birthdayFor(17),
        'terms_accepted_at' => now(),
        'guardian_email' => 'guardian@example.com',
    ]);

    $this->withToken($token)->postJson('/api/register/guardian-consent/resend', [
        'guardian_email' => 'minor3@example.com',
    ])->assertStatus(422)->assertJsonPath('errors.guardian_email.0', 'guardian_contact_is_own');
});

test('age is counted where the customer lives, not in UTC', function () {
    // Between midnight and 04:00 in Georgia the UTC date is still yesterday, so
    // a birthday counted in UTC makes an eighteen-year-old seventeen.
    $tbilisiToday = now(App\Models\User::AGE_TIMEZONE)->startOfDay();

    expect(App\Models\User::ageOn($tbilisiToday->copy()->subYears(18)->toDateString()))->toBe(18)
        ->and(App\Models\User::ageOn($tbilisiToday->copy()->subYears(16)->toDateString()))->toBe(16)
        ->and(App\Models\User::ageOn($tbilisiToday->copy()->subYears(18)->addDay()->toDateString()))->toBe(17);
});
