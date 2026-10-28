<?php

use App\Models\Order;
use App\Models\OrderClaim;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Str;

/**
 * The privacy policy's 90 days (§13): an order's measurements go 90 days after
 * it ends, unless a claim on it is still open; unfinished registrations go
 * after 90 days; measurements a customer saved on their profile stay.
 */
function purgeOrder(array $attributes = [], array $cm = ['chest' => 92]): Order
{
    $customer = User::factory()->create(['role' => 'customer', 'terms_accepted_at' => now(), 'measurements' => ['chest' => 92]]);

    $order = Order::create(array_merge([
        'user_id' => $customer->id,
        'order_number' => 'ORD-'.Str::upper(Str::random(8)),
        'order_type' => 'custom',
        'status' => 'delivered',
        'payment_status' => 'not_required',
        'subtotal' => 0, 'shipping' => 15, 'total' => 15,
        'delivered_at' => now()->subDays(91),
        'custom_design_data' => ['garment_type' => 'shirt', 'measurements' => ['chest' => 92, 'waist' => 70]],
        'first_name' => 'Nino', 'last_name' => 'K', 'email' => $customer->email,
        'address' => 'N/A', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
    ], $attributes));

    OrderItem::create([
        'order_id' => $order->id, 'product_name' => 'Shirt', 'color' => '#000000',
        'quantity' => 1, 'price' => 0, 'cm_measurements' => $cm,
    ]);

    return $order;
}

test('an order\'s measurements are deleted 90 days after it was delivered', function () {
    $order = purgeOrder();

    $this->artisan('privacy:purge')->assertSuccessful();

    $order->refresh();
    expect($order->custom_design_data)->toBe(['garment_type' => 'shirt'])
        ->and($order->items()->first()->cm_measurements)->toBeNull()
        ->and($order->measurements_purged_at)->not->toBeNull()
        // The profile keeps its own copy until the customer deletes it.
        ->and($order->user->fresh()->measurements)->toBe(['chest' => 92]);
});

test('measurements stay while the order is recent or a claim is open', function () {
    $recent = purgeOrder(['delivered_at' => now()->subDays(89)]);
    $disputed = purgeOrder();
    OrderClaim::create(['order_id' => $disputed->id, 'user_id' => $disputed->user_id, 'type' => 'problem', 'status' => 'open']);
    $working = purgeOrder(['status' => 'processing', 'delivered_at' => null]);

    $this->artisan('privacy:purge')->assertSuccessful();

    foreach ([$recent, $disputed, $working] as $order) {
        expect($order->fresh()->custom_design_data['measurements'])->toBe(['chest' => 92, 'waist' => 70]);
    }
});

test('a cancelled order\'s measurements go 90 days after it was cancelled', function () {
    $order = purgeOrder(['status' => 'cancelled', 'delivered_at' => null, 'cancelled_at' => now()->subDays(91)]);

    $this->artisan('privacy:purge')->assertSuccessful();

    expect($order->fresh()->custom_design_data)->not->toHaveKey('measurements');
});

test('a dry run deletes nothing', function () {
    $order = purgeOrder();

    $this->artisan('privacy:purge --dry-run')->expectsOutputToContain('Would delete measurements of 1 order(s)')->assertSuccessful();

    expect($order->fresh()->custom_design_data)->toHaveKey('measurements');
});

test('unfinished registrations are deleted after 90 days', function () {
    $old = Verification::create(['id' => (string) Str::uuid(), 'phone' => '+995555000001', 'registration_data' => [], 'expires_at' => now()]);
    $old->forceFill(['created_at' => now()->subDays(91)])->save();
    $fresh = Verification::create(['id' => (string) Str::uuid(), 'phone' => '+995555000002', 'registration_data' => [], 'expires_at' => now()]);

    $abandoned = User::factory()->create(['role' => 'customer', 'terms_accepted_at' => null, 'created_at' => now()->subDays(91)]);
    $complete = User::factory()->create(['role' => 'customer', 'terms_accepted_at' => now()->subDays(100), 'created_at' => now()->subDays(100)]);
    $tailor = User::factory()->create(['role' => 'tailor', 'terms_accepted_at' => null, 'created_at' => now()->subDays(100)]);
    $withOrder = purgeOrder()->user;
    $withOrder->forceFill(['terms_accepted_at' => null, 'created_at' => now()->subDays(100)])->save();

    $this->artisan('privacy:purge')->assertSuccessful();

    expect(Verification::find($old->id))->toBeNull()
        ->and(Verification::find($fresh->id))->not->toBeNull()
        ->and(User::find($abandoned->id))->toBeNull()
        ->and(User::find($complete->id))->not->toBeNull()
        ->and(User::find($tailor->id))->not->toBeNull()
        ->and(User::find($withOrder->id))->not->toBeNull();
});
