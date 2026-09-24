<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * A tailor signed in as a tailor cannot shop. The storefront hides itself from
 * them, but the API is what enforces it: every route that buys, pays, reviews,
 * wishes or saves a design refuses any role but customer.
 */
function signedIn(array $attributes): string
{
    $token = Str::random(60);
    User::factory()->create(array_merge(['api_token' => hash('sha256', $token)], $attributes));

    return $token;
}

beforeEach(function () {
    // The wishlist routes bind {product} before the role check runs, so they
    // need a real product for the refusal to be the thing under test.
    $category = Category::create(['name' => 'Test', 'slug' => 'test']);
    Product::create(['id' => 1, 'category_id' => $category->id, 'name' => 'Test Jacket', 'slug' => 'test-jacket', 'price' => 120, 'gender' => 'women', 'stock' => 1]);
});

dataset('customer-only routes', [
    'place an order' => ['POST', '/api/orders'],
    'list orders' => ['GET', '/api/customer/orders'],
    'order offers' => ['GET', '/api/customer/orders/1/requests'],
    'review status' => ['GET', '/api/customer/orders/1/review-status'],
    'choose a tailor' => ['POST', '/api/customer/orders/1/choose-tailor'],
    'pay' => ['POST', '/api/orders/1/pay'],
    'verify payment' => ['POST', '/api/orders/1/verify-payment'],
    'review' => ['POST', '/api/reviews'],
    'upload a design' => ['POST', '/api/uploads'],
    'wishlist' => ['GET', '/api/wishlist'],
    'wish' => ['POST', '/api/wishlist/1'],
    'unwish' => ['DELETE', '/api/wishlist/1'],
    'saved designs' => ['GET', '/api/customizer/designs'],
    'save a design' => ['POST', '/api/customizer/designs'],
]);

test('a tailor is refused', function (string $method, string $uri) {
    $token = signedIn(['role' => 'tailor', 'approval_status' => 'approved']);

    $this->withToken($token)->json($method, $uri)
        ->assertStatus(403)
        ->assertJsonPath('code', 'role_not_allowed');
})->with('customer-only routes');

test('a customer is let through the gate', function (string $method, string $uri) {
    // Past the gate, not necessarily successful: these requests carry no body
    // and name records that do not exist, so the controller answers 404/422.
    // What matters is that it is the controller answering, not the role check.
    $token = signedIn(['role' => 'customer', 'terms_accepted_at' => now()]);

    $response = $this->withToken($token)->json($method, $uri);

    expect($response->json('code'))->not->toBe('role_not_allowed');
})->with('customer-only routes');

test('a tailor keeps their own dashboard', function () {
    $token = signedIn(['role' => 'tailor', 'approval_status' => 'approved']);

    $this->withToken($token)->getJson('/api/tailor/orders')->assertOk();
    $this->withToken($token)->getJson('/api/tailor/open-orders')->assertOk();
    $this->withToken($token)->getJson('/api/notifications')->assertOk();
    $this->withToken($token)->getJson('/api/me')->assertOk();
});
