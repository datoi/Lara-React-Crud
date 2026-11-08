<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Models\Verification;
use App\Services\FlittService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Pre-launch QA: the critical journeys end to end, through the HTTP API only
 * wherever the API offers a door. Helpers are prefixed qaj_ so they cannot
 * collide with other test files' global functions.
 */
function qaj_user(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

function qaj_tailor(array $attributes = []): array
{
    return qaj_user(array_merge(['role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true], $attributes));
}

function qaj_admin(): array
{
    return qaj_user(['role' => 'admin']);
}

function qaj_product(User $tailor, array $attributes = []): Product
{
    $categoryId = DB::table('categories')->insertGetId([
        'name' => 'Tops', 'slug' => 'tops-'.Str::random(6),
        'created_at' => now(), 'updated_at' => now(),
    ]);

    return Product::create(array_merge([
        'category_id' => $categoryId,
        'tailor_id' => $tailor->id,
        'name' => 'QA Shirt '.Str::random(4),
        'slug' => 'qa-shirt-'.Str::random(6),
        'price' => 60,
        'stock' => 5,
        'status' => 'active',
        'colors' => ['#000000'],
        'sizes' => ['M'],
        'images' => [],
        'is_customizable' => true,
    ], $attributes));
}

function qaj_signed(array $payload): array
{
    $payload['signature'] = (new FlittService)->signature($payload);

    return $payload;
}

beforeEach(function () {
    Mail::fake();
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');
    config()->set('services.smsoffice.key', '');
    Http::fake([
        '*checkout/token*' => Http::response(['response' => ['response_status' => 'success', 'token' => 'tok_qa_123']]),
        '*' => Http::response(['response' => ['response_status' => 'failure']]),
    ]);
});

// ─── Customer sign-up and sessions ───────────────────────────────────────────

test('JRN customer signs up by email, finishes the profile and may then order', function () {
    $init = $this->postJson('/api/register/initiate', [
        'first_name' => 'Ana', 'last_name' => 'Kapanadze',
        'email' => 'QA.Ana@Example.com', 'phone' => '+995555900100',
        'password' => 'password123', 'password_confirmation' => 'password123',
        'role' => 'customer', 'verify_via' => 'email',
    ])->assertOk()->assertJsonPath('channel', 'email');

    $record = Verification::findOrFail($init->json('verification_id'));

    $this->postJson('/api/register/verify-email', ['verification_id' => $record->id, 'code' => '000000'])
        ->assertStatus(422)->assertJsonPath('code', 'code_incorrect');

    $verified = $this->postJson('/api/register/verify-email', ['verification_id' => $record->id, 'code' => $record->otp_email])
        ->assertOk();
    $token = $verified->json('token');
    expect($verified->json('user.email'))->toBe('qa.ana@example.com');

    $this->withToken($token)->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.registration_complete', false)
        ->assertJsonPath('user.may_place_orders', false);

    [$tailor] = qaj_tailor();
    $product = qaj_product($tailor);

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'quantity' => 1,
    ])->assertStatus(403)->assertJsonPath('code', 'registration_incomplete');

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => now()->subYears(30)->toDateString(),
        'accept_terms' => true, 'accept_privacy' => true, 'marketing_opt_in' => false, 'locale' => 'ka',
    ])->assertSuccessful();

    $this->withToken($token)->getJson('/api/me')->assertJsonPath('user.may_place_orders', true);

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'color' => '#000000', 'size' => 'M', 'quantity' => 1,
    ])->assertCreated();
});

test('JRN customer signs up by SMS code', function () {
    $init = $this->postJson('/api/register/initiate', [
        'first_name' => 'Gio', 'last_name' => 'Lomidze',
        'email' => 'gio.qa@example.com', 'phone' => '+995555900101',
        'password' => 'password123', 'password_confirmation' => 'password123',
        'role' => 'customer', 'verify_via' => 'phone',
    ])->assertOk()->assertJsonPath('channel', 'phone');

    $record = Verification::findOrFail($init->json('verification_id'));

    $this->postJson('/api/register/verify-phone', ['verification_id' => $record->id, 'code' => $record->otp_phone])
        ->assertCreated()->assertJsonPath('user.role', 'customer');
});

