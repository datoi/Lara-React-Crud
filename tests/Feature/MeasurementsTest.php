<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * A customer saves their measurements once; every order that needs a fit is
 * prefilled from them and stores its own snapshot. The snapshot is the order's,
 * not a pointer to the profile, and it reaches the tailor who makes the garment
 * — not every tailor who might bid on it.
 */
function measuringUser(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

function measuredProduct(User $tailor, array $required): Product
{
    $categoryId = DB::table('categories')->insertGetId([
        'name' => 'Trousers', 'slug' => 'trousers-'.Str::random(6),
        'created_at' => now(), 'updated_at' => now(),
    ]);

    return Product::create([
        'category_id' => $categoryId,
        'tailor_id' => $tailor->id,
        'name' => 'Tailored Trousers',
        'slug' => 'tailored-trousers-'.Str::random(6),
        'price' => 120,
        'stock' => 5,
        'status' => 'active',
        'sizes' => ['M'],
        'images' => [],
        'required_measurements' => $required,
    ]);
}

function customDesign(array $measurements): array
{
    return [
        'order_type' => 'custom',
        'custom_design_data' => ['garment_type' => 'trousers', 'measurements' => $measurements],
    ];
}

// ─── Profile ──────────────────────────────────────────────────────────────────

test('a customer starts with no measurements, saves them, and reads them back normalised', function () {
    [, $token] = measuringUser();

    $this->withToken($token)->getJson('/api/customer/measurements')
        ->assertOk()->assertExactJson(['measurements' => []]);

    $this->withToken($token)->putJson('/api/customer/measurements', [
        'measurements' => ['waist' => '72', 'chest' => 90.5, 'hips' => ''],
    ])->assertOk()->assertExactJson(['measurements' => ['chest' => 90.5, 'waist' => 72]]);

    $this->withToken($token)->getJson('/api/customer/measurements')
        ->assertJsonPath('measurements.waist', 72);
});

test('an empty set clears the profile', function () {
    [$user, $token] = measuringUser(['measurements' => ['chest' => 90]]);

    $this->withToken($token)->putJson('/api/customer/measurements', ['measurements' => []])->assertOk();

    expect($user->fresh()->measurements)->toBeNull();
});

test('the profile rejects unknown fields, garment length and implausible values', function (array $measurements, string $error) {
    [, $token] = measuringUser();

    $this->withToken($token)->putJson('/api/customer/measurements', ['measurements' => $measurements])
        ->assertStatus(422)->assertJsonValidationErrors([$error]);
})->with([
    'unknown field' => [['neck' => 40], 'measurements'],
    'garment length is per order' => [['length' => 60], 'measurements'],
    'too small' => [['chest' => 10], 'measurements.chest'],
    'too large' => [['waist' => 400], 'measurements.waist'],
    'not a number' => [['hips' => 'wide'], 'measurements.hips'],
]);

test('no one but the customer can read or write their measurements', function () {
    [, $tailorToken] = measuringUser(['role' => 'tailor', 'approval_status' => 'approved']);

    $this->withToken($tailorToken)->getJson('/api/customer/measurements')->assertStatus(403);
    $this->withToken($tailorToken)->putJson('/api/customer/measurements', ['measurements' => ['chest' => 90]])->assertStatus(403);
    $this->withoutToken()->getJson('/api/customer/measurements')->assertStatus(401);
});

test('measurements never serialize with the user model', function () {
    [$user] = measuringUser(['measurements' => ['chest' => 90]]);

    expect($user->toArray())->not->toHaveKey('measurements');
});

// ─── Snapshots ────────────────────────────────────────────────────────────────

test('a custom order stores its own snapshot, which later profile edits do not touch', function () {
    [$user, $token] = measuringUser(['measurements' => ['waist' => 70, 'hips' => 96]]);

    $this->withToken($token)->postJson('/api/orders', customDesign(['waist' => '70', 'hips' => 96, 'length' => 100]))
        ->assertStatus(201);

    $this->withToken($token)->putJson('/api/customer/measurements', ['measurements' => ['waist' => 80]])->assertOk();

    expect(Order::where('user_id', $user->id)->firstOrFail()->custom_design_data['measurements'])
        ->toEqual(['waist' => 70, 'hips' => 96, 'length' => 100]);
});

test('an order without measurements stores none, rather than an empty set', function () {
    [$user, $token] = measuringUser();

    $this->withToken($token)->postJson('/api/orders', customDesign(['waist' => '']))->assertStatus(201);

    expect(Order::where('user_id', $user->id)->firstOrFail()->custom_design_data)->not->toHaveKey('measurements');
});

test('an implausible snapshot is rejected on every order type', function () {
    [, $token] = measuringUser();

    $this->withToken($token)->postJson('/api/orders', customDesign(['waist' => 5]))
        ->assertStatus(422)->assertJsonValidationErrors(['custom_design_data.measurements.waist']);

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'remodel',
        'first_name' => 'Nino', 'phone' => '+995555000111', 'address' => 'Rustaveli 1', 'city' => 'Tbilisi',
        'custom_design_data' => [
            'change_request' => 'Take in the waist',
            'remodel_images' => ['https://example.com/jacket.jpg'],
            'measurements' => ['neck' => 40],
        ],
    ])->assertStatus(422)->assertJsonValidationErrors(['custom_design_data.measurements']);
});

