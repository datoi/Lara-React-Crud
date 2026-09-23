<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;

/**
 * The catalogue is public and every product carries its tailor, so whatever the
 * tailor relation serializes is published to anyone who can reach /api/products.
 *
 * Registration now collects a phone number, a workspace address, a date of birth
 * and — for a tailor who is a minor — a guardian's name and contact details.
 * None of it belongs to a shopper. `$hidden` is the wrong lock here: these are
 * fields the account's own screens legitimately read, so the catalogue selects
 * an allowlist instead, which also makes a column added later private by default.
 */
function tailorWithFullRegistration(): User
{
    return User::factory()->create([
        'role'                  => 'tailor',
        'approval_status'       => 'approved',
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
    'private-tailor@example.com',
    '+995555100999',
    '12 Private Workshop Lane, Tbilisi',
    '1990-04-17',
    'Guardian Person',
    'guardian@example.com',
    '+995555100888',
];

it('does not publish a tailor\'s contact details on the public catalogue', function () use ($private) {
    $tailor = tailorWithFullRegistration();
    productFor($tailor);

    $body = $this->getJson('/api/products')->assertOk()->getContent();

    foreach ($private as $secret) {
        expect($body)->not->toContain($secret);
    }
});

it('does not publish them on a single product or its related products', function () use ($private) {
    $tailor = tailorWithFullRegistration();
    $product = productFor($tailor);

    $body = $this->getJson("/api/products/{$product->id}")->assertOk()->getContent();

    foreach ($private as $secret) {
        expect($body)->not->toContain($secret);
    }
});

it('does not publish them to a signed-in shopper reading their wishlist', function () use ($private) {
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

it('still carries the tailor fields the storefront renders', function () {
    $tailor = tailorWithFullRegistration();
    $tailor->update([
        'bio'              => 'Bespoke tailoring since 2011.',
        'specialty'        => 'Coats',
        'years_experience' => 12,
    ]);
    $product = productFor($tailor);

    $this->getJson("/api/products/{$product->id}")
        ->assertOk()
        ->assertJsonPath('product.tailor.id', $tailor->id)
        ->assertJsonPath('product.tailor.bio', 'Bespoke tailoring since 2011.')
        ->assertJsonPath('product.tailor.specialty', 'Coats')
        ->assertJsonPath('product.tailor.years_experience', 12)
        ->assertJsonPath('product.tailor_name', $tailor->getFullName());
});
