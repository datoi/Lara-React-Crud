<?php

use App\Models\Category;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\TailorRequest;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Reviews under terms §20: feedback concerns Kere's service, nothing is public
 * until an admin publishes it, and the public never sees who wrote it or which
 * tailor made the garment. Each tailor's score stays internal: the admins and
 * the tailor themselves.
 */
function reviewUser(string $role = 'customer', array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => $role,
        'terms_accepted_at' => now(),
        'approval_status' => $role === 'tailor' ? 'approved' : null,
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

function reviewOrder(User $customer, array $attributes = []): Order
{
    $order = Order::create(array_merge([
        'user_id' => $customer->id,
        'order_number' => 'ORD-'.Str::upper(Str::random(8)),
        'order_type' => 'marketplace',
        'status' => 'delivered',
        'payment_status' => 'paid',
        'subtotal' => 100, 'shipping' => 15, 'total' => 115,
        'delivered_at' => now()->subDay(),
        'first_name' => 'Nino', 'last_name' => 'K', 'email' => $customer->email,
        'address' => 'N/A', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
    ], $attributes));

    OrderItem::create([
        'order_id' => $order->id, 'product_name' => 'Linen Dress', 'color' => '#000000',
        'size' => 'M', 'quantity' => 1, 'price' => 100,
    ]);

    return $order;
}

test('a review waits for Kere before anyone sees it, and the admins are told', function () {
    [$admin] = reviewUser('admin');
    [$customer, $token] = reviewUser();
    $order = reviewOrder($customer);

    $this->withToken($token)->postJson('/api/reviews', ['order_id' => $order->id, 'rating' => 5, 'comment' => 'Beautiful dress.'])
        ->assertCreated();

    expect(Review::first()->status)->toBe('pending')
        ->and(KereNotification::where('user_id', $admin->id)->where('type', 'review_received')->exists())->toBeTrue();

    $this->getJson('/api/reviews/landing')->assertOk()->assertJsonCount(0, 'reviews');
});

test('a published review reads as Kere\'s, naming neither the customer nor the tailor', function () {
    [, $adminToken] = reviewUser('admin');
    [$customer] = reviewUser('customer', ['first_name' => 'Tamar', 'last_name' => 'Gelashvili', 'email' => 'tamar@example.com']);
    [$tailor] = reviewUser('tailor', ['first_name' => 'Eka', 'last_name' => 'Tailorova']);
    $order = reviewOrder($customer, ['tailor_id' => $tailor->id]);
    $review = Review::create(['order_id' => $order->id, 'user_id' => $customer->id, 'rating' => 5, 'comment' => 'Fits perfectly, very professional.']);

    $this->withToken($adminToken)->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'published'])
        ->assertOk()->assertJson(['status' => 'published']);

    $landing = $this->getJson('/api/reviews/landing')->assertOk();
    $landing->assertJsonPath('reviews.0.comment', 'Fits perfectly, very professional.')
        ->assertJsonPath('reviews.0.kind', 'marketplace')
        ->assertJsonPath('reviews.0.product_name', 'Linen Dress');
    foreach (['Tamar', 'Gelashvili', 'tamar@example.com', 'Eka', 'Tailorova', 'reviewer', 'tailor'] as $leak) {
        expect($landing->getContent())->not->toContain($leak);
    }

    $this->withToken($adminToken)->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'hidden'])->assertOk();
    $this->getJson('/api/reviews/landing')->assertJsonCount(0, 'reviews');
});

test('product reviews list only published ones, anonymously, while the average counts all', function () {
    [$customer] = reviewUser('customer', ['first_name' => 'Tamar']);
    $first = reviewOrder($customer);
    $second = reviewOrder($customer);
    $category = Category::create(['name' => 'Dresses', 'slug' => 'dresses']);
    $productId = Product::create(['category_id' => $category->id, 'name' => 'Linen Dress', 'slug' => 'linen-dress', 'price' => 100, 'stock' => 3])->id;

    Review::create(['order_id' => $first->id, 'user_id' => $customer->id, 'product_id' => $productId, 'rating' => 5, 'comment' => 'Lovely.', 'status' => 'published']);
    Review::create(['order_id' => $second->id, 'user_id' => $customer->id, 'product_id' => $productId, 'rating' => 3, 'comment' => 'Not yet read.']);

    $response = $this->getJson("/api/products/{$productId}/reviews")->assertOk()
        ->assertJsonCount(1, 'reviews')
        ->assertJsonPath('reviews.0.comment', 'Lovely.')
        ->assertJsonPath('total', 2)
        ->assertJsonPath('average_rating', 4);

    expect($response->json('reviews.0'))->not->toHaveKey('reviewer')
        ->and($response->getContent())->not->toContain('Tamar');
});

