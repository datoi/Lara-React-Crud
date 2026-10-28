<?php

use App\Mail\OfferSent;
use App\Models\Category;
use App\Models\KereNotification;
use App\Models\Message;
use App\Models\Order;
use App\Models\Product;
use App\Models\TailorRequest;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Kere is the only seller (terms v1.1 §3, §8, §18; privacy policy §4.2, §9):
 * a tailor's price is an internal estimate for Kere, the customer is offered
 * Kere's own price and never learns or picks the tailor, and the customer and
 * the tailor each talk to Kere, never to each other.
 */
function offerUser(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

function offerTailor(array $attributes = []): array
{
    return offerUser(array_merge([
        'role' => 'tailor',
        'approval_status' => 'approved',
        'does_remodeling' => true,
        'first_name' => 'Giorgi',
        'last_name' => 'Hiddenadze',
    ], $attributes));
}

function offerOpenRemodel(User $customer): Order
{
    return Order::create([
        'user_id' => $customer->id,
        'order_number' => 'RMD-'.Str::upper(Str::random(8)),
        'order_type' => 'remodel',
        'payment_status' => 'not_required',
        'tailor_assignment_mode' => 'manual',
        'status' => 'pending_assignment',
        'subtotal' => 0, 'shipping' => 15, 'total' => 15,
        'custom_design_data' => ['change_request' => 'Shorten the sleeves', 'remodel_images' => ['https://example.com/a.jpg']],
        'first_name' => 'Nino', 'last_name' => '', 'email' => $customer->email, 'phone' => '+995555000111',
        'address' => 'Rustaveli 1', 'city' => 'Tbilisi', 'zip' => '', 'country' => 'GE',
    ]);
}

/** An open remodel with one tailor's estimate of ₾80 over 4 days. */
function offerWithEstimate(): array
{
    [$customer, $customerToken] = offerUser();
    [$tailor, $tailorToken] = offerTailor();
    [$admin, $adminToken] = offerUser(['role' => 'admin']);
    $order = offerOpenRemodel($customer);

    test()->withToken($tailorToken)
        ->postJson("/api/tailor/orders/{$order->id}/request", ['offered_price' => 80, 'ready_in_days' => 4, 'message' => 'Simple hem'])
        ->assertCreated();

    $estimate = TailorRequest::where('order_id', $order->id)->firstOrFail();

    return compact('customer', 'customerToken', 'tailor', 'tailorToken', 'admin', 'adminToken', 'order', 'estimate');
}

function sendOffer(array $s, array $overrides = []): Illuminate\Testing\TestResponse
{
    return test()->withToken($s['adminToken'])->postJson("/api/admin/orders/{$s['order']->id}/offer", array_merge(
        ['request_id' => $s['estimate']->id, 'price' => 100, 'days' => 6, 'note' => 'Includes new buttons'],
        $overrides,
    ));
}

/** The customer's answer to an offer, naming the one their dashboard shows them. */
function answerOffer(array $s, string $action, ?string $sentAt = null): Illuminate\Testing\TestResponse
{
    $sentAt ??= test()->withToken($s['customerToken'])->getJson('/api/customer/orders')->json('orders.0.offer.sent_at')
        ?? now()->toISOString();

    return test()->withToken($s['customerToken'])->postJson("/api/customer/orders/{$s['order']->id}/{$action}-offer", ['sent_at' => $sentAt]);
}

// ─── Estimates and offers ─────────────────────────────────────────────────────

test('a tailor\'s estimate reaches Kere, not the customer', function () {
    $s = offerWithEstimate();

    expect(KereNotification::where('user_id', $s['customer']->id)->exists())->toBeFalse()
        ->and(KereNotification::where('user_id', $s['admin']->id)->where('type', 'estimate_received')->exists())->toBeTrue();

    $orders = $this->withToken($s['customerToken'])->getJson('/api/customer/orders')->assertOk();
    $orders->assertJsonPath('orders.0.offer', null);
    expect($orders->getContent())->not->toContain('Hiddenadze')->not->toContain('Simple hem');
});

test('an estimate has to give a price and a time', function () {
    [$customer] = offerUser();
    [, $tailorToken] = offerTailor();
    $order = offerOpenRemodel($customer);

    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/request", ['message' => 'Happy to'])
        ->assertStatus(422)->assertJsonValidationErrors(['offered_price', 'ready_in_days']);
});

test('the customer is offered Kere\'s price, and never learns the tailor', function () {
    Mail::fake();
    $s = offerWithEstimate();

    sendOffer($s)->assertOk()->assertJsonPath('offer.price', 100);

    $orders = $this->withToken($s['customerToken'])->getJson('/api/customer/orders')->assertOk()
        ->assertJsonPath('orders.0.offer.price', 100)
        ->assertJsonPath('orders.0.offer.total', 115)
        ->assertJsonPath('orders.0.offer.first_payment', 65)
        ->assertJsonPath('orders.0.offer.days', 6)
        ->assertJsonPath('orders.0.offer.note', 'Includes new buttons');

    expect($orders->getContent())->not->toContain('Hiddenadze')
        ->and($orders->json('orders.0'))->not->toHaveKeys(['tailor_id', 'tailor_name'])
        ->and(KereNotification::where('user_id', $s['customer']->id)->where('type', 'kere_offer')->exists())->toBeTrue();
    Mail::assertSent(OfferSent::class, fn ($mail) => $mail->hasTo($s['customer']->email));
});

test('accepting gives the order to the tailor behind the offer, at Kere\'s price', function () {
    $s = offerWithEstimate();
    [$other, $otherToken] = offerTailor(['last_name' => 'Otheradze']);
    $this->withToken($otherToken)
        ->postJson("/api/tailor/orders/{$s['order']->id}/request", ['offered_price' => 70, 'ready_in_days' => 3])
        ->assertCreated();
    sendOffer($s)->assertOk();

    answerOffer($s, 'accept')
        ->assertOk()
        ->assertJsonPath('order.payment_due.stage', 'deposit')
        ->assertJsonPath('order.payment_due.amount', 65);

    $order = $s['order']->fresh();
    expect($order->tailor_id)->toBe($s['tailor']->id)
        ->and($order->subtotal)->toBe(100.0)
        ->and($order->turnaround_days)->toBe(6)
        ->and($s['estimate']->fresh()->status)->toBe('accepted')
        ->and(TailorRequest::where('tailor_id', $other->id)->value('status'))->toBe('declined');
});

test('declining clears the offer, tells Kere, and Kere can send another', function () {
    $s = offerWithEstimate();
    sendOffer($s)->assertOk();

    answerOffer($s, 'decline')->assertOk();

    expect($s['order']->fresh()->hasOpenOffer())->toBeFalse()
        ->and(KereNotification::where('user_id', $s['admin']->id)->where('type', 'offer_declined')->exists())->toBeTrue();
    answerOffer($s, 'accept')->assertStatus(409)->assertJsonPath('code', 'no_offer');

    sendOffer($s, ['price' => 90])->assertOk();
    $this->withToken($s['customerToken'])->getJson('/api/customer/orders')->assertJsonPath('orders.0.offer.price', 90);
});

test('an answer to an offer Kere has since replaced is refused, not applied to the new price', function () {
    $s = offerWithEstimate();
    sendOffer($s)->assertOk();
    $seen = $this->withToken($s['customerToken'])->getJson('/api/customer/orders')->json('orders.0.offer.sent_at');

    $this->travel(5)->seconds();
    sendOffer($s, ['price' => 150])->assertOk();

    answerOffer($s, 'accept', $seen)->assertStatus(409)->assertJsonPath('code', 'offer_changed');
    answerOffer($s, 'decline', $seen)->assertStatus(409)->assertJsonPath('code', 'offer_changed');

    $order = $s['order']->fresh();
    expect($order->tailor_id)->toBeNull()
        ->and($order->hasOpenOffer())->toBeTrue()
        ->and($order->offer_price)->toBe(150.0);

    answerOffer($s, 'accept')->assertOk();
    expect($s['order']->fresh()->subtotal)->toBe(150.0);
});

test('an estimate on a custom order gives a price and a time as well', function () {
    config()->set('app.custom_orders_open', true);
    [, $customerToken] = offerUser();
    [, $tailorToken] = offerTailor();
    $this->withToken($customerToken)->postJson('/api/orders', ['order_type' => 'custom', 'custom_design_data' => ['garment_type' => 'shirt']])
        ->assertCreated();
    $order = Order::firstOrFail();

    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/request", ['message' => 'Happy to'])
        ->assertStatus(422)->assertJsonValidationErrors(['offered_price', 'ready_in_days']);
    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/request", ['offered_price' => 120, 'ready_in_days' => 9])
        ->assertCreated();
});

test('an offer cannot rest on a suspended tailor, or go out on an order that has one', function () {
    $s = offerWithEstimate();
    $s['tailor']->update(['is_suspended' => true]);

    sendOffer($s)->assertStatus(422)->assertJsonPath('code', 'estimate_unavailable');

    $s['tailor']->update(['is_suspended' => false]);
    $s['order']->update(['tailor_id' => $s['tailor']->id, 'status' => 'pending']);
    sendOffer($s)->assertStatus(409)->assertJsonPath('code', 'order_not_open');
});

test('an offer whose tailor drops out cannot be accepted, and Kere is asked for a new one', function () {
    $s = offerWithEstimate();
    sendOffer($s)->assertOk();
    $s['tailor']->update(['is_suspended' => true]);

    answerOffer($s, 'accept')->assertStatus(409)->assertJsonPath('code', 'offer_unavailable');

    expect($s['order']->fresh()->tailor_id)->toBeNull()
        ->and($s['order']->fresh()->hasOpenOffer())->toBeFalse()
        ->and(KereNotification::where('user_id', $s['admin']->id)->where('type', 'offer_lapsed')->exists())->toBeTrue();
});

test('only an admin sends offers, and a remodel is never assigned without one', function () {
    $s = offerWithEstimate();

    $this->withToken($s['customerToken'])->postJson("/api/admin/orders/{$s['order']->id}/offer", [])->assertForbidden();
    $this->withToken($s['tailorToken'])->postJson("/api/admin/orders/{$s['order']->id}/offer", [])->assertForbidden();

    $this->withToken($s['adminToken'])->patchJson("/api/admin/orders/{$s['order']->id}/assign", ['tailor_id' => $s['tailor']->id])
        ->assertStatus(409)->assertJsonPath('code', 'use_offer');
});

// ─── No choosing a tailor ─────────────────────────────────────────────────────

test('custom orders are paused, and the page says so', function () {
    [, $token] = offerUser();

    $this->withToken($token)->postJson('/api/orders', ['order_type' => 'custom', 'custom_design_data' => ['garment_type' => 'shirt']])
        ->assertStatus(409)->assertJsonPath('code', 'custom_orders_paused');
    expect(Order::count())->toBe(0);

    expect($this->get('/design')->getContent())->toContain('name="kere-custom-orders" content="paused"');
});

test('a reopened custom order goes to the open pool, whoever the customer names', function () {
    config()->set('app.custom_orders_open', true);
    [, $token] = offerUser();
    [$tailor] = offerTailor();

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'custom',
        'tailor_assignment_mode' => 'manual',
        'tailor_id' => $tailor->id,
        'custom_design_data' => ['garment_type' => 'shirt'],
    ])->assertCreated();

    $order = Order::firstOrFail();
    expect($order->tailor_id)->toBeNull()->and($order->status)->toBe('pending_assignment');
});

