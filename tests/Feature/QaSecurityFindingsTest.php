<?php

use App\Models\Category;
use App\Models\CustomizerProduct;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\PasswordResetCode;
use App\Models\Product;
use App\Models\Review;
use App\Models\SavedDesign;
use App\Models\TailorRequest;
use App\Models\User;
use App\Models\Verification;
use App\Services\FlittService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Pre-launch security QA (2026-11-08). Two kinds of test live here:
 *
 *  - "guards": behaviour that is correct today and must stay that way (IDOR,
 *    mass assignment, notification failures not breaking orders).
 *  - "proves SEC-n": behaviour that is a finding in qa-security.md. These
 *    assert what the code does NOW, so they pass today; flip the assertion
 *    when the finding is fixed.
 */
function qasfUser(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'terms_accepted_at' => now(),
        'phone' => '+9955'.random_int(10000000, 99999999),
    ], $attributes, ['api_token' => hash('sha256', $token)]));

    return [$user, $token];
}

function qasfTailor(array $attributes = []): array
{
    return qasfUser(array_merge(['role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true], $attributes));
}

function qasfProduct(?User $tailor, array $attributes = []): Product
{
    $category = Category::firstOrCreate(['slug' => 'shirts'], ['name' => 'Shirts']);

    return Product::create(array_merge([
        'category_id' => $category->id,
        'tailor_id' => $tailor?->id,
        'name' => 'Linen shirt',
        'slug' => 'linen-'.Str::lower(Str::random(6)),
        'price' => 50,
        'stock' => 10,
        'is_customizable' => false,
        'colors' => ['#ffffff'],
        'sizes' => ['M'],
    ], $attributes));
}

function qasfOrder(User $customer, array $attributes = []): Order
{
    return Order::create(array_merge([
        'user_id' => $customer->id,
        'order_number' => 'ORD-'.Str::upper(Str::random(8)),
        'order_type' => 'marketplace',
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'subtotal' => 50, 'shipping' => 15, 'total' => 65,
        'first_name' => 'Nino', 'last_name' => 'B', 'email' => $customer->email, 'phone' => $customer->phone,
        'address' => 'N/A', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
    ], $attributes));
}

function qasfFlitt(): void
{
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');
    config()->set('services.flitt.api_url', 'https://flitt.invalid/api');
}

beforeEach(function () {
    Http::preventStrayRequests();
    config()->set('services.smsoffice.key', '');
});

// ─── IDOR guards ──────────────────────────────────────────────────────────────

it('guards: one customer cannot act on another customer\'s orders', function () {
    Http::fake();
    Mail::fake();
    [$owner] = qasfUser();
    [, $intruder] = qasfUser();
    [$tailor] = qasfTailor();

    $unpaid = qasfOrder($owner);
    $estimate = null;
    $offered = qasfOrder($owner, ['order_type' => 'remodel', 'order_number' => 'RMD-'.Str::upper(Str::random(8)), 'status' => 'pending_assignment', 'payment_status' => 'not_required']);
    $estimate = TailorRequest::create(['order_id' => $offered->id, 'tailor_id' => $tailor->id, 'offered_price' => 80, 'ready_in_days' => 4, 'status' => 'pending']);
    $offered->update(['offer_request_id' => $estimate->id, 'offer_price' => 100, 'offer_days' => 5, 'offer_sent_at' => now()]);
    $delivered = qasfOrder($owner, ['status' => 'delivered', 'payment_status' => 'paid', 'delivered_at' => now(), 'tailor_id' => $tailor->id]);
    $dated = qasfOrder($owner, ['order_type' => 'remodel', 'status' => 'processing', 'payment_status' => 'deposit_paid', 'tailor_id' => $tailor->id, 'due_date' => now()->addDays(3), 'proposed_due_date' => now()->addDays(9)]);
    $sentAt = $offered->fresh()->offer_sent_at->toISOString();

    $this->withToken($intruder)->postJson("/api/orders/{$unpaid->id}/pay")->assertNotFound();
    $this->withToken($intruder)->postJson("/api/orders/{$unpaid->id}/verify-payment")->assertNotFound();
    $this->withToken($intruder)->postJson("/api/customer/orders/{$unpaid->id}/cancel")->assertNotFound();
    $this->withToken($intruder)->postJson("/api/customer/orders/{$offered->id}/accept-offer", ['sent_at' => $sentAt])->assertNotFound();
    $this->withToken($intruder)->postJson("/api/customer/orders/{$offered->id}/decline-offer", ['sent_at' => $sentAt])->assertNotFound();
    $this->withToken($intruder)->postJson("/api/customer/orders/{$dated->id}/due-date", ['accept' => true])->assertNotFound();
    $this->withToken($intruder)->postJson("/api/customer/orders/{$delivered->id}/claims", ['type' => 'return'])->assertNotFound();
    $this->withToken($intruder)->postJson('/api/reviews', ['order_id' => $delivered->id, 'rating' => 1, 'comment' => 'x'])->assertNotFound();
    $this->withToken($intruder)->getJson("/api/customer/orders/{$delivered->id}/review-status")->assertNotFound();
    $this->withToken($intruder)->getJson("/api/orders/{$delivered->id}/messages")->assertForbidden();
    $this->withToken($intruder)->postJson("/api/orders/{$delivered->id}/messages", ['message' => 'hi'])->assertForbidden();
    $listed = $this->withToken($intruder)->getJson('/api/customer/orders')->assertOk()->json('orders');

    expect($listed)->toBe([])
        ->and($unpaid->fresh()->status)->toBe('pending')
        ->and($offered->fresh()->tailor_id)->toBeNull()
        ->and($offered->fresh()->offer_sent_at)->not->toBeNull()
        ->and($dated->fresh()->proposed_due_date)->not->toBeNull()
        ->and(Review::count())->toBe(0)
        ->and(Message::count())->toBe(0);
});

it('guards: a tailor cannot act on another tailor\'s orders, products or unpaid baskets', function () {
    Http::fake();
    Mail::fake();
    [$customer] = qasfUser();
    [$owner, $ownerToken] = qasfTailor();
    [, $intruder] = qasfTailor();

    $remodel = qasfOrder($customer, ['order_type' => 'remodel', 'status' => 'pending', 'payment_status' => 'deposit_paid', 'tailor_id' => $owner->id, 'picked_up_at' => now(), 'turnaround_days' => 5]);
    $product = qasfProduct($owner);
    $unpaid = qasfOrder($customer, ['tailor_id' => $owner->id]);

    $this->withToken($intruder)->patchJson("/api/tailor/orders/{$remodel->id}/status", ['status' => 'cancelled'])->assertNotFound();
    $this->withToken($intruder)->postJson("/api/tailor/orders/{$remodel->id}/received", ['photos' => ['https://example.com/a.jpg']])->assertNotFound();
    $this->withToken($intruder)->postJson("/api/tailor/orders/{$remodel->id}/due-date", ['due_date' => now()->addDays(20)->toDateString()])->assertNotFound();
    $this->withToken($intruder)->getJson("/api/orders/{$remodel->id}/messages")->assertForbidden();
    $this->withToken($intruder)->patchJson("/api/tailor/products/{$product->id}", ['price' => 1])->assertNotFound();
    $this->withToken($intruder)->patchJson("/api/tailor/products/{$product->id}/status", ['status' => 'paused'])->assertNotFound();
    $this->withToken($intruder)->deleteJson("/api/tailor/products/{$product->id}")->assertNotFound();

    // Even the assigned tailor does not see an unpaid marketplace order (terms §6).
    $this->withToken($ownerToken)->patchJson("/api/tailor/orders/{$unpaid->id}/status", ['status' => 'processing'])->assertNotFound();
    $this->withToken($ownerToken)->getJson("/api/orders/{$unpaid->id}/messages")->assertForbidden();

    expect($remodel->fresh()->status)->toBe('pending')
        ->and($remodel->fresh()->received_at)->toBeNull()
        ->and($product->fresh()->price)->toEqual(50)
        ->and($product->fresh()->status ?? 'active')->toBe('active');
});

it('guards: saved designs belong to their owner only', function () {
    [$owner] = qasfUser();
    [, $intruder] = qasfUser();
    $garment = CustomizerProduct::create(['name' => 'Tee', 'slug' => 'tee-'.Str::random(4), 'base_price' => 45, 'is_active' => true]);
    $layer = App\Models\LayerCategory::create(['customizer_product_id' => $garment->id, 'name' => 'Fit', 'slug' => 'fit']);
    $option = App\Models\LayerOption::create(['layer_category_id' => $layer->id, 'name' => 'Slim', 'slug' => 'slim']);
    $config = ['selections' => [$layer->id => $option->id]];
    $design = SavedDesign::create(['user_id' => $owner->id, 'customizer_product_id' => $garment->id, 'name' => 'Mine', 'configuration' => $config]);

    $this->withToken($intruder)->getJson("/api/customizer/designs/{$design->id}")->assertNotFound();
    $this->withToken($intruder)->putJson("/api/customizer/designs/{$design->id}", ['product_id' => $garment->id, 'name' => 'Stolen', 'configuration' => $config])->assertNotFound();
    $this->withToken($intruder)->deleteJson("/api/customizer/designs/{$design->id}")->assertNotFound();
    expect($this->withToken($intruder)->getJson('/api/customizer/designs')->json('designs'))->toBe([])
        ->and($design->fresh()->name)->toBe('Mine');
});

it('guards: customer measurements are read and written for the caller only', function () {
    [$owner, $ownerToken] = qasfUser();
    [, $intruder] = qasfUser();
    $this->withToken($ownerToken)->putJson('/api/customer/measurements', ['measurements' => ['chest' => 90]])->assertOk();

    expect($this->withToken($intruder)->getJson('/api/customer/measurements')->json('measurements'))->toBe([])
        ->and($owner->fresh()->measurements)->toBe(['chest' => 90]);
});

// ─── Mass assignment guards ──────────────────────────────────────────────────

it('guards: privileged user fields cannot be set through any user-facing write', function () {
    Http::fake();
    Mail::fake();
    [$tailor, $tailorToken] = qasfTailor();
    $evil = ['role' => 'admin', 'approval_status' => 'approved', 'is_suspended' => false, 'api_token' => 'x', 'email' => 'admin@kere.ge', 'national_id' => 'x'];

    $this->withToken($tailorToken)->patchJson('/api/tailor/profile', ['bio' => 'hello'] + $evil)->assertOk();
    $tailor->refresh();
    expect($tailor->role)->toBe('tailor')->and($tailor->email)->not->toBe('admin@kere.ge');

    $this->postJson('/api/register/initiate', tailorPayload(['role' => 'admin', 'phone' => '+995555777666']))->assertStatus(422);

    [$minor, $minorToken] = qasfUser(['terms_accepted_at' => null]);
    $this->withToken($minorToken)->postJson('/api/register/profile', [
        'date_of_birth' => '1990-01-01', 'accept_terms' => true, 'accept_privacy' => true,
        'role' => 'admin', 'guardian_consent_at' => now()->toISOString(),
    ])->assertOk();
    expect($minor->fresh()->role)->toBe('customer');
});

it('guards: an order, a product and a review take their money and status from the server, not the request', function () {
    Http::fake();
    Mail::fake();
    [$customer, $customerToken] = qasfUser();
    [$maker, $makerToken] = qasfTailor();
    [$other] = qasfTailor();
    $product = qasfProduct($maker);

    $id = $this->withToken($customerToken)->postJson('/api/orders', [
        'product_id' => $product->id, 'quantity' => 2, 'price' => 0.01, 'total' => 0.01, 'subtotal' => 0,
        'status' => 'delivered', 'payment_status' => 'paid', 'tailor_id' => $other->id, 'user_id' => $other->id,
    ])->assertCreated()->json('id');
    $order = Order::findOrFail($id);
    expect($order->total)->toEqual(115.0)
        ->and($order->status)->toBe('pending')
        ->and($order->payment_status)->toBe('unpaid')
        ->and($order->tailor_id)->toBe($maker->id)
        ->and($order->user_id)->toBe($customer->id);

    $this->withToken($makerToken)->patchJson("/api/tailor/products/{$product->id}", ['tailor_id' => $other->id, 'is_featured' => true, 'status' => 'active', 'slug' => 'x'])->assertOk();
    expect($product->fresh()->tailor_id)->toBe($maker->id)->and($product->fresh()->is_featured)->toBeFalsy();

    $delivered = qasfOrder($customer, ['status' => 'delivered', 'payment_status' => 'paid', 'delivered_at' => now(), 'tailor_id' => $maker->id]);
    $this->withToken($customerToken)->postJson('/api/reviews', ['order_id' => $delivered->id, 'rating' => 5, 'comment' => 'ok', 'status' => 'published'])->assertCreated();
    expect(Review::first()->status)->toBe('pending');
});

it('guards: zero, negative and oversized quantities are refused', function (int $quantity) {
    [, $token] = qasfUser();
    $product = qasfProduct(qasfTailor()[0]);
    $this->withToken($token)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => $quantity])->assertStatus(422);
    $this->withToken($token)->postJson('/api/orders', ['items' => [['product_id' => $product->id, 'quantity' => $quantity]]])->assertStatus(422);
    expect($product->fresh()->stock)->toBe(10);
})->with([0, -1, 1001]);

// ─── Notification failures (SMS and mail are inline, in try/catch) ───────────

it('guards: an order is still placed when the mail server throws', function () {
    Http::fake();
    Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP down'));
    [$customer, $token] = qasfUser();

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'remodel',
        'first_name' => 'Nino', 'phone' => '+995555000111', 'address' => 'Rustaveli 1', 'city' => 'Tbilisi',
        'custom_design_data' => ['change_request' => 'Shorten', 'remodel_images' => ['https://example.com/a.jpg']],
    ])->assertCreated();

    expect(Order::where('user_id', $customer->id)->count())->toBe(1);
});

