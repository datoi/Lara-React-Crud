<?php

use App\Models\KereNotification;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\TailorRequest;
use App\Models\User;
use App\Services\FlittService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * A remodel as the terms describe it (§7, §8, §12, §13, §17): a tailor's
 * estimate names a price and how long the work takes; Kere makes the customer
 * an offer based on it; accepting asks for half the price plus delivery; the
 * courier collects the garment, which the tailor photographs on arrival; the
 * work is finished with photos; the second half is paid; the courier brings
 * it back. The offer itself is covered in KereOfferTest.
 */
function rmdUser(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

function rmdTailor(): array
{
    return rmdUser(['role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true]);
}

function rmdOpenRemodel(User $customer, string $paymentStatus = 'not_required'): Order
{
    return Order::create([
        'user_id' => $customer->id,
        'order_number' => 'RMD-'.Str::upper(Str::random(8)),
        'order_type' => 'remodel',
        'payment_status' => $paymentStatus,
        'tailor_assignment_mode' => 'manual',
        'status' => 'pending_assignment',
        'subtotal' => 0,
        'shipping' => 15,
        'total' => 15,
        'custom_design_data' => ['change_request' => 'Shorten the sleeves', 'remodel_images' => ['https://example.com/a.jpg']],
        'first_name' => 'Nino', 'last_name' => '', 'email' => $customer->email, 'phone' => '+995555000111',
        'address' => 'Rustaveli 1', 'city' => 'Tbilisi', 'zip' => '', 'country' => 'GE',
    ]);
}

/** A remodel with an accepted offer of ₾100 over 5 days: ₾65 now, ₾50 later. */
function rmdAccepted(): array
{
    [$customer, $customerToken] = rmdUser();
    [$tailor, $tailorToken] = rmdTailor();
    [, $adminToken] = rmdAdmin();
    $order = rmdOpenRemodel($customer);

    test()->withToken($tailorToken)
        ->postJson("/api/tailor/orders/{$order->id}/request", ['offered_price' => 90, 'ready_in_days' => 4])
        ->assertCreated();

    $estimate = TailorRequest::where('order_id', $order->id)->firstOrFail();

    test()->withToken($adminToken)
        ->postJson("/api/admin/orders/{$order->id}/offer", ['request_id' => $estimate->id, 'price' => 100, 'days' => 5])
        ->assertOk();

    test()->withToken($customerToken)
        ->postJson("/api/customer/orders/{$order->id}/accept-offer", ['sent_at' => $order->fresh()->offer_sent_at->toISOString()])
        ->assertOk();

    return [$order->fresh(), $customer, $customerToken, $tailor, $tailorToken];
}

function rmdAdmin(): array
{
    return rmdUser(['role' => 'admin']);
}

function rmdSigned(array $payload): array
{
    $payload['signature'] = (new FlittService)->signature($payload);

    return $payload;
}

function rmdPaid(Order $order, string $stage, ?int $amount = null): void
{
    $reference = (new FlittService)->newReference($order, $stage);

    test()->postJson('/api/payments/flitt/callback', rmdSigned([
        'order_id' => $reference,
        'order_status' => 'approved',
        'amount' => $amount ?? (int) round($order->amountDue($stage) * 100),
        'currency' => 'GEL',
        'payment_id' => (string) random_int(1000, 9999),
    ]))->assertOk();
}

beforeEach(function () {
    config()->set('services.flitt.merchant_id', '1549901');
    config()->set('services.flitt.secret_key', 'test');
});

test('a remodel offer has to say how many days the work takes', function () {
    [$customer] = rmdUser();
    [, $tailorToken] = rmdTailor();
    $order = rmdOpenRemodel($customer);

    $this->withToken($tailorToken)
        ->postJson("/api/tailor/orders/{$order->id}/request", ['offered_price' => 100])
        ->assertStatus(422)
        ->assertJsonValidationErrors('ready_in_days');
});

test('accepting an offer asks for half the price plus delivery', function () {
    [$order, , $customerToken] = rmdAccepted();

    expect($order->payment_status)->toBe('unpaid')
        ->and($order->total)->toBe(115.0)
        ->and($order->deposit_amount)->toBe(65.0)
        ->and($order->amountDue('balance'))->toBe(50.0)
        ->and($order->turnaround_days)->toBe(5);

    $this->withToken($customerToken)->getJson('/api/customer/orders')
        ->assertJsonPath('orders.0.payment_due.stage', 'deposit')
        ->assertJsonPath('orders.0.payment_due.amount', 65);
});

test('the first payment is started for its own amount, under a reference that names it', function () {
    [$order, , $customerToken] = rmdAccepted();

    Http::fake(['*/checkout/token' => Http::response(['response' => ['response_status' => 'success', 'token' => 'tok']])]);

    $this->withToken($customerToken)->postJson("/api/orders/{$order->id}/pay")
        ->assertOk()
        ->assertJsonPath('stage', 'deposit')
        ->assertJsonPath('amount', 65);

    Http::assertSent(fn ($request) => $request['request']['amount'] === 6500
        && str_contains($request['request']['order_id'], '_d-'));
});

test('the same payment reported twice is credited once, quietly', function () {
    [$order] = rmdAccepted();
    $reference = (new FlittService)->newReference($order, 'deposit');
    $payload = rmdSigned(['order_id' => $reference, 'order_status' => 'approved', 'amount' => 6500, 'currency' => 'GEL', 'payment_id' => '77']);

    Log::spy();
    $this->postJson('/api/payments/flitt/callback', $payload)->assertOk();
    $this->postJson('/api/payments/flitt/callback', $payload)->assertOk();

    expect(OrderPayment::where('order_id', $order->id)->count())->toBe(1);
    Log::shouldNotHaveReceived('error');
});

test('the first payment books the courier and wakes the tailor', function () {
    [$order, , , $tailor] = rmdAccepted();
    [$admin] = rmdAdmin();

    rmdPaid($order, 'deposit');

    $order->refresh();
    expect($order->payment_status)->toBe('deposit_paid')
        ->and($order->deposit_paid_at)->not->toBeNull()
        ->and(OrderPayment::where('order_id', $order->id)->where('stage', 'deposit')->value('amount'))->toBe(65.0)
        ->and(KereNotification::where('user_id', $admin->id)->where('type', 'courier_pickup')->exists())->toBeTrue()
        ->and(KereNotification::where('user_id', $tailor->id)->where('type', 'new_order')->exists())->toBeTrue();
});

test('a first payment that lands late is never credited as the second', function () {
    [$order] = rmdAccepted();
    rmdPaid($order, 'deposit');
    $order->update(['status' => 'finished']);

    // The same amount again under a first-payment reference, after the first
    // half was already in: it must not settle the second half, and the money
    // taken twice is kept on record so an admin can refund it.
    [$admin] = rmdAdmin();
    Log::spy();
    rmdPaid($order->fresh(), 'deposit');

    expect($order->fresh()->payment_status)->toBe('deposit_paid')
        ->and($order->fresh()->paymentStageDue())->toBe('balance')
        ->and(OrderPayment::where('order_id', $order->id)->where('stage', 'deposit')->count())->toBe(2)
        ->and(KereNotification::where('user_id', $admin->id)->where('type', 'refund_due')->exists())->toBeTrue();
    Log::shouldHaveReceived('error')->withArgs(fn ($message) => str_contains($message, 'recorded for a refund'))->once();
});

test('the whole remodel runs through its steps in order', function () {
    [$order, , $customerToken, , $tailorToken] = rmdAccepted();
    [, $adminToken] = rmdAdmin();

    // Nothing can be collected or started before the first payment.
    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/picked-up")->assertStatus(409);
    rmdPaid($order, 'deposit');

    // Work cannot start before the garment has arrived and been photographed.
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'processing'])
        ->assertStatus(409)->assertJsonPath('code', 'garment_not_received');
    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/received", ['photos' => ['https://example.com/in.jpg']])
        ->assertStatus(409);

    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/picked-up")->assertOk();
    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/received", [
        'photos' => ['https://example.com/in.jpg'],
        'notes' => 'Small stain on the hem',
    ])->assertOk()->assertJsonPath('order.due_date', today()->addDays(5)->toDateString());

    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'processing'])->assertOk();

    // Finishing a remodel needs photos of the result.
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'finished'])
        ->assertStatus(422)->assertJsonPath('code', 'photos_required');
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", [
        'status' => 'finished',
        'photos' => ['https://example.com/out.jpg'],
    ])->assertOk();

    // It does not go back before the second half is paid.
    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/ship")->assertStatus(409);
    $this->withToken($customerToken)->getJson('/api/customer/orders')
        ->assertJsonPath('orders.0.payment_due.stage', 'balance')
        ->assertJsonPath('orders.0.payment_due.amount', 50)
        ->assertJsonPath('orders.0.intake_notes', 'Small stain on the hem')
        ->assertJsonPath('orders.0.finished_photos.0', 'https://example.com/out.jpg');

    rmdPaid($order->fresh(), 'balance');
    expect($order->fresh()->payment_status)->toBe('paid');

    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/ship")->assertOk();
    $this->withToken($adminToken)->patchJson("/api/admin/orders/{$order->id}/deliver")->assertOk();

    expect($order->fresh()->status)->toBe('delivered')
        ->and(OrderPayment::where('order_id', $order->id)->sum('amount'))->toEqual(115);
});

