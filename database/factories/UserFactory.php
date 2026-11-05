<?php

namespace Database\Factories;

use App\Models\User;
use App\Support\LegalDocuments;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * A customer made with terms_accepted_at has finished registering, and
     * finishing registration records the terms and privacy policy it accepted
     * (CustomerOnboardingController::completeProfile). To make an account from
     * before that record existed, set terms_accepted_at after creating it.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            if (($user->role ?? 'customer') === 'customer' && $user->terms_accepted_at !== null) {
                LegalDocuments::record($user, ['terms' => true, 'privacy' => true], 'registration', []);
            }
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