test('JRN one token per user: a new login signs the previous session out', function () {
    $user = User::factory()->create(['role' => 'customer', 'email' => 'one@example.com', 'password' => 'password123', 'terms_accepted_at' => now()]);

    $first = $this->postJson('/api/login', ['login' => 'one@example.com', 'password' => 'password123', 'role' => 'customer'])
        ->assertOk()->json('token');
    $this->withToken($first)->getJson('/api/me')->assertOk();

    $second = $this->postJson('/api/login', ['login' => 'one@example.com', 'password' => 'password123', 'role' => 'customer'])
        ->assertOk()->json('token');

    // Laravel's test client caches the resolved user between requests; reset it.
    $this->app['auth']->forgetGuards();
    $this->withToken($first)->getJson('/api/me')->assertStatus(401);
    $this->withToken($second)->getJson('/api/me')->assertOk();
});

test('JRN there is no server-side logout: signing out in the SPA leaves the token valid', function () {
    [, $token] = qaj_user();

    // No route exists. The SPA's clearAuth() only forgets the token in the browser.
    expect($this->withToken($token)->postJson('/api/logout')->status())->toBeIn([404, 405]);

    // Nothing has revoked it, so whoever copied it keeps the session indefinitely.
    $this->withToken($token)->getJson('/api/me')->assertOk();
});

// ─── Tailor registration and approval ────────────────────────────────────────

test('JRN tailor registers by phone, waits, is approved by an admin and can then work', function () {
    $init = $this->postJson('/api/register/initiate', tailorPayload(['phone' => '+995555900200']))
        ->assertOk()->assertJsonPath('channel', 'phone');
    $record = Verification::findOrFail($init->json('verification_id'));

    $tailorToken = $this->postJson('/api/register/verify-phone', ['verification_id' => $record->id, 'code' => $record->otp_phone])
        ->assertCreated()->assertJsonPath('user.approval_status', 'pending')->json('token');
    $tailor = User::where('phone', '+995555900200')->firstOrFail();

    $this->withToken($tailorToken)->getJson('/api/tailor/orders')->assertStatus(403)->assertJsonPath('code', 'pending_approval');
    $this->withToken($tailorToken)->getJson('/api/tailor/open-orders')->assertStatus(403);

    [, $adminToken] = qaj_admin();
    $this->withToken($adminToken)->getJson('/api/admin/tailors/pending')
        ->assertOk()->assertJsonPath('tailors.0.id', $tailor->id)
        ->assertJsonMissingPath('tailors.0.national_id');

    $this->withToken($adminToken)->postJson("/api/admin/tailors/{$tailor->id}/approve")->assertOk();

    $this->app['auth']->forgetGuards();
    $this->withToken($tailorToken)->getJson('/api/me')->assertJsonPath('user.approval_status', 'approved');
    $this->withToken($tailorToken)->getJson('/api/tailor/orders')->assertOk();
    $this->withToken($tailorToken)->getJson('/api/tailor/open-orders')->assertOk();

    $categoryId = DB::table('categories')->insertGetId(['name' => 'Shirts', 'slug' => 'shirts-qa', 'created_at' => now(), 'updated_at' => now()]);
    $this->withToken($tailorToken)->postJson('/api/tailor/products', [
        'name' => 'Linen shirt', 'price' => 80, 'category_id' => $categoryId, 'gender' => 'men', 'stock' => 3,
    ])->assertCreated();
});