it('guards: registration goes on when the SMS gateway answers 500 or is unreachable, and nothing retries', function () {
    Mail::fake();
    config()->set('services.smsoffice.key', 'qa-key');
    config()->set('services.smsoffice.url', 'https://sms.invalid/send');

    Http::fake(['sms.invalid/*' => Http::response('boom', 500)]);
    $this->postJson('/api/register/initiate', tailorPayload(['phone' => '+995555100201']))->assertOk();
    Http::assertSentCount(1);

    Http::fake(['sms.invalid/*' => fn () => throw new ConnectionException('timed out')]);
    $this->postJson('/api/register/initiate', tailorPayload(['phone' => '+995555100202']))->assertOk();

    expect(Verification::count())->toBe(2);
});

it('guards: a signed payment is credited even when every notification channel fails', function () {
    qasfFlitt();
    config()->set('services.smsoffice.key', 'qa-key');
    config()->set('services.smsoffice.url', 'https://sms.invalid/send');
    Http::fake(['sms.invalid/*' => Http::response('down', 500)]);
    Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP down'));

    [$customer] = qasfUser();
    [$tailor] = qasfTailor();
    $order = qasfOrder($customer, ['tailor_id' => $tailor->id]);
    $payload = ['order_id' => $order->order_number.'_abcdefgh', 'order_status' => 'approved', 'amount' => 6500, 'currency' => 'GEL', 'payment_id' => 123];
    $payload['signature'] = (new FlittService)->signature($payload);

    $this->postJson('/api/payments/flitt/callback', $payload)->assertOk()->assertJson(['status' => 'ok']);
    $this->postJson('/api/payments/flitt/callback', $payload)->assertOk();

    expect($order->fresh()->payment_status)->toBe('paid')
        ->and(OrderPayment::where('order_id', $order->id)->count())->toBe(1);
});