test('a later completion date takes effect only when the customer agrees', function () {
    [$order, , $customerToken, , $tailorToken] = rmdAccepted();
    $order->update(['payment_status' => 'deposit_paid', 'status' => 'processing', 'due_date' => today()->addDays(3)]);
    $later = today()->addDays(10)->toDateString();

    $this->withToken($tailorToken)->postJson("/api/tailor/orders/{$order->id}/due-date", ['due_date' => $later])->assertOk();
    expect($order->fresh()->due_date->toDateString())->toBe(today()->addDays(3)->toDateString());

    $this->withToken($customerToken)->postJson("/api/customer/orders/{$order->id}/due-date", ['accept' => true])->assertOk();
    expect($order->fresh()->due_date->toDateString())->toBe($later)
        ->and($order->fresh()->proposed_due_date)->toBeNull();
});

test('a remodel settled offline before the change keeps its old steps', function () {
    [$customer] = rmdUser();
    [$tailor, $tailorToken] = rmdTailor();
    $order = rmdOpenRemodel($customer);
    $order->update(['tailor_id' => $tailor->id, 'status' => 'pending']);

    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'processing'])->assertOk();
    $this->withToken($tailorToken)->patchJson("/api/tailor/orders/{$order->id}/status", ['status' => 'finished'])->assertOk();
});
