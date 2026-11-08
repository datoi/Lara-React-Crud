<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Delivery can be made free by setting SHIPPING_COST to 0 (the CEO's request,
 * 2026-11-08). The page shell states the fee, and new orders charge it; an
 * order keeps the fee it was created with.
 */
beforeEach(fn () => Mail::fake());

function feeCustomerToken(): string
{
    $token = Str::random(60);
    User::factory()->create(['role' => 'customer', 'terms_accepted_at' => now(), 'api_token' => hash('sha256', $token)]);

    return $token;
}

it('states the delivery fee in the page shell', function (int $fee) {
    config()->set('app.shipping_cost', $fee);

    $this->get('/')->assertSee('<meta name="kere-delivery-fee" content="'.$fee.'">', false);
})->with([0, 15]);

it('charges no delivery on a new order while delivery is free', function () {
    config()->set('app.shipping_cost', 0);
    $tailor = User::factory()->create(['role' => 'tailor', 'approval_status' => 'approved']);
    $product = Product::create([
        'category_id' => Category::firstOrCreate(['slug' => 'shirts'], ['name' => 'Shirts'])->id,
        'tailor_id' => $tailor->id, 'name' => 'Linen shirt', 'slug' => 'linen-'.Str::lower(Str::random(6)),
        'price' => 60, 'stock' => 5, 'colors' => [], 'sizes' => [], 'is_customizable' => false,
    ]);

    $this->getJson("/api/products/{$product->id}")->assertJsonPath('shipping_cost', 0);
    $id = $this->withToken(feeCustomerToken())->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 2])
        ->assertCreated()->json('id');

    $order = Order::findOrFail($id);
    expect((float) $order->shipping)->toBe(0.0)->and((float) $order->total)->toBe(120.0);
});

it('makes a remodel first payment exactly half the price while delivery is free', function () {
    expect(Order::firstPaymentFor(90, 0))->toBe(45.0)
        ->and(Order::firstPaymentFor(90, 15))->toBe(60.0);
});