// ─── Findings, proved as the code behaves today ──────────────────────────────

it('guards SEC-1: a changing decoy "email" field does not open a fresh sign-in bucket', function () {
    qasfUser(['email' => 'victim@example.com']);

    foreach (range(1, 10) as $i) {
        $this->postJson('/api/login', [
            'login' => 'victim@example.com', 'password' => "guess{$i}", 'role' => 'customer', 'email' => "noise{$i}@x.test",
        ])->assertStatus(401);
    }

    $this->postJson('/api/login', ['login' => 'victim@example.com', 'password' => 'password', 'role' => 'customer', 'email' => 'fresh@x.test'])
        ->assertStatus(429);
});

it('guards SEC-1: every spelling of an account counts against the same sign-in bucket', function () {
    qasfUser(['email' => 'victim@example.com', 'phone' => '+995599123456']);

    $spellings = ['victim@example.com', 'VICTIM@example.com', ' victim@example.com', '+995599123456', '599 12 34 56', '995599123456'];
    foreach (range(0, 9) as $i) {
        $this->postJson('/api/login', ['login' => $spellings[$i % 6], 'password' => "guess{$i}", 'role' => 'customer'])->assertStatus(401);
    }

    $this->postJson('/api/login', ['login' => '599123456', 'password' => 'password', 'role' => 'customer'])->assertStatus(429);
});

