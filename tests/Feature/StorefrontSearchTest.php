<?php

use App\Models\Category;
use App\Models\Product;

it('matches a category without bypassing the other catalog filters', function () {
    $category = Category::create(['name' => 'Test Tailoring', 'slug' => 'test-tailoring']);
    $matching = Product::create(['category_id' => $category->id, 'name' => 'Test Jacket', 'slug' => 'test-jacket', 'price' => 120, 'gender' => 'women', 'stock' => 1]);
    Product::create(['category_id' => $category->id, 'name' => 'Other Jacket', 'slug' => 'other-jacket', 'price' => 350, 'gender' => 'women', 'stock' => 1]);
    Product::create(['category_id' => $category->id, 'name' => 'Test Coat', 'slug' => 'test-coat', 'price' => 120, 'gender' => 'men', 'stock' => 1]);

    $this->getJson('/api/products?search=tailoring&gender=women&max_price=200')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.id', $matching->id);
});

it('optionally filters the catalogue to customizable products', function () {
    $category = Category::create(['name' => 'Custom Test', 'slug' => 'custom-test']);
    $custom = Product::create(['category_id' => $category->id, 'name' => 'Custom Shirt', 'slug' => 'custom-shirt-test', 'price' => 100, 'gender' => 'women', 'stock' => 1, 'is_customizable' => true]);
    Product::create(['category_id' => $category->id, 'name' => 'Ready Shirt', 'slug' => 'ready-shirt-test', 'price' => 100, 'gender' => 'women', 'stock' => 1, 'is_customizable' => false]);
    $this->getJson('/api/products?category=custom-test')->assertOk()->assertJsonPath('total', 2);
    $this->getJson('/api/products?category=custom-test&customizable=1')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $custom->id);
});
