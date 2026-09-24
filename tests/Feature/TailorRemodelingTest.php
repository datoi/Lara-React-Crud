<?php

use App\Models\KereNotification;
use App\Models\Order;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Str;

/**
 * A tailor says at registration whether they take remodel work, and that
 * answer decides whether remodel requests reach them: the notification, the
 * open-orders feed and the offer all follow it. They can change it later.
 */
function tailorWithToken(bool $doesRemodeling): array
{
    $token = Str::random(60);
    $tailor = User::factory()->create([
        'role' => 'tailor',
        'approval_status' => 'approved',
        'does_remodeling' => $doesRemodeling,
        'api_token' => hash('sha256', $token),
    ]);

    return [$tailor, $token];
}

function openOrder(string $type): Order
{
    $customer = User::factory()->create(['role' => 'customer', 'terms_accepted_at' => now()]);

    return Order::create([
        'user_id' => $customer->id,
        'order_number' => strtoupper($type).'-'.Str::upper(Str::random(8)),
        'order_type' => $type,
        'payment_status' => 'not_required',
        'tailor_assignment_mode' => 'manual',
        'status' => 'pending_assignment',
        'subtotal' => 0,
        'shipping' => 15,
        'total' => 15,
        'custom_design_data' => ['change_request' => 'Shorten the sleeves'],
        'first_name' => 'Nino',
        'last_name' => '',
        'email' => $customer->email,
        'phone' => '+995555000111',
        'address' => 'Rustaveli 1',
        'city' => 'Tbilisi',
        'zip' => '',
        'country' => 'GE',
    ]);
}

test('the answer is carried to the account, either way', function (bool $answer) {
    $phone = $answer ? '+995555600601' : '+995555600602';

    $this->postJson('/api/register/initiate', tailorPayload(['phone' => $phone, 'does_remodeling' => $answer]))
        ->assertStatus(200);

    $record = Verification::where('phone', $phone)->firstOrFail();
    $this->postJson('/api/register/verify-phone', [
        'verification_id' => $record->id,
        'code' => $record->otp_phone,
    ])->assertStatus(201);

    expect(User::where('phone', $phone)->firstOrFail()->does_remodeling)->toBe($answer);
})->with([true, false]);

test('a remodel request is announced only to tailors who take remodel work', function () {
    [$remodeler] = tailorWithToken(true);
    [$declined] = tailorWithToken(false);

    $customerToken = Str::random(60);
    User::factory()->create([
        'role' => 'customer',
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $customerToken),
    ]);

    $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'remodel',
        'first_name' => 'Nino',
        'phone' => '+995555000111',
        'address' => 'Rustaveli 1',
        'city' => 'Tbilisi',
        'custom_design_data' => [
            'change_request' => 'Shorten the sleeves',
            'remodel_images' => ['https://example.com/jacket.jpg'],
        ],
    ])->assertStatus(201);

    expect(KereNotification::where('user_id', $remodeler->id)->where('type', 'open_order')->count())->toBe(1)
        ->and(KereNotification::where('user_id', $declined->id)->count())->toBe(0);
});

test('the open-orders feed shows remodels only to tailors who take them', function () {
    $custom = openOrder('custom');
    $remodel = openOrder('remodel');
    [, $remodelerToken] = tailorWithToken(true);
    [, $declinedToken] = tailorWithToken(false);

    $ids = fn (string $token) => collect($this->withToken($token)->getJson('/api/tailor/open-orders')
        ->assertOk()->json('orders'))->pluck('id')->all();

    expect($ids($remodelerToken))->toEqualCanonicalizing([$custom->id, $remodel->id])
        ->and($ids($declinedToken))->toBe([$custom->id]);
});

test('a tailor who does not take remodel work cannot offer on one', function () {
    $remodel = openOrder('remodel');
    [, $declinedToken] = tailorWithToken(false);
    [, $remodelerToken] = tailorWithToken(true);

    $this->withToken($declinedToken)
        ->postJson("/api/tailor/orders/{$remodel->id}/request", ['offered_price' => 80])
        ->assertStatus(409);

    $this->withToken($remodelerToken)
        ->postJson("/api/tailor/orders/{$remodel->id}/request", ['offered_price' => 80])
        ->assertSuccessful();
});

test('a tailor can change the answer from their profile', function () {
    [$tailor, $token] = tailorWithToken(true);

    $this->withToken($token)->patchJson('/api/tailor/profile', ['does_remodeling' => false])
        ->assertOk()->assertJsonPath('tailor.does_remodeling', false);

    expect($tailor->fresh()->does_remodeling)->toBeFalse();

    // Saving the rest of the profile without the field leaves the answer alone.
    $this->withToken($token)->patchJson('/api/tailor/profile', ['bio' => 'Twenty years of tailoring'])
        ->assertOk()->assertJsonPath('tailor.does_remodeling', false);
});
