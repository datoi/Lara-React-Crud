<?php

use App\Models\Order;
use App\Models\User;
use App\Services\FlittService;
use Illuminate\Support\Str;

/**
 * The HTTP surface of payment, which is where money is actually decided.
 *
 * Both blockers found in review lived here and not in FlittService: an order
 * that was cancelled could still be charged, and an unauthenticated array in
 * the public callback crashed the signer. Each has a case below.
 */
function payer(): array
{
    $raw = 'test-token-'.Str::random(8);
    $user = User::factory()->create(['api_token' => hash('sha256', $raw)]);

    return [$user, $raw];
}

function placeOrder(User $user, array $attributes = []): Order
{
    return Order::create(array_merge([
        'user_id'        => $user->id,
        'order_number'   => 'ORD-'.strtoupper(Str::random(8)),
        'order_type'     => 'marketplace',
        'status'         => 'pending',
        'payment_status' => 'unpaid',
        'subtotal'       => 60,
        'shipping'       => 0,
        'total'          => 60,
        'first_name'     => 'Test',
        'last_name'      => 'Customer',
        'email'          => 'test@example.com',
        'address'        => 'Rustaveli 1',
        'city'           => 'Tbilisi',
        'zip'            => '0108',
        'country'        => 'GE',
    ], $attributes));
}

function signed(array $payload): array
{
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');

    $payload['signature'] = (new FlittService)->signature($payload);

    return $payload;
}

beforeEach(function () {
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');
});

// ─── pay ──────────────────────────────────────────────────────────────────────

test('paying requires authentication', function () {
    [$user] = payer();
    $order = placeOrder($user);

    $this->postJson("/api/orders/{$order->id}/pay")->assertStatus(401);
});

test('an order belonging to someone else is not found', function () {
    [$owner] = payer();
    [, $otherToken] = payer();
    $order = placeOrder($owner);

    $this->withToken($otherToken)->postJson("/api/orders/{$order->id}/pay")->assertStatus(404);
});

test('an already paid order is refused', function () {
    [$user, $token] = payer();
    $order = placeOrder($user, ['payment_status' => 'paid']);

    $this->withToken($token)->postJson("/api/orders/{$order->id}/pay")->assertStatus(409);
});

test('a custom order cannot be paid by card', function () {
    [$user, $token] = payer();
    $order = placeOrder($user, ['order_type' => 'custom', 'payment_status' => 'not_required']);

    $this->withToken($token)->postJson("/api/orders/{$order->id}/pay")->assertStatus(422);
});

test('a cancelled order cannot be charged', function () {
    // Cancelling writes `status`; before this guard the order kept
    // payment_status 'unpaid' and still minted a live checkout token.
    [$user, $token] = payer();
    $order = placeOrder($user, ['status' => 'cancelled']);

    $this->withToken($token)->postJson("/api/orders/{$order->id}/pay")->assertStatus(409);
});

test('a finished order cannot be charged', function () {
    [$user, $token] = payer();
    $order = placeOrder($user, ['status' => 'finished']);

    $this->withToken($token)->postJson("/api/orders/{$order->id}/pay")->assertStatus(409);
});

// ─── callback ─────────────────────────────────────────────────────────────────

test('an unsigned callback is ignored, not an error', function () {
    $this->postJson('/api/payments/flitt/callback', ['order_id' => 'ORD-NOPE', 'order_status' => 'approved'])
        ->assertStatus(200)
        ->assertJson(['status' => 'ignored']);
});

test('a non-scalar field cannot crash the public callback', function () {
    // Anyone may post here. An array reached the string cast in signature()
    // and returned a 500 with a stack trace on a route whose contract is 200.
    $this->postJson('/api/payments/flitt/callback', ['order_id' => ['a'], 'signature' => ['b']])
        ->assertStatus(200)
        ->assertJson(['status' => 'ignored']);
});

