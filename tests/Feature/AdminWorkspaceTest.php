<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * What the admin workspace reads and writes beyond the order operations other
 * tests cover: internal notes on an order, the detail its order panel shows,
 * and the registration answers a tailor application is approved on.
 */
function workspaceUser(string $role = 'customer', array $attributes = []): array
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

function workspaceRemodel(User $customer): Order
{
    return Order::create([
        'user_id' => $customer->id,
        'order_number' => 'RMD-'.Str::upper(Str::random(8)),
        'order_type' => 'remodel',
        'status' => 'pending_assignment',
        'payment_status' => 'not_required',
        'subtotal' => 0, 'shipping' => 15, 'total' => 15,
        'needed_by' => now()->addDays(20)->toDateString(),
        'custom_design_data' => ['change_request' => 'Shorten the sleeves', 'remodel_images' => ['https://example.test/a.jpg']],
        'first_name' => 'Nino', 'last_name' => 'K', 'email' => $customer->email, 'phone' => '+995555000111',
        'address' => '12 Rustaveli Ave', 'city' => 'Tbilisi', 'zip' => '0108', 'country' => 'GE',
        'notes' => 'Please call before pickup',
    ]);
}

test('an admin keeps an internal note on an order, newest first, and only admins can', function () {
    [$admin, $adminToken] = workspaceUser('admin', ['first_name' => 'Ana', 'last_name' => 'Admin']);
    [$customer, $customerToken] = workspaceUser();
    [, $tailorToken] = workspaceUser('tailor');
    $order = workspaceRemodel($customer);

    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/notes", ['body' => 'Called the customer.'])
        ->assertCreated()
        ->assertJsonPath('note.body', 'Called the customer.')
        ->assertJsonPath('note.author', 'Ana Admin');
    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/notes", ['body' => '  Pickup booked for Monday.  '])
        ->assertCreated()
        ->assertJsonPath('note.body', 'Pickup booked for Monday.');

    $this->withToken($adminToken)->getJson('/api/admin/orders')
        ->assertOk()
        ->assertJsonPath('orders.0.admin_notes.0.body', 'Pickup booked for Monday.')
        ->assertJsonPath('orders.0.admin_notes.1.body', 'Called the customer.');

    $this->withToken($customerToken)->postJson("/api/admin/orders/{$order->id}/notes", ['body' => 'Sneaky'])->assertForbidden();
    $this->withToken($tailorToken)->postJson("/api/admin/orders/{$order->id}/notes", ['body' => 'Sneaky'])->assertForbidden();
    expect($order->adminNotes()->count())->toBe(2);

    // Customers never see Kere's notes on their own orders.
    $this->withToken($customerToken)->getJson('/api/customer/orders')
        ->assertOk()
        ->assertDontSee('Called the customer.')
        ->assertDontSee('Pickup booked');
});

test('a note must say something and stay short', function (string $body) {
    [, $adminToken] = workspaceUser('admin');
    [$customer] = workspaceUser();
    $order = workspaceRemodel($customer);

    $this->withToken($adminToken)->postJson("/api/admin/orders/{$order->id}/notes", ['body' => $body])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('body');
})->with(['empty' => '', 'too short' => 'ok', 'too long' => str_repeat('a', 501)]);

test('the order panel gets the remodel request, the return address and the customer note', function () {
    [, $adminToken] = workspaceUser('admin');
    [$customer] = workspaceUser('customer', ['phone' => '+995555222333']);
    $order = workspaceRemodel($customer);

    $this->withToken($adminToken)->getJson('/api/admin/orders')
        ->assertOk()
        ->assertJsonPath('orders.0.customer.phone', '+995555222333')
        ->assertJsonPath('orders.0.custom_design_data.change_request', 'Shorten the sleeves')
        ->assertJsonPath('orders.0.return_address.address', '12 Rustaveli Ave')
        ->assertJsonPath('orders.0.return_address.phone', '+995555000111')
        ->assertJsonPath('orders.0.needed_by', $order->needed_by->toDateString())
        ->assertJsonPath('orders.0.customer_note', 'Please call before pickup')
        ->assertJsonPath('orders.0.shipping', 15);
});

test('a tailor application shows its registration answers but never the national ID', function () {
    [, $adminToken] = workspaceUser('admin');
    workspaceUser('tailor', [
        'approval_status' => 'pending',
        'business_type' => 'atelier',
        'does_remodeling' => true,
        'workspace_address' => 'Vake, Tbilisi',
        'years_experience' => 5,
        'legal_status' => 'sole_trader',
        'national_id' => '01001012345',
    ]);

    $this->withToken($adminToken)->getJson('/api/admin/tailors/pending')
        ->assertOk()
        ->assertJsonPath('tailors.0.business_type', 'atelier')
        ->assertJsonPath('tailors.0.does_remodeling', true)
        ->assertJsonPath('tailors.0.workspace_address', 'Vake, Tbilisi')
        ->assertJsonPath('tailors.0.years_experience', 5)
        ->assertJsonPath('tailors.0.legal_status', 'sole_trader')
        ->assertDontSee('01001012345');
});