it('guards SEC-1: guessing one account from many addresses stops at fifty an hour', function () {
    qasfUser(['email' => 'victim@example.com']);

    foreach (range(1, 50) as $i) {
        $this->withServerVariables(['REMOTE_ADDR' => "198.51.100.{$i}"])
            ->postJson('/api/login', ['login' => 'victim@example.com', 'password' => "guess{$i}", 'role' => 'customer'])
            ->assertStatus(401);
    }

    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.200'])
        ->postJson('/api/login', ['login' => 'victim@example.com', 'password' => 'password', 'role' => 'customer'])
        ->assertStatus(429);
});

it('guards SEC-1: one address working through many accounts stops at sixty a minute', function () {
    foreach (range(1, 60) as $i) {
        $this->postJson('/api/login', ['login' => "person{$i}@example.com", 'password' => 'guess', 'role' => 'customer'])->assertStatus(401);
    }

    $this->postJson('/api/login', ['login' => 'person61@example.com', 'password' => 'guess', 'role' => 'customer'])->assertStatus(429);
});

it('guards SEC-2: an admin cannot sign in through /api/login, and the answer does not reveal the password', function () {
    User::where('role', 'admin')->delete();
    qasfUser(['role' => 'admin', 'email' => 'admin@kere.ge']);

    foreach (['customer', 'tailor'] as $role) {
        $this->postJson('/api/login', ['login' => 'admin@kere.ge', 'password' => 'password', 'role' => $role])
            ->assertStatus(401)->assertJsonMissingPath('token');
        $this->postJson('/api/login', ['login' => 'admin@kere.ge', 'password' => 'wrong-password1', 'role' => $role])
            ->assertStatus(401);
    }
    $this->postJson('/api/login', ['login' => 'admin@kere.ge', 'password' => 'password', 'role' => 'admin'])->assertStatus(422);

    $this->postJson('/api/admin/auth', ['email' => 'Admin@Kere.ge', 'password' => 'password'])
        ->assertOk()->assertJsonPath('user.role', 'admin');
});

