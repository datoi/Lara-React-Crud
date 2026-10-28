<?php

use App\Models\Category;
use App\Models\Product;

/**
 * The header's Marketplace menu reads /api/categories. On PostgreSQL a json
 * column has no `<>` operator, so comparing `images` with '[]' failed every
 * request there while SQLite answered; this runs on both.
 */
test('categories list their product count and a picture from a product that has one', function () {
    $dresses = Category::create(['name' => 'Dresses', 'slug' => 'dresses']);
    Category::create(['name' => 'Hats', 'slug' => 'hats']);
    Product::create(['category_id' => $dresses->id, 'name' => 'Bare', 'slug' => 'bare', 'price' => 50, 'images' => []]);
    Product::create(['category_id' => $dresses->id, 'name' => 'Shown', 'slug' => 'shown', 'price' => 60, 'images' => ['https://example.com/dress.jpg']]);

    $categories = collect($this->getJson('/api/categories')->assertOk()->json())->keyBy('slug');

    expect($categories['dresses']['products_count'])->toBe(2)
        ->and($categories['dresses']['sample_image'])->toBe('https://example.com/dress.jpg')
        ->and($categories['hats']['products_count'])->toBe(0)
        ->and($categories['hats']['sample_image'])->toBeNull();
});
