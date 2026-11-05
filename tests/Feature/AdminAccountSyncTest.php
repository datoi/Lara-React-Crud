<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * `admin:sync`, run by start.sh on every deploy: the admin's sign-in comes
 * from ADMIN_EMAIL and ADMIN_PASSWORD, never from a value in the code.
 */
function legacyAdmin(): User
{
    // The seed migration has already made admin@kere.ge with a random password.
    return User::where('email', 'admin@kere.ge')->where('role', 'admin')->firstOrFail();
}

test('a new email renames the existing admin, and a new password signs it out everywhere', function () {
    $admin = legacyAdmin();
    $admin->forceFill(['api_token' => hash('sha256', 'old-session')])->save();
    config(['services.admin.email' => 'Office@KereForYou.com', 'services.admin.password' => 'a-long-admin-passphrase-42']);

    $this->artisan('admin:sync')->assertSuccessful();

    $admin->refresh();
    expect($admin->email)->toBe('office@kereforyou.com')
        ->and(Hash::check('a-long-admin-passphrase-42', $admin->password))->toBeTrue()
        ->and($admin->api_token)->toBeNull()
        ->and(User::where('email', 'admin@kere.ge')->exists())->toBeFalse()
        ->and(User::where('role', 'admin')->count())->toBe(1);

    $this->postJson('/api/admin/auth', ['email' => 'office@kereforyou.com', 'password' => 'a-long-admin-passphrase-42'])->assertOk();
    $this->postJson('/api/admin/auth', ['email' => 'admin@kere.ge', 'password' => 'a-long-admin-passphrase-42'])->assertUnauthorized();
});

test('running again with the same password keeps the admin signed in', function () {
    config(['services.admin.email' => 'office@kereforyou.com', 'services.admin.password' => 'a-long-admin-passphrase-42']);
    $this->artisan('admin:sync')->assertSuccessful();
    $admin = User::where('email', 'office@kereforyou.com')->firstOrFail();
    $admin->forceFill(['api_token' => hash('sha256', 'session')])->save();

    $this->artisan('admin:sync')->assertSuccessful();

    expect($admin->fresh()->api_token)->toBe(hash('sha256', 'session'));
});

test('without a password nothing falls back to a known one', function () {
    $before = legacyAdmin()->password;
    config(['services.admin.email' => null, 'services.admin.password' => null]);

    $this->artisan('admin:sync')->assertSuccessful();
    expect(legacyAdmin()->password)->toBe($before);

    legacyAdmin()->delete();
    $this->artisan('admin:sync')->assertSuccessful();
    expect(User::where('role', 'admin')->exists())->toBeFalse();
});

test('a short password is refused and the old one kept', function () {
    $before = legacyAdmin()->password;
    config(['services.admin.password' => 'short-pw1']);

    $this->artisan('admin:sync')->assertSuccessful();

    expect(legacyAdmin()->password)->toBe($before);
});

test('an email that belongs to a customer never becomes the admin', function () {
    $customer = User::factory()->create(['role' => 'customer', 'email' => 'nino@example.com']);
    config(['services.admin.email' => 'nino@example.com', 'services.admin.password' => 'a-long-admin-passphrase-42']);

    $this->artisan('admin:sync')->assertSuccessful();

    expect($customer->fresh()->role)->toBe('customer')
        ->and(Hash::check('a-long-admin-passphrase-42', $customer->fresh()->password))->toBeFalse()
        ->and(legacyAdmin()->exists)->toBeTrue();
});

test('with no admin at all, one is created from the variables', function () {
    legacyAdmin()->delete();
    config(['services.admin.email' => 'office@kereforyou.com', 'services.admin.password' => 'a-long-admin-passphrase-42']);

    $this->artisan('admin:sync')->assertSuccessful();

    $admin = User::where('email', 'office@kereforyou.com')->firstOrFail();
    expect($admin->role)->toBe('admin');
});