test('a signed callback for the right amount marks the order paid', function () {
    [$user] = payer();
    $order = placeOrder($user);
    $order->forceFill(['payment_reference' => $order->order_number.'_abc12345'])->save();

    $this->postJson('/api/payments/flitt/callback', signed([
        'order_id' => $order->payment_reference,
        'order_status' => 'approved',
        'amount' => 6000,
        'currency' => 'GEL',
        'payment_id' => '999',
    ]))->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('paid')
        ->and($order->fresh()->payment_id)->toBe('999');
});

test('a signed callback for the wrong amount does not credit the order', function () {
    [$user] = payer();
    $order = placeOrder($user);

    $this->postJson('/api/payments/flitt/callback', signed([
        'order_id' => $order->order_number,
        'order_status' => 'approved',
        'amount' => 1,
        'currency' => 'GEL',
    ]))->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('unpaid');
});

test('a signed callback with no currency does not credit the order', function () {
    [$user] = payer();
    $order = placeOrder($user);

    $this->postJson('/api/payments/flitt/callback', signed([
        'order_id' => $order->order_number,
        'order_status' => 'approved',
        'amount' => 6000,
    ]))->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('unpaid');
});

test('a signed callback cannot pay a custom order', function () {
    [$user] = payer();
    $order = placeOrder($user, ['order_type' => 'custom', 'payment_status' => 'unpaid']);

    $this->postJson('/api/payments/flitt/callback', signed([
        'order_id' => $order->order_number,
        'order_status' => 'approved',
        'amount' => 6000,
        'currency' => 'GEL',
    ]))->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('unpaid');
});

test('a signed callback cannot revive an expired order', function () {
    [$user] = payer();
    $order = placeOrder($user, ['status' => 'cancelled', 'payment_status' => 'expired']);

    $this->postJson('/api/payments/flitt/callback', signed([
        'order_id' => $order->order_number,
        'order_status' => 'approved',
        'amount' => 6000,
        'currency' => 'GEL',
    ]))->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('expired');
});

test('crediting twice leaves the first payment untouched', function () {
    [$user] = payer();
    $order = placeOrder($user);

    $payload = signed([
        'order_id' => $order->order_number,
        'order_status' => 'approved',
        'amount' => 6000,
        'currency' => 'GEL',
        'payment_id' => 'first',
    ]);

    $this->postJson('/api/payments/flitt/callback', $payload)->assertStatus(200);
    $paidAt = $order->fresh()->paid_at;

    $this->postJson('/api/payments/flitt/callback', signed([
        'order_id' => $order->order_number,
        'order_status' => 'approved',
        'amount' => 6000,
        'currency' => 'GEL',
        'payment_id' => 'second',
    ]))->assertStatus(200);

    expect($order->fresh()->payment_id)->toBe('first')
        ->and($order->fresh()->paid_at->eq($paidAt))->toBeTrue();
});

test('a declined callback leaves the order unpaid', function () {
    [$user] = payer();
    $order = placeOrder($user);

    $this->postJson('/api/payments/flitt/callback', signed([
        'order_id' => $order->order_number,
        'order_status' => 'declined',
        'amount' => 6000,
        'currency' => 'GEL',
    ]))->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('unpaid');
});

test('every refusal carries a code the client can translate', function () {
    [$user, $token] = payer();

    $cases = [
        ['attributes' => ['payment_status' => 'paid'], 'status' => 409, 'code' => 'order_already_paid'],
        ['attributes' => ['payment_status' => 'expired'], 'status' => 409, 'code' => 'order_not_payable'],
        ['attributes' => ['status' => 'cancelled'], 'status' => 409, 'code' => 'order_not_payable'],
        ['attributes' => ['order_type' => 'custom'], 'status' => 422, 'code' => 'order_not_payable_online'],
    ];

    foreach ($cases as $case) {
        $order = placeOrder($user, $case['attributes']);

        $this->withToken($token)->postJson("/api/orders/{$order->id}/pay")
            ->assertStatus($case['status'])
            ->assertJsonPath('code', $case['code']);
    }
});
