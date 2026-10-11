<?php

use App\Models\User;

/**
 * A refused sign-in answers with a code, because the sign-in page is Georgian
 * and the server's sentences are not: the page translates the code instead.
 */
test('a suspended account is refused with a code', function () {
    $user = User::factory()->create(['role' => 'customer', 'is_suspended' => true]);

    $this->postJson('/api/login', ['login' => $user->email, 'password' => 'password', 'role' => 'customer'])
        ->assertStatus(403)
        ->assertJsonPath('code', 'account_suspended');
});

test('signing in on the other role\'s page is refused with a code', function () {
    $tailor = User::factory()->create(['role' => 'tailor', 'approval_status' => 'approved']);

    $this->postJson('/api/login', ['login' => $tailor->email, 'password' => 'password', 'role' => 'customer'])
        ->assertStatus(403)
        ->assertJsonPath('code', 'wrong_role');
});
