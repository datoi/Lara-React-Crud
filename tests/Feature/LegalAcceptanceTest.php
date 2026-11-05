<?php

use App\Models\LegalAcceptance;
use App\Models\Order;
use App\Models\Product;
use App\Models\TailorRequest;
use App\Models\User;
use App\Models\Verification;
use App\Support\LegalDocuments;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Proof of what each person agreed to: which document, which version and its
 * exact text, when, from where and in which language. Terms that change are
 * agreed to again before a customer can order under them.
 */
function legalUser(array $attributes = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $token),
    ], $attributes));

    return [$user, $token];
}

/** A customer who finished registering before acceptances were recorded, as every account on the live site did. */
function legalLegacyCustomer(): array
{
    [$user, $token] = legalUser(['terms_accepted_at' => null]);
    $user->forceFill(['terms_accepted_at' => now()->subMonths(3)])->save();

    return [$user, $token];
}

function legalCurrent(): array
{
    return ['terms' => LegalDocuments::version('terms'), 'privacy' => LegalDocuments::version('privacy')];
}

beforeEach(fn () => Mail::fake());

// ─── At registration ──────────────────────────────────────────────────────────

test('finishing registration records each box, its version and exact text, and where it was ticked', function () {
    [$user, $token] = legalUser(['terms_accepted_at' => null]);

    $this->withToken($token)->withHeader('User-Agent', 'KereTest/1.0')->postJson('/api/register/profile', [
        'date_of_birth' => now()->subYears(30)->toDateString(),
        'accept_terms' => true,
        'accept_privacy' => true,
        'marketing_opt_in' => false,
        'locale' => 'en',
    ])->assertOk();

    $rows = LegalAcceptance::where('user_id', $user->id)->get()->keyBy('document');

    expect($rows->keys()->sort()->values()->all())->toBe(['marketing', 'privacy', 'terms'])
        ->and($rows['terms']->version)->toBe(LegalDocuments::version('terms'))
        ->and($rows['privacy']->version)->toBe(LegalDocuments::version('privacy'))
        ->and($rows['terms']->accepted)->toBeTrue()
        ->and($rows['marketing']->accepted)->toBeFalse()
        ->and($rows['marketing']->version)->toBeNull()
        ->and($rows['terms']->context)->toBe('registration')
        ->and($rows['terms']->locale)->toBe('en')
        ->and($rows['terms']->ip_address)->toBe('127.0.0.1')
        ->and($rows['terms']->user_agent)->toBe('KereTest/1.0');

    $text = str_replace("\r\n", "\n", file_get_contents(resource_path('js/data/termsOfService.ts')));
    $kept = $rows['terms']->documentVersion;

    expect($kept->content)->toBe($text)
        ->and($kept->sha256)->toBe(hash('sha256', $text));
});

test('a tailor\'s three boxes are recorded as of the moment they were ticked', function () {
    $this->travelTo(now()->startOfMinute());
    $tickedAt = now()->toIso8601String();

    $this->postJson('/api/register/initiate', tailorPayload(['locale' => 'ka']))->assertOk();
    $record = Verification::where('phone', '+995555100200')->firstOrFail();

    $this->travel(10)->minutes();
    $this->postJson('/api/register/verify-phone', ['verification_id' => $record->id, 'code' => $record->otp_phone])->assertCreated();

    $tailor = User::where('phone', '+995555100200')->firstOrFail();
    $rows = LegalAcceptance::where('user_id', $tailor->id)->get()->keyBy('document');

    expect($rows->keys()->sort()->values()->all())->toBe(['information_correct', 'partnership_terms', 'privacy'])
        ->and($rows['privacy']->version)->toBe(LegalDocuments::version('privacy'))
        // No partnership terms are published yet, so that box names no version.
        ->and($rows['partnership_terms']->version)->toBeNull()
        ->and($rows['privacy']->accepted_at->toIso8601String())->toBe($tickedAt)
        ->and($rows['privacy']->locale)->toBe('ka')
        ->and(LegalDocuments::pendingFor($tailor))->toBe([]);
});

