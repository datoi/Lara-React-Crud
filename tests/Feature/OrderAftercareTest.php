<?php

use App\Models\Category;
use App\Models\KereNotification;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderClaim;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\OrderRefund;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * After an order is placed, as the 2026-10-13 terms set it out: cancelling
 * before work begins (§14), returning a ready-made item within 14 days (§15),
 * reporting a problem with photos (§16), and refunds made by an admin through
 * Flitt. A tailor sees a marketplace order only once it is paid (§6).
 */
function careUser(string $role = 'customer'): array
{
    $token = Str::random(60);
    $user = User::factory()->create([
        'role' => $role,
        'terms_accepted_at' => now(),
        'approval_status' => $role === 'tailor' ? 'approved' : null,
        'api_token' => hash('sha256', $token),
    ]);

    return [$user, $token];
}

function careOrder(User $customer, array $attributes = [], array $item = []): Order
{
    $order = Order::create(array_merge([
        'user_id' => $customer->id,
        'order_number' => 'ORD-'.Str::upper(Str::random(8)),
        'order_type' => 'marketplace',
        'status' => 'delivered',
        'payment_status' => 'paid',
        'subtotal' => 100, 'shipping' => 15, 'total' => 115,
        'delivered_at' => now()->subDays(2),
        'first_name' => 'Nino', 'last_name' => 'K', 'email' => $customer->email,
        'address' => 'N/A', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
    ], $attributes));

    OrderItem::create(array_merge([
        'order_id' => $order->id, 'product_name' => 'Linen Dress', 'color' => '#000000',
        'size' => 'M', 'quantity' => 1, 'price' => 100,
    ], $item));

    return $order;
}

function carePayment(Order $order, string $stage, float $amount, string $reference): OrderPayment
{
    return OrderPayment::create([
        'order_id' => $order->id, 'stage' => $stage, 'reference' => $reference,
        'amount' => $amount, 'paid_at' => now(),
    ]);
}

beforeEach(function () {
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');
});

// ─── Cancelling ───────────────────────────────────────────────────────────────

test('a customer can cancel until work begins, and not after', function () {
    [$customer, $token] = careUser();
    $waiting = careOrder($customer, ['status' => 'pending', 'payment_status' => 'unpaid', 'delivered_at' => null]);
    $started = careOrder($customer, ['status' => 'processing', 'delivered_at' => null]);

    $this->withToken($token)->postJson("/api/customer/orders/{$waiting->id}/cancel")->assertOk();
    expect($waiting->fresh()->status)->toBe('cancelled')
        ->and($waiting->fresh()->payment_status)->toBe('expired')
        ->and($waiting->fresh()->cancelled_at)->not->toBeNull();

    $this->withToken($token)->postJson("/api/customer/orders/{$started->id}/cancel")
        ->assertStatus(409)->assertJsonPath('code', 'order_not_cancellable');
});

test('cancelling a paid order tells the admins money is owed back', function () {
    [$customer, $token] = careUser();
    [$admin] = careUser('admin');
    $order = careOrder($customer, ['status' => 'pending', 'delivered_at' => null]);
    carePayment($order, 'full', 115, $order->order_number.'_abc12345');

    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/cancel")->assertOk();

    $note = KereNotification::where('user_id', $admin->id)->where('type', 'refund_due')->firstOrFail();
    expect($note->body)->toContain('115.00');
});

test('cancelling a marketplace order puts its stock back, once', function () {
    [$customer, $token] = careUser();
    $category = Category::create(['name' => 'Dresses', 'slug' => 'dresses']);
    // Placing the order took 3 of 5, as storeMarketplaceOrder does.
    $product = Product::create(['category_id' => $category->id, 'name' => 'Linen Dress', 'slug' => 'linen-dress', 'price' => 100, 'stock' => 2]);
    $order = careOrder($customer, ['status' => 'pending', 'payment_status' => 'unpaid', 'delivered_at' => null], ['product_id' => $product->id, 'quantity' => 3]);

    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/cancel")->assertOk();
    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/cancel")
        ->assertStatus(409)->assertJsonPath('code', 'order_not_cancellable');

    expect($product->fresh()->stock)->toBe(5);
});

