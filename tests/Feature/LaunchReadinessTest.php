<?php

use App\Models\KereNotification;
use App\Models\Order;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Str;

/**
 * What the 2026-11-08 pre-launch QA found: an email is one address whatever
 * its letter case, and Kere hears when a tailor drops an order the customer
 * already accepted, in words the customer can read.
 */
it('treats an email as one address whatever its letter case', function () {
    $user = User::factory()->create(['email' => 'Nino.K@Example.com', 'password' => 'secret123', 'role' => 'customer']);

    $this->postJson('/api/login', ['login' => 'nino.k@example.com', 'password' => 'secret123', 'role' => 'customer'])
        ->assertOk();

    $this->postJson('/api/register/availability', ['email' => 'NINO.K@example.com'])
        ->assertJson(['email_taken' => true]);

    $this->postJson('/api/register/initiate', [
        'first_name' => 'Nino', 'last_name' => 'K', 'email' => 'nino.k@EXAMPLE.com', 'phone' => '+995599111222',
        'password' => 'secret123', 'password_confirmation' => 'secret123', 'role' => 'customer', 'verify_via' => 'email',
    ])->assertStatus(422)->assertJsonPath('errors.email.0', 'email_taken');

    expect(User::findByLogin('  NINO.K@EXAMPLE.COM '))->id->toBe($user->id);
});

it('stores a new email in lower case, so signing in never depends on how it was typed', function () {
    $this->postJson('/api/register/initiate', [
        'first_name' => 'Ana', 'last_name' => 'B', 'email' => ' Ana.B@Example.com ', 'phone' => '+995599111333',
        'password' => 'secret123', 'password_confirmation' => 'secret123', 'role' => 'customer', 'verify_via' => 'email',
    ])->assertOk()->assertJsonPath('email', 'ana.b@example.com');

    $record = Verification::where('phone', '+995599111333')->firstOrFail();

    $this->postJson('/api/register/verify-email', ['verification_id' => $record->id, 'code' => $record->otp_email])->assertOk();

    expect(User::where('phone', '+995599111333')->value('email'))->toBe('ana.b@example.com');
});

function launchUser(string $role): array
{
    $token = Str::random(60);
    $user = User::factory()->create([
        'role' => $role,
        'terms_accepted_at' => now(),
        'approval_status' => $role === 'tailor' ? 'approved' : null,
        'api_token' => hash('sha256', $token),
    ]);

    return [$user, $token];
}

it('tells Kere and the customer, in Georgian, when a tailor drops an accepted remodel before it is paid', function () {
    [$admin] = launchUser('admin');
    [$customer] = launchUser('customer');
    [$tailor, $tailorToken] = launchUser('tailor');

    $order = Order::create([
        'user_id' => $customer->id, 'tailor_id' => $tailor->id, 'order_number' => 'RMD-'.Str::upper(Str::random(8)),
        'order_type' => 'remodel', 'status' => 'pending', 'payment_status' => 'unpaid',
        'subtotal' => 40, 'shipping' => 15, 'total' => 55, 'deposit_amount' => 35,
        'first_name' => 'Nino', 'last_name' => 'K', 'email' => $customer->email, 'phone' => '+995599000000',
        'address' => 'Street 1', 'city' => 'Tbilisi', 'zip' => '', 'country' => 'GE',
    ]);

    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'cancelled'])->assertOk();

    $toKere = KereNotification::where('user_id', $admin->id)->where('type', 'order_cancelled')->firstOrFail();
    $toCustomer = KereNotification::where('user_id', $customer->id)->where('type', 'order_status')->firstOrFail();

    expect($order->fresh()->status)->toBe('cancelled')
        ->and($toKere->body)->toContain('მკერავმა')->toContain($order->order_number)
        ->and($toCustomer->body)->toContain($order->order_number)->toContain('გაუქმდა')
        ->and(KereNotification::where('user_id', $admin->id)->where('type', 'refund_due')->exists())->toBeFalse();
});

it('answers a wrong or exhausted registration code with a code the page can translate', function () {
    $this->postJson('/api/register/initiate', [
        'first_name' => 'Ana', 'last_name' => 'B', 'email' => 'ana.codes@example.com', 'phone' => '+995599111444',
        'password' => 'secret123', 'password_confirmation' => 'secret123', 'role' => 'customer', 'verify_via' => 'email',
    ])->assertOk();

    $record = Verification::where('phone', '+995599111444')->firstOrFail();
    $wrong = $record->otp_email === '000000' ? '111111' : '000000';

    foreach (range(1, 4) as $attempt) {
        $this->postJson('/api/register/verify-email', ['verification_id' => $record->id, 'code' => $wrong])
            ->assertStatus(422)->assertJsonPath('code', 'code_incorrect');
    }

    $this->postJson('/api/register/verify-email', ['verification_id' => $record->id, 'code' => $wrong])
        ->assertStatus(422)->assertJsonPath('code', 'too_many_attempts');
});