test('only admins moderate reviews', function () {
    [, $customerToken] = reviewUser();
    [, $adminToken] = reviewUser('admin');
    [$customer] = reviewUser();
    $review = Review::create(['order_id' => reviewOrder($customer)->id, 'user_id' => $customer->id, 'rating' => 4, 'comment' => 'Good.']);

    $this->withToken($customerToken)->getJson('/api/admin/reviews')->assertForbidden();
    $this->withToken($customerToken)->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'published'])->assertForbidden();
    $this->withToken($adminToken)->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'pending'])->assertUnprocessable();

    $this->withToken($adminToken)->getJson('/api/admin/reviews')->assertOk()
        ->assertJsonPath('reviews.0.status', 'pending')
        ->assertJsonPath('reviews.0.customer.name', $customer->getFullName());
});

test('a refused review says why with a code', function () {
    [$customer, $token] = reviewUser();
    $open = reviewOrder($customer, ['status' => 'processing', 'delivered_at' => null]);
    $done = reviewOrder($customer);

    $this->withToken($token)->postJson('/api/reviews', ['order_id' => $open->id, 'rating' => 5, 'comment' => 'Early.'])
        ->assertUnprocessable()->assertJsonPath('code', 'review_not_delivered');

    $this->withToken($token)->postJson('/api/reviews', ['order_id' => $done->id, 'rating' => 5, 'comment' => 'Once.'])->assertCreated();
    $this->withToken($token)->postJson('/api/reviews', ['order_id' => $done->id, 'rating' => 5, 'comment' => 'Twice.'])
        ->assertStatus(409)->assertJsonPath('code', 'review_exists');
});

test('a tailor\'s score counts every order they made, for the admins and the tailor alone', function () {
    [, $adminToken] = reviewUser('admin');
    [$tailor, $tailorToken] = reviewUser('tailor');
    [$customer] = reviewUser();

    $marketplace = reviewOrder($customer, ['tailor_id' => $tailor->id]);
    $remodel = reviewOrder($customer, ['tailor_id' => $tailor->id, 'order_type' => 'remodel', 'order_number' => 'RMD-'.Str::upper(Str::random(8))]);
    Review::create(['order_id' => $marketplace->id, 'user_id' => $customer->id, 'rating' => 5, 'comment' => 'Great.', 'status' => 'published']);
    // Hidden from the public, still part of the score.
    Review::create(['order_id' => $remodel->id, 'user_id' => $customer->id, 'rating' => 3, 'comment' => 'Late.', 'status' => 'hidden']);

    $this->withToken($tailorToken)->getJson('/api/tailor/stats')->assertOk()
        ->assertJsonPath('avg_rating', 4)
        ->assertJsonPath('reviews_count', 2);

    $tailorRow = collect($this->withToken($adminToken)->getJson('/api/admin/users')->assertOk()->json('users'))->firstWhere('id', $tailor->id);
    expect($tailorRow['score'])->toEqual(['average' => 4, 'count' => 2]);

    $open = reviewOrder($customer, ['status' => 'pending_assignment', 'order_type' => 'remodel', 'payment_status' => 'not_required', 'delivered_at' => null]);
    TailorRequest::create(['order_id' => $open->id, 'tailor_id' => $tailor->id, 'offered_price' => 80, 'ready_in_days' => 5, 'status' => 'pending']);

    $adminOrder = collect($this->withToken($adminToken)->getJson('/api/admin/orders')->assertOk()->json('orders'))->firstWhere('id', $open->id);
    expect($adminOrder['estimates'][0]['tailor']['score'])->toEqual(['average' => 4, 'count' => 2]);

    $reviewed = collect($this->withToken($adminToken)->getJson('/api/admin/orders')->json('orders'))->firstWhere('id', $marketplace->id);
    expect($reviewed['review'])->toEqual(['rating' => 5, 'status' => 'published']);

    expect($this->getJson('/api/reviews/landing')->getContent())->not->toContain('score');
});