test('JRN a rejected tailor is shut out of the tailor endpoints', function () {
    [$tailor, $tailorToken] = qaj_tailor(['approval_status' => 'pending']);
    [, $adminToken] = qaj_admin();

    $this->withToken($adminToken)->postJson("/api/admin/tailors/{$tailor->id}/reject", ['reason' => 'ID unreadable'])
        ->assertOk()->assertJsonPath('approval_status', 'rejected');

    $this->app['auth']->forgetGuards();
    $this->withToken($tailorToken)->getJson('/api/tailor/orders')->assertStatus(403);
    $this->withToken($tailorToken)->getJson('/api/tailor/open-orders')->assertStatus(403);
});

test('JRN-1: a pending or rejected tailor cannot publish products to the public catalogue', function () {
    [, $tailorToken] = qaj_tailor(['approval_status' => 'rejected']);
    $categoryId = DB::table('categories')->insertGetId(['name' => 'Shirts', 'slug' => 'shirts-qa2', 'created_at' => now(), 'updated_at' => now()]);

    $this->withToken($tailorToken)->postJson('/api/tailor/products', [
        'name' => 'Rejected tailor shirt', 'price' => 80, 'category_id' => $categoryId, 'stock' => 3,
    ])->assertStatus(403);
});

// ─── Marketplace end to end ──────────────────────────────────────────────────

test('JRN marketplace: order, pay, tailor works, admin ships and delivers, customer reviews, admin publishes', function () {
    [$customer, $customerToken] = qaj_user();
    [$tailor, $tailorToken] = qaj_tailor();
    [, $adminToken] = qaj_admin();
    $product = qaj_product($tailor, ['price' => 60, 'stock' => 5]);

    $orderId = $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'color' => '#000000', 'size' => 'M', 'quantity' => 2,
    ])->assertCreated()->assertJsonPath('payment_status', 'unpaid')->json('id');

    expect($product->fresh()->stock)->toBe(3);
    $order = Order::findOrFail($orderId);
    expect((float) $order->total)->toBe(135.0); // 2 × 60 + 15 delivery

    // Unpaid: the tailor neither sees nor can touch it.
    $this->withToken($tailorToken)->getJson('/api/tailor/orders')->assertOk()->assertJsonCount(0, 'orders');
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$orderId}/status", ['status' => 'processing'])->assertNotFound();

    $pay = $this->withToken($customerToken)->postJson("/api/orders/{$orderId}/pay", ['lang' => 'ka'])
        ->assertOk()->assertJsonPath('stage', 'full')->assertJsonPath('currency', 'GEL');
    expect($pay->json('checkout_url'))->toContain('tok_qa_123');
    $reference = $order->fresh()->payment_reference;
    expect($reference)->toStartWith($order->order_number.'_');

    // A forged callback is ignored.
    $this->postJson('/api/payments/flitt/callback', [
        'order_id' => $reference, 'order_status' => 'approved', 'amount' => 13500, 'currency' => 'GEL', 'signature' => 'forged',
    ])->assertOk()->assertJsonPath('status', 'ignored');
    expect($order->fresh()->payment_status)->toBe('unpaid');

    $this->postJson('/api/payments/flitt/callback', qaj_signed([
        'order_id' => $reference, 'order_status' => 'approved', 'amount' => 13500, 'currency' => 'GEL', 'payment_id' => '777',
    ]))->assertOk()->assertJsonPath('status', 'ok');
    expect($order->fresh()->payment_status)->toBe('paid');

    $this->withToken($customerToken)->postJson("/api/orders/{$orderId}/pay")->assertStatus(409)->assertJsonPath('code', 'order_already_paid');

    $this->withToken($tailorToken)->getJson('/api/tailor/orders')->assertOk()->assertJsonPath('orders.0.id', $orderId);
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$orderId}/status", ['status' => 'finished'])->assertStatus(422);
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$orderId}/status", ['status' => 'processing'])->assertOk();

    // Not cancellable by the customer once work has begun.
    $this->withToken($customerToken)->postJson("/api/customer/orders/{$orderId}/cancel")->assertStatus(409);

    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$orderId}/status", ['status' => 'finished'])->assertOk();

    // Review not allowed until delivered.
    $this->withToken($customerToken)->postJson('/api/reviews', ['order_id' => $orderId, 'rating' => 5, 'comment' => 'Early'])
        ->assertStatus(422)->assertJsonPath('code', 'review_not_delivered');

    $this->withToken($adminToken)->getJson('/api/admin/orders')->assertOk()
        ->assertJsonPath('orders.0.next_courier_step', 'ship');
    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$orderId}/ship")->assertOk()->assertJsonPath('status', 'shipped');
    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$orderId}/deliver")->assertOk()->assertJsonPath('status', 'delivered');

    $orders = $this->withToken($customerToken)->getJson('/api/customer/orders')->assertOk();
    $mine = collect($orders->json('orders'))->firstWhere('id', $orderId);
    expect($mine['status'])->toBe('delivered')
        ->and($mine['has_review'])->toBeFalse()
        ->and($mine['payment_due'])->toBeNull()
        ->and((float) $mine['paid_total'])->toBe(135.0);

    $this->withToken($customerToken)->postJson('/api/reviews', ['order_id' => $orderId, 'rating' => 5, 'comment' => 'Beautiful work'])
        ->assertCreated();
    $this->withToken($customerToken)->postJson('/api/reviews', ['order_id' => $orderId, 'rating' => 4, 'comment' => 'Again'])
        ->assertStatus(409);

    $this->getJson('/api/reviews/landing')->assertOk()->assertJsonCount(0, 'reviews');
    $this->getJson("/api/products/{$product->id}/reviews")->assertOk()->assertJsonCount(0, 'reviews');

    $review = Review::where('order_id', $orderId)->firstOrFail();
    $this->withToken($adminToken)->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'published'])->assertOk();

    $landing = $this->getJson('/api/reviews/landing')->assertOk()->assertJsonCount(1, 'reviews');
    expect(json_encode($landing->json()))->not->toContain($customer->email)
        ->and(json_encode($landing->json()))->not->toContain($tailor->name);
    $this->getJson("/api/products/{$product->id}/reviews")->assertOk()->assertJsonCount(1, 'reviews');
});

