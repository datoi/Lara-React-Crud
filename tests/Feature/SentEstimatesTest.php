<?php

use App\Models\Order;
use App\Models\TailorRequest;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * "გაშვებული შეთავაზებები": the estimates a tailor sent Kere and what became
 * of each (the CEO's request, 2026-11-08).
 */
function estimateTailor(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true,
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

function estimateOrder(array $attributes = []): Order
{
    $customer = User::factory()->create(['role' => 'customer', 'first_name' => 'Nino', 'last_name' => 'Beridze', 'terms_accepted_at' => now()]);

    return Order::create(array_merge([
        'user_id' => $customer->id, 'order_number' => 'RMD-'.Str::upper(Str::random(8)), 'order_type' => 'remodel',
        'status' => 'pending_assignment', 'payment_status' => 'not_required', 'subtotal' => 0, 'shipping' => 15, 'total' => 15,
        'first_name' => 'Nino', 'last_name' => 'Beridze', 'email' => $customer->email, 'phone' => '+995555000111',
        'address' => 'Rustaveli 1', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
        'custom_design_data' => ['change_request' => 'Shorten', 'remodel_images' => ['https://example.com/a.jpg'], 'measurements' => ['waist' => 70]],
    ], $attributes));
}

function sendEstimate(User $tailor, Order $order, string $status = 'pending'): TailorRequest
{
    return TailorRequest::create(['order_id' => $order->id, 'tailor_id' => $tailor->id, 'offered_price' => 80, 'ready_in_days' => 5, 'status' => $status]);
}

it('lists each estimate with what became of it', function () {
    [$me, $token] = estimateTailor();
    [$other] = estimateTailor();

    $waiting = estimateOrder();
    sendEstimate($me, $waiting);

    $offered = estimateOrder();
    $mine = sendEstimate($me, $offered);
    $offered->update(['offer_request_id' => $mine->id, 'offer_price' => 100, 'offer_days' => 5, 'offer_sent_at' => now()]);

    $chosen = estimateOrder(['status' => 'pending', 'tailor_id' => $me->id]);
    sendEstimate($me, $chosen, 'accepted');

    $lost = estimateOrder(['status' => 'pending', 'tailor_id' => $other->id]);
    sendEstimate($me, $lost, 'declined');

    $cancelled = estimateOrder(['status' => 'cancelled', 'cancelled_at' => now()]);
    sendEstimate($me, $cancelled, 'declined');

    $states = collect($this->withToken($token)->getJson('/api/tailor/requests')->assertOk()->json('estimates'))
        ->mapWithKeys(fn ($e) => [$e['order']['id'] => $e['state']]);

    expect($states->all())->toBe([
        $cancelled->id => 'closed',
        $lost->id => 'not_chosen',
        $chosen->id => 'chosen',
        $offered->id => 'offered',
        $waiting->id => 'waiting',
    ]);
});

it('shows only the tailor\'s own estimates, with the customer\'s first name and no measurements', function () {
    [$me, $token] = estimateTailor();
    [$other] = estimateTailor();
    $order = estimateOrder();
    sendEstimate($me, $order);
    sendEstimate($other, estimateOrder());

    $estimates = $this->withToken($token)->getJson('/api/tailor/requests')->assertOk()->json('estimates');

    expect($estimates)->toHaveCount(1)
        ->and($estimates[0]['offered_price'])->toEqual(80)
        ->and($estimates[0]['ready_in_days'])->toBe(5)
        ->and($estimates[0]['order']['customer'])->toBe(['name' => 'Nino'])
        ->and($estimates[0]['order']['measurements_count'])->toBe(1)
        ->and($estimates[0]['order']['custom_design_data'])->not->toHaveKey('measurements')
        ->and($estimates[0]['order'])->not->toHaveKeys(['phone', 'email', 'address']);
});

it('refuses the list to anyone but an approved tailor', function (array $attributes) {
    [, $token] = estimateTailor($attributes);

    $this->withToken($token)->getJson('/api/tailor/requests')->assertForbidden();
})->with([
    'pending tailor' => [['approval_status' => 'pending']],
    'customer' => [['role' => 'customer', 'approval_status' => null]],
]);
