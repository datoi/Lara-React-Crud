<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * A tailor can delete their own products. An order that included one keeps its
 * line — name, price and all — because the line is the customer's record of
 * what they bought, not a pointer to the listing.
 */
function deletingUser(array $attributes): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

function listedProduct(User $tailor): Product
{
    $categoryId = DB::table('categories')->insertGetId([
        'name' => 'Dresses', 'slug' => 'dresses-'.Str::random(6),
        'created_at' => now(), 'updated_at' => now(),
    ]);

    return Product::create([
        'category_id' => $categoryId, 'tailor_id' => $tailor->id, 'name' => 'Linen Dress',
        'slug' => 'linen-dress-'.Str::random(6), 'price' => 150, 'stock' => 5,
        'status' => 'active', 'sizes' => ['M'], 'images' => ['https://example.com/dress.jpg'],
    ]);
}

test('a tailor deletes their own product', function () {
    [$tailor, $token] = deletingUser(['role' => 'tailor', 'approval_status' => 'approved']);
    $product = listedProduct($tailor);

    $this->withToken($token)->deleteJson("/api/tailor/products/{$product->id}")->assertNoContent();

    expect(Product::find($product->id))->toBeNull();
});

test('no tailor can delete another tailor\'s product', function () {
    [$owner] = deletingUser(['role' => 'tailor', 'approval_status' => 'approved']);
    [, $otherToken] = deletingUser(['role' => 'tailor', 'approval_status' => 'approved']);
    $product = listedProduct($owner);

    $this->withToken($otherToken)->deleteJson("/api/tailor/products/{$product->id}")->assertNotFound();

    expect(Product::find($product->id))->not->toBeNull();
});

test('deleting an ordered product keeps the line on the customer\'s order', function () {
    [$tailor, $tailorToken] = deletingUser(['role' => 'tailor', 'approval_status' => 'approved']);
    [$customer, $customerToken] = deletingUser(['role' => 'customer']);
    $product = listedProduct($tailor);

    $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'size' => 'M', 'quantity' => 1,
    ])->assertCreated();
    $order = Order::where('user_id', $customer->id)->firstOrFail();

    $this->withToken($tailorToken)->deleteJson("/api/tailor/products/{$product->id}")->assertNoContent();

    $line = $order->items()->firstOrFail();
    expect($line->product_id)->toBeNull()
        ->and($line->product_name)->toBe('Linen Dress')
        ->and((float) $line->price)->toBe(150.0);

    $this->withToken($customerToken)->getJson('/api/customer/orders')
        ->assertJsonPath('orders.0.items.0.product_name', 'Linen Dress')
        ->assertJsonPath('orders.0.items.0.product_id', null);

    $this->withToken($tailorToken)->getJson('/api/tailor/orders')
        ->assertJsonPath('orders.0.items.0.product_name', 'Linen Dress')
        ->assertJsonPath('orders.0.items.0.product_image', null);
});