it('guards SEC-2: the admin sign-in allows five tries an hour per address, and twenty across addresses', function () {
    User::where('role', 'admin')->delete();
    qasfUser(['role' => 'admin', 'email' => 'admin@kere.ge']);

    foreach (range(1, 5) as $i) {
        $this->postJson('/api/admin/auth', ['email' => 'admin@kere.ge', 'password' => "x{$i}"])->assertStatus(401);
    }
    $this->postJson('/api/admin/auth', ['email' => 'ADMIN@kere.ge', 'password' => 'password'])->assertStatus(429);

    foreach (range(1, 15) as $i) {
        $this->withServerVariables(['REMOTE_ADDR' => "198.51.100.{$i}"])
            ->postJson('/api/admin/auth', ['email' => 'admin@kere.ge', 'password' => "y{$i}"])->assertStatus(401);
    }
    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.99'])
        ->postJson('/api/admin/auth', ['email' => 'admin@kere.ge', 'password' => 'password'])->assertStatus(429);
});

it('proves SEC-3: a forgotten-password code can be guessed 15 times every 15 minutes per account, indefinitely', function () {
    Mail::fake();
    [$victim] = qasfUser(['email' => 'victim@example.com']);
    $guesses = 0;

    foreach (range(1, 2) as $window) {
        foreach (range(1, 3) as $code) {
            $resetId = $this->postJson('/api/password/forgot', ['login' => 'victim@example.com'])->assertOk()->json('reset_id');
            expect(PasswordResetCode::find($resetId))->not->toBeNull(); // the attacker holds the id of the real code
            foreach (range(1, 5) as $try) {
                $status = $this->postJson('/api/password/reset', [
                    'reset_id' => $resetId, 'code' => str_pad((string) ($guesses++), 6, '0', STR_PAD_LEFT),
                    'password' => 'newpass123', 'password_confirmation' => 'newpass123',
                ])->status();
                expect($status)->toBeIn([422, 410]);
            }
        }
        $this->postJson('/api/password/forgot', ['login' => 'victim@example.com'])->assertStatus(429);
        $this->travel(16)->minutes();
    }

    expect($guesses)->toBe(30); // 1,440 a day, about 4% of the code space a month, per account
});

