<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * The ready-made shop is hidden while nothing is on sale and returns with the
 * first product (owner's decision, 2026-11-08). The page shell says which in
 * <meta name="kere-shop">, and the sitemap leaves /marketplace out.
 */
function shopProduct(?User $tailor): Product
{
    $category = Category::firstOrCreate(['slug' => 'shirts'], ['name' => 'Shirts']);

    return Product::create([
        'category_id' => $category->id, 'tailor_id' => $tailor?->id,
        'name' => 'Linen shirt', 'slug' => 'linen-'.Str::lower(Str::random(6)),
        'price' => 50, 'stock' => 5, 'colors' => [], 'sizes' => [],
    ]);
}

it('hides the shop while nothing is on sale', function () {
    $this->get('/')->assertOk()->assertSee('<meta name="kere-shop" content="closed">', false);
    $this->get('/sitemap.xml')->assertOk()->assertDontSee('/marketplace<', false);
});

it('hides the shop when the only products belong to a tailor who cannot take work', function () {
    shopProduct(User::factory()->create(['role' => 'tailor', 'approval_status' => 'approved', 'is_suspended' => true]));
    shopProduct(User::factory()->create(['role' => 'tailor', 'approval_status' => 'pending']));

    $this->get('/')->assertSee('<meta name="kere-shop" content="closed">', false);
});

it('shows the shop again with the first product on sale', function () {
    shopProduct(User::factory()->create(['role' => 'tailor', 'approval_status' => 'approved']));

    $this->get('/')->assertSee('<meta name="kere-shop" content="open">', false);
    $this->get('/marketplace')->assertSee('<meta name="kere-shop" content="open">', false);
    $this->get('/sitemap.xml')->assertSee('https://kereforyou.com/marketplace<', false);
});