test('JRN marketplace: customer cancels an unpaid order, stock returns and it can no longer be paid', function () {
    [, $customerToken] = qaj_user();
    [$tailor] = qaj_tailor();
    $product = qaj_product($tailor, ['stock' => 2]);

    $orderId = $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'quantity' => 2,
    ])->assertCreated()->json('id');
    expect($product->fresh()->stock)->toBe(0);

    $this->withToken($customerToken)->postJson("/api/customer/orders/{$orderId}/cancel")->assertOk();
    expect($product->fresh()->stock)->toBe(2)
        ->and(Order::find($orderId)->payment_status)->toBe('expired');

    $this->withToken($customerToken)->postJson("/api/orders/{$orderId}/pay")->assertStatus(409);
});

test('JRN another customer cannot pay, verify or cancel someone else\'s order', function () {
    [, $ownerToken] = qaj_user();
    [, $otherToken] = qaj_user();
    [$tailor] = qaj_tailor();
    $product = qaj_product($tailor);

    $orderId = $this->withToken($ownerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'quantity' => 1,
    ])->assertCreated()->json('id');

    $this->app['auth']->forgetGuards();
    $this->withToken($otherToken)->postJson("/api/orders/{$orderId}/pay")->assertNotFound();
    $this->withToken($otherToken)->postJson("/api/orders/{$orderId}/verify-payment")->assertNotFound();
    $this->withToken($otherToken)->postJson("/api/customer/orders/{$orderId}/cancel")->assertNotFound();
});

// ─── Cart checkout with two tailors ──────────────────────────────────────────

