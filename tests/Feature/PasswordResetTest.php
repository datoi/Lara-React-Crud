<?php

use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Forgetting a password (a code by email or SMS, then a new one) and changing
 * it from the dashboard.
 */
function resetUser(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'role' => 'customer',
        'email' => 'nino@example.com',
        'phone' => '+995555123456',
        'password' => 'oldpass123',
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', 'session-token'),
    ], $attributes));
}

/** Ask for a code by email and read it back out of the mail that was sent. */
function emailedResetCode($test, string $login = 'nino@example.com'): array
{
    $id = $test->postJson('/api/password/forgot', ['login' => $login])->assertOk()->json('reset_id');
    $code = null;
    Mail::assertSent(PasswordResetCodeMail::class, function (PasswordResetCodeMail $mail) use (&$code) {
        $code = $mail->code;

        return true;
    });

    return [$id, $code];
}

beforeEach(fn () => Mail::fake());

test('a code goes to the email that was typed, and a new password replaces the old one', function () {
    $user = resetUser();
    [$id, $code] = emailedResetCode($this);

    Mail::assertSent(PasswordResetCodeMail::class, fn ($mail) => $mail->hasTo('nino@example.com'));
    expect(PasswordResetCode::first()->code_hash)->not->toBe($code);

    $this->postJson('/api/password/reset', [
        'reset_id' => $id, 'code' => $code, 'password' => 'newpass456', 'password_confirmation' => 'newpass456',
    ])->assertOk()->assertJsonPath('role', 'customer');

    // Signed out everywhere, the old password refused, the new one accepted.
    expect($user->fresh()->api_token)->toBeNull();
    $this->postJson('/api/login', ['login' => 'nino@example.com', 'password' => 'oldpass123', 'role' => 'customer'])->assertUnauthorized();
    $this->postJson('/api/login', ['login' => 'nino@example.com', 'password' => 'newpass456', 'role' => 'customer'])->assertOk();

    // The code is spent.
    $this->postJson('/api/password/reset', [
        'reset_id' => $id, 'code' => $code, 'password' => 'another789', 'password_confirmation' => 'another789',
    ])->assertStatus(422)->assertJsonPath('code', 'reset_code_invalid');
});

test('a phone number gets the code by SMS, written as a local number or in full', function () {
    config(['services.smsoffice.key' => 'test-key', 'services.smsoffice.sender' => 'Kere']);
    Http::fake(['*' => Http::response(['Success' => true])]);
    resetUser(['role' => 'tailor', 'approval_status' => 'approved', 'email' => null]);

    $id = $this->postJson('/api/password/forgot', ['login' => '555 12 34 56'])->assertOk()
        ->assertJsonPath('channel', 'phone')->json('reset_id');

    $code = null;
    Http::assertSent(function (HttpRequest $request) use (&$code) {
        preg_match('/(\d{6})$/', $request['content'], $m);
        $code = $m[1] ?? null;

        return $request['destination'] === '995555123456' && str_contains($request['content'], 'პაროლის აღდგენის კოდია');
    });
    Mail::assertNothingSent();

    $this->postJson('/api/password/reset', [
        'reset_id' => $id, 'code' => $code, 'password' => 'newpass456', 'password_confirmation' => 'newpass456',
    ])->assertOk()->assertJsonPath('role', 'tailor');
});

test('nobody can find out whether an account exists, and admins are not reset here', function () {
    resetUser();
    User::factory()->create(['role' => 'admin', 'email' => 'office@kere.ge']);

    $known = $this->postJson('/api/password/forgot', ['login' => 'nino@example.com'])->assertOk()->json();
    $unknown = $this->postJson('/api/password/forgot', ['login' => 'nobody@example.com'])->assertOk()->json();
    $admin = $this->postJson('/api/password/forgot', ['login' => 'office@kere.ge'])->assertOk()->json();

    expect(array_keys($unknown))->toBe(array_keys($known))
        ->and(array_keys($admin))->toBe(array_keys($known));
    Mail::assertSentCount(1);

    $this->postJson('/api/password/reset', [
        'reset_id' => $unknown['reset_id'], 'code' => '123456', 'password' => 'newpass456', 'password_confirmation' => 'newpass456',
    ])->assertStatus(422)->assertJsonPath('code', 'reset_code_invalid');
});