test('a tailor cancelling tells the admins what has to go back', function () {
    [$customer] = careUser();
    [$admin] = careUser('admin');
    [$tailor, $tailorToken] = careUser('tailor');
    $order = careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'processing', 'delivered_at' => null]);
    carePayment($order, 'full', 115, $order->order_number.'_abc12345');

    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'cancelled'])->assertOk();

    expect($order->fresh()->status)->toBe('cancelled')
        ->and($order->fresh()->payment_status)->toBe('paid')
        ->and(KereNotification::where('user_id', $admin->id)->where('type', 'refund_due')->value('body'))
        ->toContain('მკერავმა')->toContain('115.00');
});

test('someone else\'s order cannot be cancelled', function () {
    [$owner] = careUser();
    [, $otherToken] = careUser();
    $order = careOrder($owner, ['status' => 'pending', 'delivered_at' => null]);

    $this->withToken($otherToken)->postJson("/api/customer/orders/{$order->id}/cancel")->assertNotFound();
});

// ─── Returns and problems ─────────────────────────────────────────────────────

test('a ready-made item can be returned within 14 days of delivery', function () {
    [$customer, $token] = careUser();
    $order = careOrder($customer);

    $this->withToken($token)->getJson('/api/customer/orders')
        ->assertJsonPath('orders.0.returnable_until', now()->subDays(2)->addDays(14)->toDateString());

    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/claims", ['type' => 'return'])->assertCreated();
    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/claims", ['type' => 'return'])
        ->assertStatus(409)->assertJsonPath('code', 'claim_exists');
});

test('the return window closes after 14 days, and the dashboard stops offering it', function () {
    [$customer, $token] = careUser();
    $order = careOrder($customer, ['delivered_at' => now()->subDays(15)]);

    $this->withToken($token)->getJson('/api/customer/orders')->assertJsonPath('orders.0.returnable_until', null);
    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/claims", ['type' => 'return'])
        ->assertStatus(422)->assertJsonPath('code', 'return_window_closed');
});

test('an item made to the customer\'s measurements cannot be returned for a change of mind', function () {
    [$customer, $token] = careUser();
    $order = careOrder($customer, [], ['cm_measurements' => ['chest' => 90]]);

    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/claims", ['type' => 'return'])
        ->assertStatus(422)->assertJsonPath('code', 'return_not_available');
    $this->withToken($token)->getJson('/api/customer/orders')->assertJsonPath('orders.0.returnable_until', null);
});

test('a problem report needs photos and a delivered order', function () {
    [$customer, $token] = careUser();
    $delivered = careOrder($customer);
    $pending = careOrder($customer, ['status' => 'processing', 'delivered_at' => null]);

    $this->withToken($token)->postJson("/api/customer/orders/{$delivered->id}/claims", ['type' => 'problem', 'message' => 'Seam split'])
        ->assertStatus(422)->assertJsonValidationErrors('photos');
    $this->withToken($token)->postJson("/api/customer/orders/{$pending->id}/claims", [
        'type' => 'problem', 'message' => 'Seam split', 'photos' => ['https://example.com/p.jpg'],
    ])->assertStatus(422)->assertJsonPath('code', 'problem_not_available');
    $this->withToken($token)->postJson("/api/customer/orders/{$delivered->id}/claims", [
        'type' => 'problem', 'message' => 'Seam split', 'photos' => ['https://example.com/p.jpg'],
    ])->assertCreated();
});

test('an admin closes a claim and the customer hears about it', function () {
    [$customer] = careUser();
    [, $adminToken] = careUser('admin');
    $order = careOrder($customer);
    $claim = OrderClaim::create(['order_id' => $order->id, 'user_id' => $customer->id, 'type' => 'problem', 'message' => 'x', 'status' => 'open']);

    $this->withToken($adminToken)->getJson('/api/admin/claims')->assertJsonPath('claims.0.id', $claim->id);
    $this->withToken($adminToken)->patchJson("/api/admin/claims/{$claim->id}", ['status' => 'resolved', 'note' => 'Fixed for free'])->assertOk();
    $this->withToken($adminToken)->patchJson("/api/admin/claims/{$claim->id}", ['status' => 'rejected'])->assertStatus(409);

    expect(KereNotification::where('user_id', $customer->id)->latest('id')->value('body'))->toContain('Fixed for free');
});