test('a marketplace order goes to the product\'s tailor, whoever the customer names', function () {
    [, $token] = offerUser();
    [$maker] = offerTailor();
    [$other] = offerTailor(['last_name' => 'Otheradze']);
    $category = Category::create(['name' => 'Coats', 'slug' => 'coats']);
    $product = Product::create(['category_id' => $category->id, 'tailor_id' => $maker->id, 'name' => 'Coat', 'slug' => 'coat', 'price' => 200, 'stock' => 3]);

    $this->withToken($token)->postJson('/api/orders', [
        'order_type' => 'marketplace', 'product_id' => $product->id, 'quantity' => 1, 'tailor_id' => $other->id,
    ])->assertCreated()->assertJsonMissingPath('tailor_name');

    expect(Order::firstOrFail()->tailor_id)->toBe($maker->id);
});

// ─── Two conversations ────────────────────────────────────────────────────────

test('the customer and the tailor each talk to Kere, never to each other', function () {
    $s = offerWithEstimate();
    $s['order']->update(['tailor_id' => $s['tailor']->id, 'status' => 'pending']);
    $id = $s['order']->id;

    $this->withToken($s['customerToken'])->postJson("/api/orders/{$id}/messages", ['message' => 'When will it be ready?'])->assertCreated();
    $this->withToken($s['tailorToken'])->postJson("/api/orders/{$id}/messages", ['message' => 'Fabric is thin'])->assertCreated();

    // Only Kere hears either of them.
    expect(KereNotification::where('user_id', $s['tailor']->id)->where('type', 'new_message')->exists())->toBeFalse()
        ->and(KereNotification::where('user_id', $s['customer']->id)->where('type', 'new_message')->exists())->toBeFalse()
        ->and(KereNotification::where('user_id', $s['admin']->id)->where('type', 'new_message')->count())->toBe(2);

    $this->withToken($s['adminToken'])->postJson("/api/admin/orders/{$id}/messages", ['channel' => 'customer', 'message' => 'Friday'])->assertCreated();
    $this->withToken($s['adminToken'])->postJson("/api/admin/orders/{$id}/messages", ['channel' => 'tailor', 'message' => 'Line it'])->assertCreated();

    $customerSees = $this->withToken($s['customerToken'])->getJson("/api/orders/{$id}/messages")->assertOk();
    expect(collect($customerSees->json('messages'))->pluck('message')->all())->toBe(['When will it be ready?', 'Friday'])
        ->and($customerSees->json('messages.1.sender_name'))->toBe('Kere')
        ->and($customerSees->getContent())->not->toContain('Hiddenadze');

    $tailorSees = $this->withToken($s['tailorToken'])->getJson("/api/orders/{$id}/messages")->assertOk();
    expect(collect($tailorSees->json('messages'))->pluck('message')->all())->toBe(['Fabric is thin', 'Line it'])
        ->and($tailorSees->json('messages.1.sender_name'))->toBe('Kere');

    $this->withToken($s['customerToken'])->getJson('/api/messages/counts')->assertJsonPath("counts.{$id}", 1);
    $this->withToken($s['adminToken'])->getJson("/api/admin/orders/{$id}/messages?channel=tailor")
        ->assertJsonCount(2, 'messages');
});

