<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;

/**
 * Kere sells every product itself and publishes nothing about the tailors who
 * make them: not their names, not their profiles, and certainly not what
 * registration collects — a phone number, a workspace address, a date of
 * birth, a guardian's details (terms §3, privacy policy §4.2). The catalogue
 * is public, so the only safe tailor field on a product is none at all; the
 * bare tailor_id is what the cart needs to split a bag into deliveries.
 */
function tailorWithFullRegistration(): User
{
    return User::factory()->create([
        'role'                  => 'tailor',
        'approval_status'       => 'approved',
        'name'                  => 'Nino Privatadze',
        'first_name'            => 'Nino',
        'last_name'             => 'Privatadze',
        'email'                 => 'private-tailor@example.com',
        'phone'                 => '+995555100999',
        'workspace_address'     => '12 Private Workshop Lane, Tbilisi',
        'legal_status'          => 'individual',
        'business_type'         => 'atelier',
        'date_of_birth'         => '1990-04-17',
        'guardian_name'         => 'Guardian Person',
        'guardian_email'        => 'guardian@example.com',
        'guardian_phone'        => '+995555100888',
        'guardian_relationship' => 'parent',
        'bio'                   => 'Bespoke tailoring since 2011.',
        'specialty'             => 'Coats',
    ]);
}

function productFor(User $tailor): Product
{
    $category = Category::firstOrCreate(
        ['slug' => 'privacy-test'],
        ['name' => 'Privacy Test'],
    );

    return Product::create([
        'category_id' => $category->id,
        'tailor_id'   => $tailor->id,
        'name'        => 'Privacy Test Coat',
        'slug'        => 'privacy-test-coat-' . $tailor->id,
        'price'       => 210,
        'gender'      => 'women',
        'stock'       => 1,
    ]);
}

$private = [
    'Privatadze',
    'Bespoke tailoring since 2011.',
    'private-tailor@example.com',
    '+995555100999',
    '12 Private Workshop Lane, Tbilisi',
    '1990-04-17',
    'Guardian Person',
    'guardian@example.com',
    '+995555100888',
];

it('publishes nothing about a product\'s tailor on the public catalogue', function () use ($private) {
    $tailor = tailorWithFullRegistration();
    productFor($tailor);

    $response = $this->getJson('/api/products')->assertOk();

    foreach ($private as $secret) {
        expect($response->getContent())->not->toContain($secret);
    }
    expect($response->json('data.0'))->not->toHaveKeys(['tailor', 'tailor_name']);
});

it('publishes nothing about it on a single product or its related products', function () use ($private) {
    $tailor = tailorWithFullRegistration();
    $product = productFor($tailor);

    $response = $this->getJson("/api/products/{$product->id}")->assertOk();

    foreach ($private as $secret) {
        expect($response->getContent())->not->toContain($secret);
    }
    expect($response->json('product'))->not->toHaveKeys(['tailor', 'tailor_name'])
        ->and($response->json('product.tailor_id'))->toBe($tailor->id);
});

it('publishes nothing about it to a signed-in shopper reading their wishlist', function () use ($private) {
    $tailor = tailorWithFullRegistration();
    $product = productFor($tailor);

    $raw = 'wishlist-privacy-token';
    $shopper = User::factory()->create([
        'role'      => 'customer',
        'api_token' => hash('sha256', $raw),
    ]);
    $shopper->wishlistProducts()->syncWithoutDetaching([$product->id]);

    $body = $this->withHeader('Authorization', "Bearer {$raw}")
        ->getJson('/api/wishlist')
        ->assertOk()
        ->getContent();

    foreach ($private as $secret) {
        expect($body)->not->toContain($secret);
    }
});

it('does not find products by the name of the tailor who makes them', function () {
    productFor(tailorWithFullRegistration());

    expect($this->getJson('/api/products?search=Privatadze')->assertOk()->json('data'))->toBe([])
        ->and($this->getJson('/api/products?search=Privacy')->json('data'))->toHaveCount(1);
});

it('has no public list or profile of tailors', function () {
    $tailor = tailorWithFullRegistration();

    // No API route answers these any more; the SPA's catch-all serves its
    // shell, which carries no data.
    foreach (['/api/tailors', "/api/tailors/{$tailor->id}"] as $url) {
        $response = $this->getJson($url);

        expect($response->headers->get('Content-Type'))->toContain('text/html')
            ->and($response->getContent())->not->toContain('Privatadze');
    }
});
