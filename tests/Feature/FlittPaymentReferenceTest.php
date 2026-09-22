<?php

use App\Models\Order;
use App\Models\User;
use App\Services\FlittService;

/**
 * Flitt refuses a second checkout token for an order_id it already holds, so
 * the gateway id cannot be the order number — one abandoned checkout would
 * otherwise make an order permanently unpayable. These pin the reference
 * scheme that replaced it.
 */
function service(): FlittService
{
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');

    return new FlittService;
}

function order(array $attributes = []): Order
{
    $user = User::factory()->create();

    return Order::create(array_merge([
        'user_id'      => $user->id,
        'order_number' => 'ORD-'.strtoupper(Str::random(8)),
        'order_type'   => 'marketplace',
        'status'       => 'pending',
        'subtotal'     => 60,
        'shipping'     => 0,
        'total'        => 60,
        'first_name'   => 'Test',
        'last_name'    => 'Customer',
        'email'        => 'test@example.com',
        'address'      => 'Rustaveli 1',
        'city'         => 'Tbilisi',
        'zip'          => '0108',
        'country'      => 'GE',
    ], $attributes));
}

test('each attempt claims a different reference', function () {
    $flitt = service();
    $order = order();

    $first  = $flitt->newReference($order);
    $second = $flitt->newReference($order);

    expect($first)->not->toBe($second)
        ->and($first)->toStartWith($order->order_number.'_')
        ->and($second)->toStartWith($order->order_number.'_');
});

test('a reference is not stored until the gateway accepts it', function () {
    // Storing on generation leaves an order pointing at an attempt the gateway
    // never saw, and every later verify() then asks Flitt about an order it has
    // never heard of. The reference is recorded only once a token comes back.
    $flitt = service();
    $order = order();

    $flitt->newReference($order);

    expect($order->fresh()->payment_reference)->toBeNull();
});

test('a reference resolves back to its order number', function () {
    expect(service()->orderNumberFor('ORD-O3QLSLTV_rfm7tavv'))->toBe('ORD-O3QLSLTV');
});

test('a remodel order number survives the round trip', function () {
    $flitt = service();

    expect($flitt->orderNumberFor('RMD-ABCD1234_xyz123'))->toBe('RMD-ABCD1234');
});

test('a bare order number passes through unchanged', function () {
    // Payments started before the reference column existed quote the order number itself.
    expect(service()->orderNumberFor('ORD-O3QLSLTV'))->toBe('ORD-O3QLSLTV');
});

test('a superseded reference still finds its order', function () {
    $flitt = service();
    $order = order();

    $abandoned = $flitt->newReference($order);
    $flitt->newReference($order); // the customer retried; this supersedes it

    // The callback resolves by what the gateway quotes, not by what we last stored,
    // so a payment finished in the stale tab is not lost.
    $found = Order::where('order_number', $flitt->orderNumberFor($abandoned))->first();

    expect($found?->id)->toBe($order->id);
});

test('the reference is unique across orders', function () {
    $flitt = service();

    $a = $flitt->newReference(order());
    $b = $flitt->newReference(order());

    expect($a)->not->toBe($b);
});