test('JRN cart with two tailors: one order per tailor, delivery charged per order, mixing refused', function () {
    [$customer, $customerToken] = qaj_user();
    [$tailorA] = qaj_tailor();
    [$tailorB] = qaj_tailor();
    $a1 = qaj_product($tailorA, ['price' => 50, 'stock' => 4]);
    $a2 = qaj_product($tailorA, ['price' => 30, 'stock' => 4]);
    $b1 = qaj_product($tailorB, ['price' => 70, 'stock' => 4]);

    $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'items' => [['product_id' => $a1->id, 'quantity' => 1], ['product_id' => $b1->id, 'quantity' => 1]],
    ])->assertStatus(422);
    expect($a1->fresh()->stock)->toBe(4)->and($b1->fresh()->stock)->toBe(4);

    $first = $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'items' => [
            ['product_id' => $a1->id, 'color' => '#000000', 'size' => 'M', 'quantity' => 1],
            ['product_id' => $a1->id, 'color' => '#000000', 'size' => 'L', 'quantity' => 2],
            ['product_id' => $a2->id, 'quantity' => 1],
        ],
    ])->assertCreated();
    $second = $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'items' => [['product_id' => $b1->id, 'quantity' => 1]],
    ])->assertCreated();

    expect((float) $first->json('total'))->toBe(3 * 50 + 30 + 15.0)
        ->and((float) $second->json('total'))->toBe(70 + 15.0)
        ->and($a1->fresh()->stock)->toBe(1)
        ->and(Order::find($first->json('id'))->tailor_id)->toBe($tailorA->id)
        ->and(Order::find($second->json('id'))->tailor_id)->toBe($tailorB->id)
        ->and(Order::find($first->json('id'))->items()->count())->toBe(3);

    // Asking for more than is in stock across lines of one product is refused whole.
    $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace',
        'items' => [['product_id' => $a1->id, 'size' => 'M', 'quantity' => 1], ['product_id' => $a1->id, 'size' => 'L', 'quantity' => 1]],
    ])->assertStatus(422);
    expect($a1->fresh()->stock)->toBe(1);
});

// ─── Remodel from the form to a review ───────────────────────────────────────

test('JRN remodel from the request form through both halves to delivery and a review', function () {
    [$customer, $customerToken] = qaj_user();
    [$tailor, $tailorToken] = qaj_tailor();
    [, $adminToken] = qaj_admin();

    $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'remodel',
        'first_name' => 'Nino', 'phone' => '+995555000111', 'address' => 'Rustaveli 1', 'city' => 'თბილისი',
        'needed_by' => now()->addDays(20)->toDateString(),
        'custom_design_data' => ['change_request' => 'Shorten the sleeves', 'remodel_images' => ['https://example.com/a.jpg']],
    ])->assertCreated()->assertJsonPath('status', 'pending_assignment');
    $order = Order::where('user_id', $customer->id)->firstOrFail();

    $this->withToken($tailorToken)->getJson('/api/tailor/open-orders')->assertOk()->assertJsonPath('orders.0.id', $order->id);
    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/request", ['offered_price' => 90, 'ready_in_days' => 4])->assertCreated();

    $estimateId = $this->withToken($adminToken)->getJson('/api/admin/orders')->json('orders.0.estimates.0.id');
    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/offer", ['request_id' => $estimateId, 'price' => 100, 'days' => 5])->assertOk();

    $sentAt = $this->withToken($customerToken)->getJson('/api/customer/orders')->json('orders.0.offer.sent_at');
    expect($sentAt)->not->toBeNull();
    $this->withToken($customerToken)->postJson("/api/customer/orders/{$order->id}/accept-offer", ['sent_at' => $sentAt])->assertOk();

    $order->refresh();
    expect((float) $order->deposit_amount)->toBe(65.0)->and($order->payment_status)->toBe('unpaid');

    $this->withToken($customerToken)->postJson("/api/orders/{$order->id}/pay")->assertOk()->assertJsonPath('stage', 'deposit');
    $this->postJson('/api/payments/flitt/callback', qaj_signed([
        'order_id' => $order->fresh()->payment_reference, 'order_status' => 'approved', 'amount' => 6500, 'currency' => 'GEL', 'payment_id' => '1',
    ]))->assertOk();
    expect($order->fresh()->payment_status)->toBe('deposit_paid');

    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/picked-up")->assertOk();
    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/received", ['photos' => ['https://example.com/in.jpg']])->assertOk();
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'processing'])->assertOk();
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'finished', 'photos' => ['https://example.com/out.jpg']])->assertOk();

    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/ship")->assertStatus(409);
    $this->withToken($customerToken)->postJson("/api/orders/{$order->id}/pay")->assertOk()->assertJsonPath('stage', 'balance')->assertJsonPath('amount', 50);
    $this->postJson('/api/payments/flitt/callback', qaj_signed([
        'order_id' => $order->fresh()->payment_reference, 'order_status' => 'approved', 'amount' => 5000, 'currency' => 'GEL', 'payment_id' => '2',
    ]))->assertOk();
    expect($order->fresh()->payment_status)->toBe('paid');

    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/ship")->assertOk();
    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/deliver")->assertOk();

    $this->withToken($customerToken)->postJson('/api/reviews', ['order_id' => $order->id, 'rating' => 4, 'comment' => 'Fits now'])->assertCreated();
    expect(Review::where('order_id', $order->id)->value('product_id'))->toBeNull();
});

