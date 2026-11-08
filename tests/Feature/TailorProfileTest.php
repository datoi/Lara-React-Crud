<?php

use App\Models\User;
use Illuminate\Support\Str;

/**
 * The profile editor loads the tailor's saved profile before it can save.
 * Until 2026-11-08 it read the public tailor endpoint removed on 2026-10-28,
 * found nothing, and saving wrote an empty form over the profile, switching
 * remodel work off.
 */
function profileUser(array $attributes): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge(['api_token' => hash('sha256', $token)], $attributes));

    return [$user, $token];
}

it('gives an approved tailor their saved profile', function () {
    [, $token] = profileUser([
        'role' => 'tailor', 'approval_status' => 'approved', 'bio' => 'Twenty years of alterations',
        'specialty' => 'Wedding dresses', 'years_experience' => 20, 'does_remodeling' => true,
    ]);

    $this->withToken($token)->getJson('/api/tailor/profile')->assertOk()
        ->assertJsonPath('tailor.bio', 'Twenty years of alterations')
        ->assertJsonPath('tailor.specialty', 'Wedding dresses')
        ->assertJsonPath('tailor.years_experience', 20)
        ->assertJsonPath('tailor.does_remodeling', true)
        ->assertJsonMissingPath('tailor.national_id')
        ->assertJsonMissingPath('tailor.phone');
});

it('refuses the profile to anyone but an approved tailor', function (array $attributes, int $status) {
    [, $token] = profileUser($attributes);

    $this->withToken($token)->getJson('/api/tailor/profile')->assertStatus($status);
})->with([
    'pending tailor' => [['role' => 'tailor', 'approval_status' => 'pending'], 403],
    'rejected tailor' => [['role' => 'tailor', 'approval_status' => 'rejected'], 403],
    'customer' => [['role' => 'customer'], 403],
]);

it('refuses a guest', function () {
    $this->getJson('/api/tailor/profile')->assertUnauthorized();
});
