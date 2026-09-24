<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/** A complete, valid tailor registration — override a field to test it. */
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
        'does_remodeling' => true,
        'workspace_address' => 'Rustaveli 12, Tbilisi',
        'experience_band' => '3_5',
        'legal_status' => 'sole_trader',
        'national_id' => '01001012345',
        'accept_partnership_terms' => true,
        'accept_data_processing' => true,
        'confirm_information_correct' => true,
    ], $override);
}