it('proves SEC-4: one IP can make Kere send repeated SMS to any number, including non-Georgian ones', function () {
    config()->set('services.smsoffice.key', 'qa-key');
    config()->set('services.smsoffice.url', 'https://sms.invalid/send');
    Http::fake(['sms.invalid/*' => Http::response(['Success' => true])]);

    foreach (range(1, 10) as $i) {
        $this->postJson('/api/register/initiate', tailorPayload(['phone' => '+88213456789']))->assertOk();
    }
    $this->postJson('/api/register/initiate', tailorPayload(['phone' => '+88213456789']))->assertStatus(429);

    Http::assertSentCount(10);
    Http::assertSent(fn (HttpRequest $r) => $r['destination'] === '88213456789');
});

it('proves SEC-5: an email with a CR/LF inside a quoted local part passes validation and injects a header', function () {
    config()->set('mail.default', 'array');
    $address = "\"x\r\nbcc: attacker@evil.test\"@example.com";

    $this->postJson('/api/register/initiate', [
        'first_name' => 'Eve', 'last_name' => 'X', 'email' => $address, 'phone' => '+995555123987',
        'password' => 'password123', 'password_confirmation' => 'password123', 'role' => 'customer', 'verify_via' => 'email',
    ])->assertOk();

    $raw = app('mail.manager')->mailer('array')->getSymfonyTransport()->messages()->first()->toString();
    expect($raw)->toContain("\r\nbcc: attacker@evil.test");
});

it('guards SEC-6: a pending or rejected tailor can neither list, change nor upload, and their old products are off sale', function (string $status) {
    Http::fake();
    Mail::fake();
    [$tailor, $token] = qasfTailor(['approval_status' => $status]);
    [, $customerToken] = qasfUser();
    $category = Category::firstOrCreate(['slug' => 'shirts'], ['name' => 'Shirts']);
    $existing = qasfProduct($tailor, ['name' => 'Listed before review']);

    $refused = fn ($response) => $response->assertForbidden()->assertJsonPath('code', 'pending_approval');
    $refused($this->withToken($token)->postJson('/api/tailor/products', ['name' => 'Unvetted shirt', 'price' => 30, 'category_id' => $category->id]));
    $refused($this->withToken($token)->patchJson("/api/tailor/products/{$existing->id}", ['price' => 1]));
    $refused($this->withToken($token)->patchJson("/api/tailor/products/{$existing->id}/status", ['status' => 'active']));
    $refused($this->withToken($token)->deleteJson("/api/tailor/products/{$existing->id}"));
    $refused($this->withToken($token)->postJson('/api/upload/image'));
    $refused($this->withToken($token)->postJson('/api/upload/profile-image'));
    $refused($this->withToken($token)->postJson('/api/upload/order-photo'));

    expect(Product::count())->toBe(1)->and($existing->fresh()->price)->toBe(50.0);
    $this->getJson('/api/products')->assertJsonMissing(['name' => 'Listed before review']);
    $this->getJson("/api/products/{$existing->id}")->assertNotFound();
    $this->get("/product/{$existing->id}")->assertNotFound();
    $this->get('/sitemap.xml')->assertDontSee("/product/{$existing->id}<", false);
    expect(collect($this->getJson('/api/categories')->json())->firstWhere('slug', 'shirts')['products_count'])->toBe(0);
    $this->withToken($customerToken)->postJson('/api/orders', ['product_id' => $existing->id, 'quantity' => 1])
        ->assertStatus(409)->assertJsonPath('code', 'product_unavailable');
})->with(['pending', 'rejected']);

it('guards SEC-6: an approved tailor still lists products and uploads, and their products sell', function () {
    Http::fake();
    Mail::fake();
    [, $token] = qasfTailor();
    [, $customerToken] = qasfUser();
    $category = Category::firstOrCreate(['slug' => 'shirts'], ['name' => 'Shirts']);

    $id = $this->withToken($token)->postJson('/api/tailor/products', ['name' => 'Vetted shirt', 'price' => 30, 'category_id' => $category->id, 'is_customizable' => false])
        ->assertCreated()->json('product.id');
    $this->withToken($token)->postJson('/api/upload/image')->assertStatus(422); // reached validation
    $this->getJson("/api/products/{$id}")->assertOk();
    $this->withToken($customerToken)->postJson('/api/orders', ['product_id' => $id, 'quantity' => 1])->assertCreated();
});

