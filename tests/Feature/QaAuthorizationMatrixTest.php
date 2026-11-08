<?php

use App\Models\Category;
use App\Models\KereNotification;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Pre-launch security QA (2026-11-08): who can reach which /api route.
 *
 * Each protected route is called as a guest, a customer, an approved tailor, a
 * pending tailor, a rejected tailor and an admin. A role the route is meant for
 * must get past authorisation (anything but 401/403); every other role must be
 * stopped (401 for a guest, 401/403/404 for a signed-in user of the wrong kind).
 *
 * Routes whose current behaviour lets a role through that should not be let
 * through are NOT in this matrix: they are proved separately in
 * QaSecurityFindingsTest so this file stays green and the findings stay named.
 */
const QASEC_ROLES = ['customer', 'tailor', 'pending_tailor', 'rejected_tailor', 'admin'];

function qasecActor(string $kind): array
{
    $token = Str::random(60);
    $attributes = match ($kind) {
        'customer' => ['role' => 'customer', 'terms_accepted_at' => now()],
        'tailor' => ['role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true],
        'pending_tailor' => ['role' => 'tailor', 'approval_status' => 'pending', 'does_remodeling' => true],
        'rejected_tailor' => ['role' => 'tailor', 'approval_status' => 'rejected', 'does_remodeling' => true],
        'admin' => ['role' => 'admin'],
        'suspended_customer' => ['role' => 'customer', 'terms_accepted_at' => now(), 'is_suspended' => true],
        'suspended_tailor' => ['role' => 'tailor', 'approval_status' => 'approved', 'is_suspended' => true],
    };

    $user = User::factory()->create(array_merge($attributes, [
        'api_token' => hash('sha256', $token),
        'phone' => '+9955'.random_int(10000000, 99999999),
    ]));

    return [$user, $token];
}

beforeEach(function () {
    Http::preventStrayRequests();
    Http::fake();
    Mail::fake();
});

$all = QASEC_ROLES;
$customer = ['customer'];
$approvedTailor = ['tailor'];
$anyTailor = ['tailor', 'pending_tailor', 'rejected_tailor'];
$customerOrTailor = ['customer', 'tailor', 'pending_tailor', 'rejected_tailor'];
$admin = ['admin'];

// [method, uri, roles allowed past authorisation]
dataset('qasec_protected_routes', [
    'GET me' => ['GET', '/api/me', $all],
    'GET customer orders' => ['GET', '/api/customer/orders', $customer],
    'GET review-status' => ['GET', '/api/customer/orders/999999/review-status', $customer],
    'GET wishlist' => ['GET', '/api/wishlist', $customer],
    'GET customer measurements' => ['GET', '/api/customer/measurements', $customer],
    'GET notifications' => ['GET', '/api/notifications', $all],
    'POST notifications read-all' => ['POST', '/api/notifications/read-all', $all],
    'PATCH notification read' => ['PATCH', '/api/notifications/999999/read', $all],
    'DELETE notification' => ['DELETE', '/api/notifications/999999', $all],
    'DELETE notifications' => ['DELETE', '/api/notifications', $all],
    'GET tailor orders' => ['GET', '/api/tailor/orders', $approvedTailor],
    'GET tailor open-orders' => ['GET', '/api/tailor/open-orders', $approvedTailor],
    'GET tailor stats' => ['GET', '/api/tailor/stats', $anyTailor],
    'GET tailor products' => ['GET', '/api/tailor/products', $anyTailor],
    'GET order messages' => ['GET', '/api/orders/999999/messages', []],
    'GET message counts' => ['GET', '/api/messages/counts', $all],
    'POST pay' => ['POST', '/api/orders/999999/pay', $customer],
    'POST verify-payment' => ['POST', '/api/orders/999999/verify-payment', $customer],
    'POST uploads' => ['POST', '/api/uploads', $customer],
    'POST register profile' => ['POST', '/api/register/profile', []],
    'POST guardian resend' => ['POST', '/api/register/guardian-consent/resend', []],
    'POST legal accept' => ['POST', '/api/legal/accept', $customerOrTailor],
    'PATCH me password' => ['PATCH', '/api/me/password', $customerOrTailor],
    'POST orders' => ['POST', '/api/orders', $customer],
    'POST accept-offer' => ['POST', '/api/customer/orders/999999/accept-offer', $customer],
    'POST decline-offer' => ['POST', '/api/customer/orders/999999/decline-offer', $customer],
    'POST cancel' => ['POST', '/api/customer/orders/999999/cancel', $customer],
    'POST due-date answer' => ['POST', '/api/customer/orders/999999/due-date', $customer],
    'POST claims' => ['POST', '/api/customer/orders/999999/claims', $customer],
    'POST reviews' => ['POST', '/api/reviews', $customer],
    'POST wishlist' => ['POST', '/api/wishlist/999999', $customer],
    'DELETE wishlist' => ['DELETE', '/api/wishlist/999999', $customer],
    'PUT customer measurements' => ['PUT', '/api/customer/measurements', $customer],
    'PATCH tailor status' => ['PATCH', '/api/tailor/orders/999999/status', $approvedTailor],
    'POST tailor estimate' => ['POST', '/api/tailor/orders/999999/request', $approvedTailor],
    'POST tailor received' => ['POST', '/api/tailor/orders/999999/received', $approvedTailor],
    'POST tailor due-date' => ['POST', '/api/tailor/orders/999999/due-date', $approvedTailor],
    'PATCH tailor profile' => ['PATCH', '/api/tailor/profile', $approvedTailor],
    'POST support email' => ['POST', '/api/support-email', $all],
    'POST tailor id-document' => ['POST', '/api/tailor/id-document', $anyTailor],
    'POST order message' => ['POST', '/api/orders/999999/messages', []],
    'GET saved designs' => ['GET', '/api/customizer/designs', $customer],
    'POST saved design' => ['POST', '/api/customizer/designs', $customer],
    'GET saved design' => ['GET', '/api/customizer/designs/999999', $customer],
    'PUT saved design' => ['PUT', '/api/customizer/designs/999999', $customer],
    'DELETE saved design' => ['DELETE', '/api/customizer/designs/999999', $customer],
    'GET admin orders' => ['GET', '/api/admin/orders', $admin],
    'GET admin order messages' => ['GET', '/api/admin/orders/999999/messages?channel=customer', $admin],
    'POST admin order message' => ['POST', '/api/admin/orders/999999/messages', $admin],
    'POST admin offer' => ['POST', '/api/admin/orders/999999/offer', $admin],
    'POST admin note' => ['POST', '/api/admin/orders/999999/notes', $admin],
    'GET admin users' => ['GET', '/api/admin/users', $admin],
    'PATCH admin assign' => ['PATCH', '/api/admin/orders/999999/assign', $admin],
    'PATCH admin deliver' => ['PATCH', '/api/admin/orders/999999/deliver', $admin],
    'PATCH admin picked-up' => ['PATCH', '/api/admin/orders/999999/picked-up', $admin],
    'PATCH admin ship' => ['PATCH', '/api/admin/orders/999999/ship', $admin],
    'POST admin refund' => ['POST', '/api/admin/orders/999999/refund', $admin],
    'GET admin claims' => ['GET', '/api/admin/claims', $admin],
    'PATCH admin claim' => ['PATCH', '/api/admin/claims/999999', $admin],
    'GET admin reviews' => ['GET', '/api/admin/reviews', $admin],
    'PATCH admin review' => ['PATCH', '/api/admin/reviews/999999', $admin],
    'PATCH admin suspend' => ['PATCH', '/api/admin/users/999999/suspend', $admin],
    'GET admin pending tailors' => ['GET', '/api/admin/tailors/pending', $admin],
    'POST admin approve' => ['POST', '/api/admin/tailors/999999/approve', $admin],
    'POST admin reject' => ['POST', '/api/admin/tailors/999999/reject', $admin],
    'GET admin customizer products' => ['GET', '/api/admin/customizer/products', $admin],
    'POST admin customizer product' => ['POST', '/api/admin/customizer/products', $admin],
    'PUT admin customizer product' => ['PUT', '/api/admin/customizer/products/999999', $admin],
    'DELETE admin customizer product' => ['DELETE', '/api/admin/customizer/products/999999', $admin],
    'POST admin customizer category' => ['POST', '/api/admin/customizer/categories', $admin],
    'PUT admin customizer category' => ['PUT', '/api/admin/customizer/categories/999999', $admin],
    'PUT admin category reorder' => ['PUT', '/api/admin/customizer/categories/999999/options/reorder', $admin],
    'DELETE admin customizer category' => ['DELETE', '/api/admin/customizer/categories/999999', $admin],
    'POST admin customizer option' => ['POST', '/api/admin/customizer/options', $admin],
    'PUT admin customizer option' => ['PUT', '/api/admin/customizer/options/999999', $admin],
    'DELETE admin customizer option' => ['DELETE', '/api/admin/customizer/options/999999', $admin],
    'PUT admin option children reorder' => ['PUT', '/api/admin/customizer/options/999999/children/reorder', $admin],
    'POST admin option colour' => ['POST', '/api/admin/customizer/options/999999/colors', $admin],
    'PUT admin option colours reorder' => ['PUT', '/api/admin/customizer/options/999999/colors/reorder', $admin],
    'PUT admin option colour' => ['PUT', '/api/admin/customizer/options/colors/999999', $admin],
    'DELETE admin option colour' => ['DELETE', '/api/admin/customizer/options/colors/999999', $admin],
    'GET admin fabrics' => ['GET', '/api/admin/customizer/fabrics', $admin],
    'POST admin fabric' => ['POST', '/api/admin/customizer/fabrics', $admin],
    'PUT admin fabric' => ['PUT', '/api/admin/customizer/fabrics/999999', $admin],
    'DELETE admin fabric' => ['DELETE', '/api/admin/customizer/fabrics/999999', $admin],
]);

it('refuses a guest on every protected route with 401', function (string $method, string $uri) {
    $this->json($method, $uri)->assertStatus(401);
})->with('qasec_protected_routes');

it('refuses a bad or suspended token on every protected route', function (string $method, string $uri) {
    $this->withToken('not-a-real-token')->json($method, $uri)->assertStatus(401);

    [, $suspended] = qasecActor('suspended_customer');
    $this->withToken($suspended)->json($method, $uri)->assertStatus(403);
})->with('qasec_protected_routes');

it('lets each role through only the routes meant for it', function (string $method, string $uri, array $allowed) {
    foreach (QASEC_ROLES as $role) {
        [, $token] = qasecActor($role);
        $status = $this->withToken($token)->json($method, $uri)->status();
        app('auth')->forgetGuards();

        if (in_array($role, $allowed, true)) {
            expect($status)->not->toBeIn([401, 403], "{$role} should reach {$method} {$uri} but got {$status}");
        } else {
            expect($status)->toBeIn([401, 403, 404, 409, 422], "{$role} should be stopped at {$method} {$uri} but got {$status}")
                ->and($status < 300)->toBeFalse();
        }
    }
})->with('qasec_protected_routes');

it('keeps the onboarding steps to customers who have not finished', function () {
    foreach (['tailor', 'pending_tailor', 'admin'] as $role) {
        [, $token] = qasecActor($role);
        $this->withToken($token)->postJson('/api/register/profile', [
            'date_of_birth' => '1990-01-01', 'accept_terms' => true, 'accept_privacy' => true,
        ])->assertStatus(403);
        $this->withToken($token)->postJson('/api/register/guardian-consent/resend')->assertStatus(422);
    }

    [, $done] = qasecActor('customer');
    $this->withToken($done)->postJson('/api/register/profile', [
        'date_of_birth' => '1990-01-01', 'accept_terms' => true, 'accept_privacy' => true,
    ])->assertStatus(409);
});

it('serves the public catalogue and auth endpoints without a token', function (string $method, string $uri) {
    $status = $this->json($method, $uri)->status();
    expect($status)->not->toBe(401)->not->toBe(403);
})->with([
    ['GET', '/api/products'],
    ['GET', '/api/categories'],
    ['GET', '/api/reviews/landing'],
    ['GET', '/api/platform/stats'],
    ['GET', '/api/customizer/products'],
    ['POST', '/api/register/availability'],
    ['POST', '/api/payments/flitt/callback'],
]);

it('never lets a tailor or admin buy, even with a valid order of their own shape', function () {
    $category = Category::create(['name' => 'Shirts', 'slug' => 'shirts']);
    [$maker] = qasecActor('tailor');
    $product = Product::create([
        'category_id' => $category->id, 'tailor_id' => $maker->id, 'name' => 'Linen shirt',
        'slug' => 'linen-'.Str::random(6), 'price' => 50, 'stock' => 5, 'is_customizable' => false,
    ]);

    foreach (['tailor', 'pending_tailor', 'admin'] as $role) {
        [, $token] = qasecActor($role);
        $this->withToken($token)->postJson('/api/orders', ['product_id' => $product->id, 'quantity' => 1])->assertStatus(403);
    }

    expect(Order::count())->toBe(0)->and($product->fresh()->stock)->toBe(5);
});

it('keeps a suspended tailor out of every tailor action', function () {
    [, $token] = qasecActor('suspended_tailor');

    $this->withToken($token)->getJson('/api/tailor/orders')->assertStatus(403);
    $this->withToken($token)->postJson('/api/tailor/products', ['name' => 'x', 'price' => 10, 'category_id' => 1])->assertStatus(403);
});

it('does not leak another user\'s notifications through the owner-scoped endpoints', function () {
    [$owner] = qasecActor('customer');
    [, $intruder] = qasecActor('customer');
    $note = KereNotification::create(['user_id' => $owner->id, 'type' => 'order_status', 'title' => 't', 'body' => 'b', 'data' => [], 'is_read' => false]);

    $this->withToken($intruder)->patchJson("/api/notifications/{$note->id}/read")->assertOk();
    $this->withToken($intruder)->deleteJson("/api/notifications/{$note->id}")->assertOk();
    $this->withToken($intruder)->deleteJson('/api/notifications')->assertOk();
    $list = $this->withToken($intruder)->getJson('/api/notifications')->assertOk()->json('notifications');

    expect($note->fresh())->not->toBeNull()
        ->and($note->fresh()->is_read)->toBeFalse()
        ->and($list)->toBe([]);
});