// ─── Refunds ──────────────────────────────────────────────────────────────────

test('a refund reverses the latest payment first and is recorded', function () {
    [$customer] = careUser();
    [, $adminToken] = careUser('admin');
    $order = careOrder($customer, ['order_type' => 'remodel', 'status' => 'cancelled', 'payment_status' => 'paid', 'deposit_amount' => 65]);
    carePayment($order, 'deposit', 65, $order->order_number.'_d-aaaa1111');
    carePayment($order, 'balance', 50, $order->order_number.'_b-bbbb2222');

    Http::fake(['*/reverse/order_id' => Http::response(['response' => ['response_status' => 'success', 'reverse_status' => 'approved']])]);

    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 80, 'note' => 'Cancelled'])
        ->assertOk()
        ->assertJsonPath('refunded', 80)
        ->assertJsonPath('refunded_total', 80);

    // ₾50 back on the second half, ₾30 on the first, each by its own reference.
    Http::assertSentCount(2);
    Http::assertSent(fn ($r) => $r['request']['order_id'] === $order->order_number.'_b-bbbb2222' && $r['request']['amount'] === 5000);
    Http::assertSent(fn ($r) => $r['request']['order_id'] === $order->order_number.'_d-aaaa1111' && $r['request']['amount'] === 3000);
    expect(OrderRefund::where('order_id', $order->id)->where('status', 'approved')->count())->toBe(2);

    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 40])
        ->assertStatus(422)->assertJsonPath('code', 'refund_exceeds_paid');
});

test('a refund the gateway declines is not counted as money returned', function () {
    [$customer] = careUser();
    [, $adminToken] = careUser('admin');
    $order = careOrder($customer);
    $payment = carePayment($order, 'full', 115, $order->order_number.'_abc12345');

    Http::fake(['*/reverse/order_id' => Http::response(['response' => ['response_status' => 'success', 'reverse_status' => 'declined']])]);

    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 115])
        ->assertStatus(502)->assertJsonPath('code', 'refund_failed');

    expect($payment->fresh()->refunded_amount)->toBe(0.0)
        ->and(OrderRefund::where('order_id', $order->id)->value('status'))->toBe('failed');
});

test('a refund Flitt never answered is asked about again, never sent anew', function () {
    [$customer] = careUser();
    [, $adminToken] = careUser('admin');
    $order = careOrder($customer);
    $payment = carePayment($order, 'full', 115, $order->order_number.'_abc12345');

    $answers = [
        fn () => throw new ConnectionException('Operation timed out'),
        fn () => Http::response(['response' => ['response_status' => 'failure', 'error_code' => 1018]]),
        fn () => Http::response(['response' => ['response_status' => 'success', 'reverse_status' => 'approved']]),
        fn () => Http::response(['response' => ['response_status' => 'success', 'reverse_status' => 'approved']]),
    ];
    $sent = [];
    Http::fake(['*/reverse/order_id' => function ($request) use (&$answers, &$sent) {
        $sent[] = $request['request']['reverse_id'];

        return array_shift($answers)();
    }]);

    // The answer is lost: nothing is counted, and the request stays open.
    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 50])
        ->assertStatus(502)->assertJsonPath('code', 'refund_unresolved');
    expect($payment->fresh()->refunded_amount)->toBe(0.0)
        ->and(OrderRefund::where('order_id', $order->id)->value('status'))->toBe('pending');

    // Asked again, an error says nothing about the first request: still open.
    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 50])
        ->assertStatus(502)->assertJsonPath('code', 'refund_unresolved');

    // Flitt confirms it: the money is counted, and the new click sends nothing new.
    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 50])
        ->assertStatus(409)->assertJsonPath('code', 'refund_confirmed_earlier')->assertJsonPath('refunded', 50);
    expect(array_unique($sent))->toHaveCount(1)
        ->and($payment->fresh()->refunded_amount)->toBe(50.0)
        ->and(KereNotification::where('user_id', $customer->id)->value('body'))->toContain('50.00');

    // With nothing left unanswered, a refund goes out as normal, under a new key.
    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 65])->assertOk();
    expect(array_unique($sent))->toHaveCount(2)
        ->and($payment->fresh()->refunded_amount)->toBe(115.0);
});