it('guards SEC-7: a suspended tailor\'s products leave sale and orders for them are refused, also in a bag', function () {
    Http::fake();
    Mail::fake();
    [$tailor] = qasfTailor(['is_suspended' => true]);
    [, $customerToken] = qasfUser();
    $product = qasfProduct($tailor);

    $this->getJson("/api/products/{$product->id}")->assertNotFound();
    $this->withToken($customerToken)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1])
        ->assertStatus(409)->assertJsonPath('code', 'product_unavailable');
    $this->withToken($customerToken)->postJson('/api/orders', ['order_type' => 'marketplace', 'items' => [['product_id' => $product->id, 'quantity' => 1]]])
        ->assertStatus(409);

    expect(Order::count())->toBe(0)->and($product->fresh()->stock)->toBe(10);

    $tailor->update(['is_suspended' => false]);
    $this->getJson("/api/products/{$product->id}")->assertOk();
});

it('guards SEC-20: a product without a tailor never goes to a tailor who cannot take work', function () {
    Http::fake();
    Mail::fake();
    User::where('role', 'tailor')->delete();
    qasfTailor(['approval_status' => 'pending']);
    qasfTailor(['is_suspended' => true]);
    [$approved] = qasfTailor();
    [, $customerToken] = qasfUser();
    $product = qasfProduct(null);

    $id = $this->withToken($customerToken)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1])->assertCreated()->json('id');
    expect(Order::find($id)->tailor_id)->toBe($approved->id);
});

it('proves SEC-8: one customer can hold a product\'s whole stock in unpaid orders that never expire', function () {
    Http::fake();
    Mail::fake();
    [, $hoarder] = qasfUser();
    [, $buyer] = qasfUser();
    $product = qasfProduct(qasfTailor()[0], ['stock' => 1000]);

    $this->withToken($hoarder)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1000])->assertCreated();
    $this->withToken($buyer)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1])->assertStatus(422);

    $this->travel(30)->days();
    expect($product->fresh()->stock)->toBe(0)
        ->and(array_key_exists('orders:expire-unpaid', Artisan::all()))->toBeFalse();
});

it('proves SEC-9: a paused product and an arbitrary colour and size are still accepted on an order', function () {
    Http::fake();
    Mail::fake();
    [, $token] = qasfUser();
    $product = qasfProduct(qasfTailor()[0], ['status' => 'paused']);

    $this->withToken($token)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1, 'color' => 'not-a-colour', 'size' => 'XXXXL'])->assertCreated();
});

it('guards SEC-10: the gateway callback and return URLs ignore a client-supplied forwarded host', function () {
    qasfFlitt();
    Http::fake(['flitt.invalid/*' => Http::response(['response' => ['response_status' => 'success', 'token' => 'tok']])]);
    [$customer, $token] = qasfUser();
    $order = qasfOrder($customer);

    $this->withToken($token)->withHeader('X-Forwarded-Host', 'evil.example')->postJson("/api/orders/{$order->id}/pay")->assertOk();

    Http::assertSent(fn (HttpRequest $r) => isset($r['request']['server_callback_url'])
        && ! str_contains($r['request']['server_callback_url'], 'evil.example')
        && ! str_contains($r['request']['response_url'] ?? '', 'evil.example'));
});

it('proves SEC-11: a minor can name their own address as guardian by changing its letter case', function () {
    Mail::fake();
    [$minor, $token] = qasfUser(['email' => 'teen@example.com', 'terms_accepted_at' => null]);

    $this->withToken($token)->postJson('/api/register/profile', [
        'date_of_birth' => now()->subYears(16)->subDays(10)->toDateString(),
        'accept_terms' => true, 'accept_privacy' => true,
        'guardian_name' => 'Me Myself', 'guardian_email' => 'TEEN@example.com',
        'guardian_phone' => '+995555000999', 'guardian_relationship' => 'parent',
    ])->assertOk();

    expect($minor->fresh()->guardian_email)->toBe('TEEN@example.com');
});

it('proves SEC-12: an identical order posted twice becomes two orders', function () {
    Http::fake();
    Mail::fake();
    [$customer, $token] = qasfUser();
    $product = qasfProduct(qasfTailor()[0]);

    $this->withToken($token)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();
    $this->withToken($token)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1])->assertCreated();

    expect(Order::where('user_id', $customer->id)->count())->toBe(2);
});

it('proves SEC-13: the public catalogue is unthrottled and answers malformed filters with a 500', function () {
    foreach (range(1, 100) as $i) {
        $this->getJson('/api/products')->assertOk();
    }

    $this->getJson('/api/products?search[]=a')->assertStatus(500);
    $this->getJson('/api/products?fabric[0][]=x')->assertStatus(500);
});
