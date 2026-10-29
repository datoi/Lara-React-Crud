<?php

use App\Mail\NewRegistration;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Facades\Mail;

/**
 * Kere hears about every new account at the address REGISTRATION_ALERT_EMAIL
 * names: customers once their email or SMS code is verified, tailors once
 * their SMS code is. The email names the person and their role, nothing more.
 */
function alertCustomer(): array
{
    return [
        'first_name' => 'ნინო', 'last_name' => 'ბერიძე', 'email' => 'nino@example.com', 'phone' => '+995555300401',
        'password' => 'password123', 'password_confirmation' => 'password123', 'role' => 'customer', 'verify_via' => 'email',
    ];
}

beforeEach(function () {
    Mail::fake();
    config()->set('services.registrations.notify_email', 'alerts@example.test');
});

test('a new customer is announced to Kere once their code is verified', function () {
    $this->postJson('/api/register/initiate', alertCustomer())->assertOk();
    Mail::assertNothingQueued();

    $record = Verification::where('email', 'nino@example.com')->firstOrFail();
    $this->postJson('/api/register/verify-email', ['verification_id' => $record->id, 'code' => $record->otp_email])->assertOk();

    Mail::assertQueued(NewRegistration::class, 1);
    Mail::assertQueued(NewRegistration::class, fn ($mail) => $mail->hasTo('alerts@example.test') && $mail->user->email === 'nino@example.com');
});

test('a new tailor is announced too, by the SMS route', function () {
    $this->postJson('/api/register/initiate', tailorPayload())->assertOk();

    $record = Verification::where('phone', '+995555100200')->firstOrFail();
    $this->postJson('/api/register/verify-phone', ['verification_id' => $record->id, 'code' => $record->otp_phone])->assertCreated();

    Mail::assertQueued(NewRegistration::class, fn ($mail) => $mail->user->role === 'tailor');
});

test('nothing is sent while no address is set', function () {
    config()->set('services.registrations.notify_email', null);

    $this->postJson('/api/register/initiate', alertCustomer())->assertOk();
    $record = Verification::where('email', 'nino@example.com')->firstOrFail();
    $this->postJson('/api/register/verify-email', ['verification_id' => $record->id, 'code' => $record->otp_email])->assertOk();

    Mail::assertNothingQueued();
});

test('the alert is Georgian and names the person and role, not their contact details', function () {
    $tailor = User::factory()->create(['role' => 'tailor', 'first_name' => 'გიორგი', 'last_name' => 'კაპანაძე', 'email' => 'giorgi@example.com', 'phone' => '+995555999888']);

    $mail = new NewRegistration($tailor);
    $html = $mail->render();

    expect($mail->envelope()->subject)->toBe('ახალი რეგისტრაცია Kere-ზე: მკერავი — გიორგი კაპანაძე')
        ->and($html)->toContain('ახალი მკერავი დარეგისტრირდა')->toContain('გიორგი კაპანაძე')->toContain('/admin-dashboard')
        ->and($html)->not->toContain('giorgi@example.com')->not->toContain('555999888');
});