// ─── When a document changes ──────────────────────────────────────────────────

test('an account from before the record accepts the current terms before it can order', function () {
    [$user, $token] = legalLegacyCustomer();

    $this->withToken($token)->getJson('/api/me')->assertOk()
        ->assertJsonPath('user.may_place_orders', false)
        ->assertJsonPath('user.legal_pending', [
            ['document' => 'terms', 'version' => LegalDocuments::version('terms')],
            ['document' => 'privacy', 'version' => LegalDocuments::version('privacy')],
        ]);

    $this->withToken($token)->postJson('/api/orders', ['order_type' => 'marketplace'])
        ->assertForbidden()->assertJsonPath('code', 'legal_acceptance_required');

    $this->withToken($token)->postJson('/api/legal/accept', ['documents' => legalCurrent(), 'locale' => 'ka'])
        ->assertOk()->assertJsonPath('legal_pending', [])->assertJsonPath('may_place_orders', true);

    expect(LegalAcceptance::where('user_id', $user->id)->where('context', 'update')->count())->toBe(2);
});

test('agreeing to an older version is not agreeing to the current one', function () {
    [$user, $token] = legalLegacyCustomer();

    foreach (['terms', 'privacy'] as $document) {
        LegalAcceptance::create([
            'user_id' => $user->id, 'document' => $document, 'version' => '0.9',
            'accepted' => true, 'context' => 'registration', 'accepted_at' => now()->subMonths(3),
        ]);
    }

    $this->withToken($token)->getJson('/api/me')
        ->assertJsonCount(2, 'user.legal_pending');
});

test('an answer to a version replaced since is refused, and nothing is recorded', function () {
    [$user, $token] = legalLegacyCustomer();

    $this->withToken($token)->postJson('/api/legal/accept', ['documents' => ['terms' => '0.9', 'privacy' => LegalDocuments::version('privacy')]])
        ->assertStatus(409)->assertJsonPath('code', 'legal_version_changed');

    expect(LegalAcceptance::where('user_id', $user->id)->count())->toBe(0);
});

test('only the documents a role is asked to accept can be accepted', function () {
    [, $customerToken] = legalLegacyCustomer();
    [, $tailorToken] = legalUser(['role' => 'tailor', 'approval_status' => 'approved']);
    [, $adminToken] = legalUser(['role' => 'admin']);

    $this->withToken($customerToken)->postJson('/api/legal/accept', ['documents' => ['marketing' => '1']])
        ->assertStatus(422)->assertJsonValidationErrors(['documents']);
    $this->withToken($tailorToken)->postJson('/api/legal/accept', ['documents' => ['terms' => LegalDocuments::version('terms')]])
        ->assertStatus(422);
    $this->withToken($adminToken)->postJson('/api/legal/accept', ['documents' => ['privacy' => LegalDocuments::version('privacy')]])
        ->assertStatus(422);

    $this->withToken($tailorToken)->getJson('/api/me')
        ->assertJsonPath('user.legal_pending', [['document' => 'privacy', 'version' => LegalDocuments::version('privacy')]]);
    $this->withToken($tailorToken)->postJson('/api/legal/accept', ['documents' => ['privacy' => LegalDocuments::version('privacy')]])
        ->assertOk()->assertJsonPath('legal_pending', []);
});

test('someone still signing up, and an admin, are not asked', function () {
    [, $signingUpToken] = legalUser(['terms_accepted_at' => null]);
    [, $adminToken] = legalUser(['role' => 'admin']);

    $this->withToken($signingUpToken)->getJson('/api/me')->assertJsonPath('user.legal_pending', []);
    $this->withToken($adminToken)->getJson('/api/me')->assertJsonPath('user.legal_pending', []);
});