test('only admins can refund', function () {
    [$customer, $token] = careUser();
    $order = careOrder($customer);

    $this->withToken($token)->postJson("/api/admin/orders/{$order->id}/refund", ['amount' => 10])->assertForbidden();
});

// ─── The tailor's view ────────────────────────────────────────────────────────

test('a tailor sees a marketplace order only once it is paid', function () {
    [$customer] = careUser();
    [$tailor, $tailorToken] = careUser('tailor');
    careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'pending', 'payment_status' => 'unpaid', 'delivered_at' => null]);
    $paid = careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'pending', 'delivered_at' => null]);

    $this->withToken($tailorToken)->getJson('/api/tailor/orders')
        ->assertJsonCount(1, 'orders')
        ->assertJsonPath('orders.0.id', $paid->id);
});

test('a tailor cannot work on or talk about an unpaid marketplace order', function () {
    [$customer] = careUser();
    [$admin, $adminToken] = careUser('admin');
    [$tailor, $tailorToken] = careUser('tailor');
    $unpaid = careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'pending', 'payment_status' => 'unpaid', 'delivered_at' => null]);
    Message::create(['order_id' => $unpaid->id, 'sender_id' => $admin->id, 'channel' => 'tailor', 'message' => 'Hello']);

    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$unpaid->id}/status", ['status' => 'processing'])->assertNotFound();
    $this->withToken($tailorToken)->getJson("/api/orders/{$unpaid->id}/messages")->assertForbidden();
    $this->withToken($tailorToken)->getJson('/api/messages/counts')->assertJsonMissingPath("counts.{$unpaid->id}");
    expect($unpaid->fresh()->status)->toBe('pending');
});

test('marketplace orders a tailor took on before card payment stay with them and the courier', function () {
    [$customer, $customerToken] = careUser();
    [, $adminToken] = careUser('admin');
    [$tailor, $tailorToken] = careUser('tailor');
    $making = careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'processing', 'payment_status' => 'unpaid', 'delivered_at' => null]);
    $finished = careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'finished', 'payment_status' => 'unpaid', 'delivered_at' => null]);
    $awaiting = careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'pending', 'payment_status' => 'unpaid', 'delivered_at' => null]);
    $recent = careOrder($customer, ['tailor_id' => $tailor->id, 'status' => 'processing', 'payment_status' => 'unpaid', 'delivered_at' => null]);
    Order::whereIn('id', [$making->id, $finished->id, $awaiting->id])->update(['created_at' => '2026-09-10 12:00:00']);
    $recent->forceFill(['created_at' => '2026-10-01 12:00:00'])->save();

    (require database_path('migrations/2026_10_29_000001_settle_pre_payment_marketplace_orders_offline.php'))->up();

    // Taken on before card payment: settled offline. Still pending: may be
    // waiting for the customer to pay online, so it keeps its Pay button.
    expect($making->fresh()->payment_status)->toBe('not_required')
        ->and($awaiting->fresh()->payment_status)->toBe('unpaid')
        ->and($recent->fresh()->payment_status)->toBe('unpaid');
    $due = collect($this->withToken($customerToken)->getJson('/api/customer/orders')->json('orders'))->pluck('payment_due', 'id');
    expect($due[$awaiting->id]['stage'])->toBe('full');
    $this->withToken($tailorToken)->getJson('/api/tailor/orders')->assertJsonCount(2, 'orders');
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$making->id}/status", ['status' => 'finished'])->assertOk();

    $steps = collect($this->withToken($adminToken)->getJson('/api/admin/orders')->json('orders'))->pluck('next_courier_step', 'id');
    expect($steps[$finished->id])->toBe('ship')
        ->and($steps[$recent->id])->toBeNull();
});