test('a tailor given an order does not read the previous tailor\'s messages as Kere\'s', function () {
    $s = offerWithEstimate();
    [$next, $nextToken] = offerTailor(['last_name' => 'Nextadze']);
    $s['order']->update(['tailor_id' => $s['tailor']->id, 'status' => 'pending']);
    $id = $s['order']->id;

    $this->withToken($s['tailorToken'])->postJson("/api/orders/{$id}/messages", ['message' => 'I cannot source this fabric'])->assertCreated();
    $this->withToken($s['adminToken'])->postJson("/api/admin/orders/{$id}/messages", ['channel' => 'tailor', 'message' => 'Understood'])->assertCreated();
    $this->withToken($s['adminToken'])->patchJson("/api/admin/orders/{$id}/assign", ['tailor_id' => $next->id])->assertOk();

    $nextSees = $this->withToken($nextToken)->getJson("/api/orders/{$id}/messages")->assertOk();
    expect(collect($nextSees->json('messages'))->pluck('message')->all())->toBe(['Understood'])
        ->and($nextSees->json('messages.0.sender_name'))->toBe('Kere');
    $this->withToken($nextToken)->getJson('/api/messages/counts')->assertJsonPath("counts.{$id}", 1);
    $this->withToken($s['tailorToken'])->getJson("/api/orders/{$id}/messages")->assertForbidden();
});

test('Kere cannot write to a tailor an order does not have yet', function () {
    $s = offerWithEstimate();

    $this->withToken($s['adminToken'])->postJson("/api/admin/orders/{$s['order']->id}/messages", ['channel' => 'tailor', 'message' => 'Hi'])
        ->assertStatus(422)->assertJsonPath('code', 'no_tailor');
    expect(Message::count())->toBe(0);
});