// ─── Orders ───────────────────────────────────────────────────────────────────

test('an order names the terms it was placed under', function () {
    [$tailor] = legalUser(['role' => 'tailor', 'approval_status' => 'approved']);
    [, $token] = legalUser();
    $categoryId = DB::table('categories')->insertGetId(['name' => 'Dresses', 'slug' => 'dresses-'.Str::random(6), 'created_at' => now(), 'updated_at' => now()]);
    $product = Product::create([
        'category_id' => $categoryId, 'tailor_id' => $tailor->id, 'name' => 'Linen Dress',
        'slug' => 'linen-dress-'.Str::random(6), 'price' => 150, 'stock' => 5, 'status' => 'active',
        'is_customizable' => false, 'sizes' => [], 'images' => ['https://example.com/dress.jpg'],
    ]);

    $this->withToken($token)->postJson('/api/orders', ['order_type' => 'marketplace', 'product_id' => $product->id, 'quantity' => 1])
        ->assertCreated();

    $order = Order::latest('id')->firstOrFail();

    expect($order->termsVersion->document)->toBe('terms')
        ->and($order->termsVersion->version)->toBe(LegalDocuments::version('terms'));
});

test('accepting Kere\'s offer waits on the current terms, and then records them', function () {
    [$customer, $token] = legalLegacyCustomer();
    [$tailor] = legalUser(['role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true]);
    $order = Order::create([
        'user_id' => $customer->id, 'order_number' => 'RMD-'.Str::upper(Str::random(8)), 'order_type' => 'remodel',
        'payment_status' => 'not_required', 'tailor_assignment_mode' => 'manual', 'status' => 'pending_assignment',
        'subtotal' => 0, 'shipping' => 15, 'total' => 15,
        'first_name' => 'Nino', 'last_name' => '', 'email' => $customer->email, 'phone' => '+995555000111',
        'address' => 'Rustaveli 1', 'city' => 'Tbilisi', 'zip' => '', 'country' => 'GE',
    ]);
    $estimate = TailorRequest::create(['order_id' => $order->id, 'tailor_id' => $tailor->id, 'offered_price' => 80, 'ready_in_days' => 4, 'status' => 'pending']);
    $order->update(['offer_request_id' => $estimate->id, 'offer_price' => 100, 'offer_days' => 6, 'offer_sent_at' => now()]);
    $sentAt = $order->fresh()->offer_sent_at->toISOString();

    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/accept-offer", ['sent_at' => $sentAt])
        ->assertForbidden()->assertJsonPath('code', 'legal_acceptance_required');
    expect($order->fresh()->status)->toBe('pending_assignment');

    $this->withToken($token)->postJson('/api/legal/accept', ['documents' => legalCurrent()])->assertOk();
    $this->withToken($token)->postJson("/api/customer/orders/{$order->id}/accept-offer", ['sent_at' => $sentAt])->assertOk();

    expect($order->fresh()->termsVersion->version)->toBe(LegalDocuments::version('terms'));
});

// ─── The record itself ────────────────────────────────────────────────────────

test('the record cannot be rewritten, deleted, or lost with the account', function () {
    [$user] = legalUser();
    $row = LegalAcceptance::where('user_id', $user->id)->firstOrFail();

    expect(fn () => $row->update(['version' => '9.9']))->toThrow(LogicException::class)
        ->and(fn () => $row->delete())->toThrow(LogicException::class)
        // In a savepoint: on PostgreSQL a refused statement aborts the transaction around it.
        ->and(fn () => DB::transaction(fn () => $user->delete()))->toThrow(QueryException::class)
        ->and(LegalAcceptance::where('user_id', $user->id)->where('version', '9.9')->exists())->toBeFalse()
        ->and(LegalAcceptance::where('user_id', $user->id)->count())->toBe(2)
        ->and(User::find($user->id))->not->toBeNull();
});