// ─── Suspension ──────────────────────────────────────────────────────────────

test('JRN admin suspends a customer: the live token is refused, login refused, unsuspending restores it', function () {
    [$customer, $customerToken] = qaj_user(['email' => 'susp@example.com', 'password' => 'password123']);
    [, $adminToken] = qaj_admin();

    $this->withToken($adminToken)->patchJson("/api/admin/users/{$customer->id}/suspend")->assertOk()->assertJsonPath('is_suspended', true);

    $this->app['auth']->forgetGuards();
    $this->withToken($customerToken)->getJson('/api/me')->assertStatus(403);
    $this->withToken($customerToken)->getJson('/api/customer/orders')->assertStatus(403);
    $this->postJson('/api/login', ['login' => 'susp@example.com', 'password' => 'password123', 'role' => 'customer'])
        ->assertStatus(403)->assertJsonPath('code', 'account_suspended');

    $this->app['auth']->forgetGuards();
    $this->withToken($adminToken)->patchJson("/api/admin/users/{$customer->id}/suspend")->assertOk()->assertJsonPath('is_suspended', false);
    $this->app['auth']->forgetGuards();
    $this->withToken($customerToken)->getJson('/api/me')->assertOk();
});

test('JRN-2: a suspended account\'s requests are refused with a code the SPA can translate', function () {
    [$customer, $customerToken] = qaj_user();
    $customer->update(['is_suspended' => true]);

    $this->withToken($customerToken)->getJson('/api/me')->assertStatus(403)->assertJsonPath('code', 'account_suspended');
});

test('JRN an admin cannot suspend another admin', function () {
    [$other] = qaj_admin();
    [, $adminToken] = qaj_admin();

    $this->withToken($adminToken)->patchJson("/api/admin/users/{$other->id}/suspend")->assertStatus(422);
});

test('JRN-3: a suspended tailor\'s products leave sale, and an order for one is refused', function () {
    [, $customerToken] = qaj_user();
    [$tailor] = qaj_tailor(['is_suspended' => true]);
    $product = qaj_product($tailor);
    $stock = $product->stock;

    $this->getJson('/api/products')->assertOk()->assertJsonPath('total', 0);
    $this->getJson("/api/products/{$product->id}")->assertNotFound();

    $this->withToken($customerToken)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'quantity' => 1,
    ])->assertStatus(409)->assertJsonPath('code', 'product_unavailable');

    expect(Order::count())->toBe(0)->and($product->fresh()->stock)->toBe($stock);
});
