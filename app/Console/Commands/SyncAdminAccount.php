<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Keeps the admin account's sign-in in step with ADMIN_EMAIL and
 * ADMIN_PASSWORD, which live only in Railway's variables, never in the
 * repository (it is public). start.sh runs this on every deploy.
 *
 * - No password set: nothing is created and the existing password is kept,
 *   rather than falling back to a value anyone could read in the code.
 * - A new email renames the existing admin, so the old email stops working.
 * - An email that already belongs to a customer or tailor is refused: this
 *   must never turn someone else's account into an admin.
 * - A changed password signs the admin out everywhere.
 *
 * It never fails the deploy; a problem is printed to the deploy log instead.
 */
class SyncAdminAccount extends Command
{
    /** The address the admin account was created with before ADMIN_EMAIL existed. */
    public const LEGACY_EMAIL = 'admin@kere.ge';

    public const MIN_PASSWORD_LENGTH = 12;

    protected $signature = 'admin:sync';

    protected $description = 'Set the admin sign-in from ADMIN_EMAIL and ADMIN_PASSWORD';

    public function handle(): int
    {
        $email = strtolower(trim((string) config('services.admin.email'))) ?: self::LEGACY_EMAIL;
        $password = (string) config('services.admin.password');

        if ($password !== '' && strlen($password) < self::MIN_PASSWORD_LENGTH) {
            $this->error('ADMIN_PASSWORD is shorter than '.self::MIN_PASSWORD_LENGTH.' characters; the admin password was not changed.');
            $password = '';
        }

        $existing = User::where('email', $email)->first();
        if ($existing && $existing->role !== 'admin') {
            $this->error("ADMIN_EMAIL {$email} belongs to a {$existing->role} account; the admin account was not changed.");

            return self::SUCCESS;
        }

        $admin = $existing ?? User::where('role', 'admin')->where('email', self::LEGACY_EMAIL)->first();

        if (! $admin) {
            if ($password === '') {
                $this->warn('No admin account exists and ADMIN_PASSWORD is not set; none was created.');

                return self::SUCCESS;
            }
            User::create(['name' => 'Admin', 'first_name' => 'Admin', 'email' => $email, 'password' => $password, 'role' => 'admin']);
            $this->info("Admin account created for {$email}.");

            return self::SUCCESS;
        }

        if ($admin->email !== $email) {
            $this->info("Admin email changed from {$admin->email} to {$email}.");
            $admin->email = $email;
        }

        if ($password === '') {
            $this->warn('ADMIN_PASSWORD is not set; the admin password was kept as it is.');
        } elseif (! Hash::check($password, $admin->password)) {
            $admin->password = $password;
            $admin->api_token = null;
            $this->info('Admin password changed; the admin is signed out everywhere.');
        }

        $admin->save();

        return self::SUCCESS;
    }
}