test('five wrong codes spend the code, and an old code has expired', function () {
    resetUser();
    [$id, $code] = emailedResetCode($this);
    $wrong = $code === '000000' ? '111111' : '000000';
    $body = ['reset_id' => $id, 'password' => 'newpass456', 'password_confirmation' => 'newpass456'];

    foreach (range(1, 4) as $_) {
        $this->postJson('/api/password/reset', $body + ['code' => $wrong])->assertStatus(422);
    }
    $this->postJson('/api/password/reset', $body + ['code' => $wrong])->assertStatus(410)->assertJsonPath('code', 'reset_expired');
    $this->postJson('/api/password/reset', $body + ['code' => $code])->assertStatus(422);

    $this->travel(1)->minutes();
    [$id, $code] = emailedResetCode($this);
    $this->travel(PasswordResetCode::LIFETIME_MINUTES + 1)->minutes();
    $this->postJson('/api/password/reset', ['reset_id' => $id, 'code' => $code] + $body)
        ->assertStatus(410)->assertJsonPath('code', 'reset_expired');
    expect(User::where('email', 'nino@example.com')->first()->api_token)->not->toBeNull();
});

test('asking again replaces the code, and an account gets at most three codes in fifteen minutes', function () {
    resetUser();
    [$first] = emailedResetCode($this);
    $this->postJson('/api/password/forgot', ['login' => 'nino@example.com'])->assertOk();

    expect(PasswordResetCode::count())->toBe(1)
        ->and(PasswordResetCode::find($first))->toBeNull();

    $this->postJson('/api/password/forgot', ['login' => ' nino@example.com '])->assertOk();
    $this->postJson('/api/password/forgot', ['login' => 'nino@example.com'])
        ->assertStatus(429)->assertJsonPath('code', 'reset_too_many');
    Mail::assertSentCount(3);
});

test('the new password must be at least eight characters with a digit, and confirmed', function () {
    resetUser();
    [$id, $code] = emailedResetCode($this);

    $this->postJson('/api/password/reset', ['reset_id' => $id, 'code' => $code, 'password' => 'short1', 'password_confirmation' => 'short1'])
        ->assertStatus(422)->assertJsonValidationErrors(['password']);
    $this->postJson('/api/password/reset', ['reset_id' => $id, 'code' => $code, 'password' => 'nodigitshere', 'password_confirmation' => 'nodigitshere'])
        ->assertStatus(422)->assertJsonValidationErrors(['password']);
    $this->postJson('/api/password/reset', ['reset_id' => $id, 'code' => $code, 'password' => 'newpass456', 'password_confirmation' => 'newpass457'])
        ->assertStatus(422)->assertJsonValidationErrors(['password']);
});

// ─── Changing it from the dashboard ───────────────────────────────────────────

test('a signed-in customer or tailor changes their password with the current one, and stays signed in', function () {
    $user = resetUser();

    $this->withToken('session-token')->patchJson('/api/me/password', [
        'current_password' => 'wrongpass1', 'password' => 'newpass456', 'password_confirmation' => 'newpass456',
    ])->assertStatus(422)->assertJsonPath('code', 'current_password_wrong');

    $this->withToken('session-token')->patchJson('/api/me/password', [
        'current_password' => 'oldpass123', 'password' => 'newpass456', 'password_confirmation' => 'newpass456',
    ])->assertOk();

    expect($user->fresh()->api_token)->toBe(hash('sha256', 'session-token'));
    $this->withToken('session-token')->getJson('/api/me')->assertOk();
    $this->postJson('/api/login', ['login' => 'nino@example.com', 'password' => 'newpass456', 'role' => 'customer'])->assertOk();

    $tailorToken = Str::random(60);
    resetUser(['role' => 'tailor', 'approval_status' => 'pending', 'email' => 't@example.com', 'phone' => '+995555000999', 'api_token' => hash('sha256', $tailorToken)]);
    $this->withToken($tailorToken)->patchJson('/api/me/password', [
        'current_password' => 'oldpass123', 'password' => 'newpass456', 'password_confirmation' => 'newpass456',
    ])->assertOk();
});

test('changing a password needs a session and is not open to admins', function () {
    $this->patchJson('/api/me/password', ['current_password' => 'x', 'password' => 'newpass456', 'password_confirmation' => 'newpass456'])
        ->assertUnauthorized();

    $token = Str::random(60);
    User::factory()->create(['role' => 'admin', 'password' => 'adminpass1', 'api_token' => hash('sha256', $token)]);
    $this->withToken($token)->patchJson('/api/me/password', [
        'current_password' => 'adminpass1', 'password' => 'newpass456', 'password_confirmation' => 'newpass456',
    ])->assertForbidden();
});
