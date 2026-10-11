<?php

use Database\Seeders\MensGarmentsSeeder;

/**
 * The design studio waits for the section's list before it shows any heading,
 * so the list carries what a garment tile needs and nothing more; a garment's
 * attributes arrive when that garment is opened.
 */
test('the studio list leaves each garment\'s attributes behind', function () {
    $this->seed(MensGarmentsSeeder::class);

    $products = $this->getJson('/api/customizer/products?gender=men')->assertOk()->json('products');

    expect($products)->not->toBeEmpty();
    foreach ($products as $product) {
        expect($product)->toHaveKeys(['id', 'name', 'slug', 'category', 'base_price', 'preview_image_url'])
            ->not->toHaveKey('layer_categories');
    }

    $this->getJson('/api/customizer/products/'.$products[0]['slug'])
        ->assertOk()
        ->assertJsonStructure(['product', 'layer_categories']);
});
