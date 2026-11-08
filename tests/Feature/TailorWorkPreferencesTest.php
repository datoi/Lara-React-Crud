<?php

use App\Models\KereNotification;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

/**
 * What a tailor wants to work on (App\Support\TailorWork; the CEO's request,
 * 2026-11-08). Asked on registration and in the dashboard; two answers decide
 * which requests reach the tailor, and admins see all of it.
 */
beforeEach(function () {
    Mail::fake();
    Queue::fake();
});

function registerTailorWith(array $answers, string $phone = '+995555300301'): User
{
    test()->postJson('/api/register/initiate', tailorPayload(['phone' => $phone, 'work_preferences' => $answers]))->assertOk();
    $record = Verification::where('phone', $phone)->firstOrFail();
    test()->postJson('/api/register/verify-phone', ['verification_id' => $record->id, 'code' => $record->otp_phone])->assertCreated();

    return User::where('phone', $phone)->firstOrFail();
}

function workTailor(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true,
        'phone' => '+9955'.random_int(10000000, 99999999), 'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

it('keeps the answers and sets both switches from them', function () {
    $tailor = registerTailorWith(workAnswers([
        'remodel_none' => true, 'remodel_types' => [], 'new_garments' => 'not_now',
        'work_notes' => '  Only wedding dresses, please.  ',
    ]));

    expect($tailor->does_remodeling)->toBeFalse()
        ->and($tailor->does_new_garments)->toBeFalse()
        ->and($tailor->work_preferences['remodel_none'])->toBeTrue()
        ->and($tailor->work_preferences['work_notes'])->toBe('Only wedding dresses, please.');

    $keen = registerTailorWith(workAnswers(), '+995555300302');
    expect($keen->does_remodeling)->toBeTrue()->and($keen->does_new_garments)->toBeTrue()
        ->and($keen->work_preferences['remodel_types'])->toBe(['length', 'fit'])
        ->and($keen->work_preferences['complexity'])->toBe('medium');
});

it('drops the answers that do not apply', function () {
    $tailor = registerTailorWith(workAnswers([
        'remodel_none' => true, 'remodel_types' => ['length'], 'remodel_other' => 'hems',
        'new_garments' => 'no', 'garment_types' => ['coats'], 'complexity' => 'simple',
    ]));

    expect($tailor->work_preferences)->toMatchArray([
        'remodel_types' => [], 'remodel_other' => null, 'garment_types' => [], 'complexity' => null,
    ]);
});

it('takes "other" alone as an answer', function () {
    $tailor = registerTailorWith(workAnswers(['remodel_types' => [], 'remodel_other' => 'Leather repairs']));

    expect($tailor->does_remodeling)->toBeTrue()->and($tailor->work_preferences['remodel_other'])->toBe('Leather repairs');
});

it('refuses answers that are incomplete or not on the list', function (array $answers, string $field) {
    $this->postJson('/api/register/initiate', tailorPayload(['work_preferences' => workAnswers($answers)]))
        ->assertStatus(422)->assertJsonValidationErrors([$field]);
})->with([
    'remodels, but none named' => [['remodel_types' => [], 'remodel_other' => null], 'work_preferences.remodel_types'],
    'new garments, but none named' => [['garment_types' => [], 'garment_other' => null], 'work_preferences.garment_types'],
    'new garments, no complexity' => [['complexity' => null], 'work_preferences.complexity'],
    'an unknown remodel type' => [['remodel_types' => ['dyeing']], 'work_preferences.remodel_types.0'],
    'an unknown answer' => [['new_garments' => 'maybe'], 'work_preferences.new_garments'],
    'a comment too long' => [['work_notes' => str_repeat('a', 1001)], 'work_preferences.work_notes'],
]);

it('lets a tailor change the answers from the dashboard, and the switches follow', function () {
    [$tailor, $token] = workTailor();

    $this->withToken($token)->patchJson('/api/tailor/profile', [
        'work_preferences' => workAnswers(['remodel_none' => true, 'remodel_types' => [], 'new_garments' => 'no']),
    ])->assertOk()->assertJsonPath('tailor.work_preferences.new_garments', 'no');

    expect($tailor->fresh()->does_remodeling)->toBeFalse()->and($tailor->fresh()->does_new_garments)->toBeFalse();

    $this->withToken($token)->getJson('/api/tailor/profile')->assertJsonPath('tailor.work_preferences.remodel_none', true);
});

it('sends design requests only to tailors who want new-garment work, or have not answered yet', function () {
    config()->set('app.custom_orders_open', true);
    [$keen] = workTailor(['does_new_garments' => true]);
    [$unasked] = workTailor(['does_new_garments' => null]);
    [$declined, $declinedToken] = workTailor(['does_new_garments' => false]);
    $customer = Str::random(60);
    User::factory()->create(['role' => 'customer', 'terms_accepted_at' => now(), 'api_token' => hash('sha256', $customer)]);

    $this->withToken($customer)->postJson('/api/orders', [
        'order_type' => 'custom',
        'custom_design_data' => ['garment_type' => 'tops', 'design_file_url' => 'https://example.com/sketch.png'],
    ])->assertCreated();

    expect(KereNotification::where('user_id', $keen->id)->count())->toBe(1)
        ->and(KereNotification::where('user_id', $unasked->id)->count())->toBe(1)
        ->and(KereNotification::where('user_id', $declined->id)->count())->toBe(0);
    $this->withToken($declinedToken)->getJson('/api/tailor/open-orders')->assertOk()->assertJsonCount(0, 'orders');
});

it('shows admins the answers on an application and on every tailor', function () {
    $tailor = registerTailorWith(workAnswers(['platform_feedback' => 'Weekly payouts']));
    [, $adminToken] = workTailor(['role' => 'admin', 'approval_status' => null]);

    $this->withToken($adminToken)->getJson('/api/admin/tailors/pending')->assertOk()
        ->assertJsonPath('tailors.0.work_preferences.platform_feedback', 'Weekly payouts');

    $listed = collect($this->withToken($adminToken)->getJson('/api/admin/users')->json('users'))->firstWhere('id', $tailor->id);
    expect($listed['work_preferences']['garment_types'])->toBe(['everyday_dresses']);
});
