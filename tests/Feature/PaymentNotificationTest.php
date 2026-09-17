<?php

use App\Models\KereNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\FlittService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Who hears about an order, and when.
 *
 * A marketplace order is created unpaid and the customer is sent straight to
 * the gateway, so announcing it at creation puts a tailor to work on something
 * plenty of customers will abandon. The announcement belongs to the payment,
 * and — because the callback and the client poll are designed to race — it has
 * to happen exactly once.
 */
function buyer(): array
{
    $raw = 'tok-'.Str::random(8);

    // A customer who finished registering — terms_accepted_at is what
    // User::registrationComplete() reads, and without it the order gate
    // correctly refuses the account as half-signed-up.
    $user = User::factory()->create([
        'api_token' => hash('sha256', $raw),
        'role' => 'customer',
        'terms_accepted_at' => now(),
    ]);

    return [$user, $raw];
}

function seller(): User
{
    return User::factory()->create(['role' => 'tailor', 'phone' => null]);
}

function sellable(User $tailor): Product
{
    $categoryId = DB::table('categories')->insertGetId([
        'name' => 'Tops', 'slug' => 'tops-'.Str::random(6),
        'created_at' => now(), 'updated_at' => now(),
    ]);

    return Product::create([
        'category_id' => $categoryId,
        'tailor_id'   => $tailor->id,
        'name'        => 'Test Shirt',
        'slug'        => 'test-shirt-'.Str::random(6),
        'price'       => 60,
        'stock'       => 5,
        'status'      => 'active',
        'colors'      => ['Black'],
        'sizes'       => ['M'],
        'images'      => [],
    ]);
}

function newOrderAlerts(User $tailor): int
{
    return KereNotification::where('user_id', $tailor->id)->where('type', 'new_order')->count();
}

function approvedFor(Order $order, string $paymentId = '1'): array
{
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');

    $payload = [
        'order_id'     => $order->payment_reference ?? $order->order_number,
        'order_status' => 'approved',
        'amount'       => (int) round($order->total * 100),
        'currency'     => 'GEL',
        'payment_id'   => $paymentId,
    ];
    $payload['signature'] = (new FlittService)->signature($payload);

    return $payload;
}

beforeEach(function () {
    Mail::fake();
    Http::fake();
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');
});

test('placing a marketplace order tells the tailor nothing yet', function () {
    [$customer, $token] = buyer();
    $tailor  = seller();
    $product = sellable($tailor);

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'product_id' => $product->id,
        'color'      => 'Black',
        'size'       => 'M',
        'quantity'   => 1,
    ])->assertStatus(201);

    expect(newOrderAlerts($tailor))->toBe(0);
});

test('the order still exists and is unpaid after placing', function () {
    [$customer, $token] = buyer();
    $tailor  = seller();
    $product = sellable($tailor);

    $response = $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'product_id' => $product->id,
        'color'      => 'Black',
        'size'       => 'M',
        'quantity'   => 1,
    ])->assertStatus(201);

    $order = Order::find($response->json('id'));

    expect($order)->not->toBeNull()
        ->and($order->payment_status)->toBe('unpaid');
});

test('payment is what tells the tailor', function () {
    [$customer, $token] = buyer();
    $tailor  = seller();
    $product = sellable($tailor);

    $id = $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'product_id' => $product->id,
        'color'      => 'Black',
        'size'       => 'M',
        'quantity'   => 1,
    ])->json('id');

    $order = Order::find($id);
    expect(newOrderAlerts($tailor))->toBe(0);

    $this->postJson('/api/payments/flitt/callback', approvedFor($order))->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('paid')
        ->and(newOrderAlerts($tailor))->toBe(1);
});

test('a callback arriving twice announces the order once', function () {
    // The webhook and the client poll are designed to race; the conditional
    // update is what makes only one of them the winner that announces.
    [$customer, $token] = buyer();
    $tailor  = seller();
    $product = sellable($tailor);

    $id = $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'product_id' => $product->id,
        'color'      => 'Black',
        'size'       => 'M',
        'quantity'   => 1,
    ])->json('id');

    $order = Order::find($id);

    $this->postJson('/api/payments/flitt/callback', approvedFor($order, 'first'))->assertStatus(200);
    $this->postJson('/api/payments/flitt/callback', approvedFor($order, 'second'))->assertStatus(200);

    expect(newOrderAlerts($tailor))->toBe(1)
        ->and($order->fresh()->payment_id)->toBe('first');
});

test('a payment that fails the amount check announces nothing', function () {
    [$customer, $token] = buyer();
    $tailor  = seller();
    $product = sellable($tailor);

    $id = $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'product_id' => $product->id,
        'color'      => 'Black',
        'size'       => 'M',
        'quantity'   => 1,
    ])->json('id');

    $order   = Order::find($id);
    $payload = approvedFor($order);
    $payload['amount'] = 1;
    $payload['signature'] = (new FlittService)->signature(
        collect($payload)->except('signature')->all()
    );

    $this->postJson('/api/payments/flitt/callback', $payload)->assertStatus(200);

    expect($order->fresh()->payment_status)->toBe('unpaid')
        ->and(newOrderAlerts($tailor))->toBe(0);
});
