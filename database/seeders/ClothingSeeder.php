<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ClothingSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Dresses',  'slug' => 'dresses',  'description' => 'Elegant and casual dresses by local Georgian tailors'],
            ['name' => 'Shirts',   'slug' => 'shirts',   'description' => 'Custom shirts, blouses, and tops'],
            ['name' => 'Pants',    'slug' => 'pants',    'description' => 'Tailored trousers and wide-leg styles'],
            ['name' => 'Jackets',  'slug' => 'jackets',  'description' => 'Blazers, coats, and outerwear'],
            ['name' => 'Scarves',  'slug' => 'scarves',  'description' => 'Handcrafted scarves and wraps'],
            ['name' => 'Hats',     'slug' => 'hats',     'description' => 'Handmade hats and headwear'],
        ];

        foreach ($categories as $cat) {
            \App\Models\Category::create(array_merge($cat, ['image' => null]));
        }

        $cat = fn(string $slug) => \App\Models\Category::where('slug', $slug)->first();

        $colors = ['#1a1a1a', '#FFFFFF', '#D4A96A', '#8B6F47', '#C5B9A8', '#E8D5C4', '#2C3E50', '#7D6B5D'];
        $sizes  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

        $products = [
            // Dresses
            [
                'category_id' => $cat('dresses')->id,
                'name'        => 'Floral Wrap Dress',
                'slug'        => 'floral-wrap-dress',
                'description' => 'A flowing wrap dress in lightweight fabric with a beautiful floral print. Handmade by Tbilisi tailors.',
                'price'       => 180,
                'images'      => ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80'],
                'is_featured' => true,
            ],
            [
                'category_id' => $cat('dresses')->id,
                'name'        => 'Summer Maxi Dress',
                'slug'        => 'summer-maxi-dress',
                'description' => 'Elegant full-length summer dress in breathable linen. Perfect for Georgian summers.',
                'price'       => 210,
                'images'      => ['https://images.unsplash.com/photo-1566479179817-e0a0b22b5ef3?w=600&q=80'],
                'is_featured' => true,
            ],
            [
                'category_id' => $cat('dresses')->id,
                'name'        => 'A-Line Midi Dress',
                'slug'        => 'a-line-midi-dress',
                'description' => 'Classic A-line midi dress with a tailored waist. Versatile for any occasion.',
                'price'       => 160,
                'images'      => ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80'],
                'is_featured' => false,
            ],
            [
                'category_id' => $cat('dresses')->id,
                'name'        => 'Silk Evening Dress',
                'slug'        => 'silk-evening-dress',
                'description' => 'Luxurious silk evening dress with a structured bodice and flowing skirt.',
                'price'       => 320,
                'images'      => ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
                'is_featured' => true,
            ],
            // Shirts
            [
                'category_id' => $cat('shirts')->id,
                'name'        => 'Linen Button Shirt',
                'slug'        => 'linen-button-shirt',
                'description' => 'Premium linen button-up shirt, breathable and stylish. Made to your measurements.',
                'price'       => 120,
                'images'      => ['https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&q=80'],
                'is_featured' => true,
            ],
            [
                'category_id' => $cat('shirts')->id,
                'name'        => 'Silk Blouse',
                'slug'        => 'silk-blouse',
                'description' => 'Delicate silk blouse with hand-finished edges. Timeless Georgian craftsmanship.',
                'price'       => 150,
                'images'      => ['https://images.unsplash.com/photo-1598032895455-f6fc4c8db9e6?w=600&q=80'],
                'is_featured' => false,
            ],
            [
                'category_id' => $cat('shirts')->id,
                'name'        => 'Embroidered Folk Shirt',
                'slug'        => 'embroidered-folk-shirt',
                'description' => 'Traditional Georgian embroidery patterns on a modern relaxed-fit shirt.',
                'price'       => 140,
                'images'      => ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80'],
                'is_featured' => true,
            ],
            // Pants
            [
                'category_id' => $cat('pants')->id,
                'name'        => 'Wide Leg Linen Trousers',
                'slug'        => 'wide-leg-linen-trousers',
                'description' => 'Relaxed wide-leg trousers in natural linen. Tailored to your exact measurements.',
                'price'       => 130,
                'images'      => ['https://images.unsplash.com/photo-1594938298603-c8148c4b4d2f?w=600&q=80'],
                'is_featured' => true,
            ],
            [
                'category_id' => $cat('pants')->id,
                'name'        => 'Tailored Chinos',
                'slug'        => 'tailored-chinos',
                'description' => 'Sharp tailored chinos with a slim silhouette. Available in multiple colors.',
                'price'       => 115,
                'images'      => ['https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=600&q=80'],
                'is_featured' => false,
            ],
            // Jackets
            [
                'category_id' => $cat('jackets')->id,
                'name'        => 'Summer Linen Blazer',
                'slug'        => 'summer-linen-blazer',
                'description' => 'Lightweight linen blazer with a structured shoulder. Ideal for Georgian summers.',
                'price'       => 240,
                'images'      => ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80'],
                'is_featured' => true,
            ],
            [
                'category_id' => $cat('jackets')->id,
                'name'        => 'Wool Trench Coat',
                'slug'        => 'wool-trench-coat',
                'description' => 'Classic double-breasted wool trench coat. Warm, elegant, and fully customizable.',
                'price'       => 380,
                'images'      => ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80'],
                'is_featured' => true,
            ],
            // Scarves
            [
                'category_id' => $cat('scarves')->id,
                'name'        => 'Hand-Woven Silk Scarf',
                'slug'        => 'hand-woven-silk-scarf',
                'description' => 'Artisan hand-woven silk scarf with traditional Georgian motifs.',
                'price'       => 75,
                'images'      => ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80'],
                'is_featured' => false,
            ],
            // Hats
            [
                'category_id' => $cat('hats')->id,
                'name'        => 'Wool Felt Hat',
                'slug'        => 'wool-felt-hat',
                'description' => 'Handcrafted wool felt hat with a wide brim. Made in Tbilisi.',
                'price'       => 90,
                'images'      => ['https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80'],
                'is_featured' => false,
            ],
        ];

        foreach ($products as $prod) {
            \App\Models\Product::create(array_merge($prod, [
                'colors'          => $colors,
                'sizes'           => $sizes,
                'is_customizable' => true,
                'stock'           => 100,
            ]));
        }
    }
}