test('a remodel keeps the measurements it was sent', function () {
    [$user, $token] = measuringUser();

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'remodel',
        'first_name' => 'Nino', 'phone' => '+995555000111', 'address' => 'Rustaveli 1', 'city' => 'Tbilisi',
        'custom_design_data' => [
            'change_request' => 'Take in the waist',
            'remodel_images' => ['https://example.com/jacket.jpg'],
            'measurements' => ['waist' => 68],
        ],
    ])->assertStatus(201);

    expect(Order::where('user_id', $user->id)->firstOrFail()->custom_design_data['measurements'])->toEqual(['waist' => 68]);
});

// ─── Required by the product ──────────────────────────────────────────────────

test('a product that needs measurements cannot be ordered without them', function () {
    [$tailor] = measuringUser(['role' => 'tailor', 'approval_status' => 'approved']);
    // head_circumference is a legacy key nothing collects, so it is never enforced.
    $product = measuredProduct($tailor, ['waist', 'inseam', 'head_circumference']);
    [$user, $token] = measuringUser();

    $order = ['order_type' => 'marketplace', 'product_id' => $product->id, 'size' => 'M', 'quantity' => 1];

    $this->withToken($token)->postJson('/api/orders', $order + ['cm_measurements' => ['waist' => 72]])
        ->assertStatus(422)
        ->assertJsonPath('code', 'measurements_required')
        ->assertJsonPath('missing', ['inseam']);

    $this->withToken($token)->postJson('/api/orders', ['items' => [['product_id' => $product->id, 'size' => 'M', 'quantity' => 1]]])
        ->assertStatus(422)->assertJsonPath('code', 'measurements_required');

    $this->withToken($token)->postJson('/api/orders', $order + ['cm_measurements' => ['waist' => 72, 'inseam' => 80]])
        ->assertStatus(201);

    expect(Order::where('user_id', $user->id)->firstOrFail()->items()->first()->cm_measurements)
        ->toEqual(['waist' => 72, 'inseam' => 80]);
});

test('a tailor can only require measurements customers can give', function () {
    [, $tailorToken] = measuringUser(['role' => 'tailor', 'approval_status' => 'approved']);

    $this->withToken($tailorToken)->postJson('/api/tailor/products', [
        'name' => 'Hat', 'price' => 50, 'category' => 'accessories',
        'required_measurements' => ['head_circumference'],
    ])->assertStatus(422)->assertJsonValidationErrors(['required_measurements.0']);
});

// ─── Who sees them ────────────────────────────────────────────────────────────

test('bidding tailors see how many measurements were given; the assigned tailor sees the values', function () {
    [$customer, $token] = measuringUser(['first_name' => 'Nino', 'last_name' => 'Beridze']);
    $this->withToken($token)->postJson('/api/orders', customDesign(['waist' => 70, 'hips' => 96]))->assertStatus(201);
    $order = Order::where('user_id', $customer->id)->firstOrFail();

    [$bidder, $bidderToken] = measuringUser(['role' => 'tailor', 'approval_status' => 'approved']);
    $feed = $this->withToken($bidderToken)->getJson('/api/tailor/open-orders')->assertOk();

    $feed->assertJsonPath('orders.0.measurements_count', 2)
        ->assertJsonPath('orders.0.customer.name', 'Nino')
        ->assertJsonMissingPath('orders.0.custom_design_data.measurements');
    expect($feed->getContent())->not->toContain('Beridze');

    $order->update(['tailor_id' => $bidder->id, 'status' => 'pending']);

    $this->withToken($bidderToken)->getJson('/api/tailor/orders')
        ->assertOk()
        ->assertJsonPath('orders.0.custom_design_data.measurements.waist', 70);
});
