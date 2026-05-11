<?php

namespace Database\Seeders;

use App\Models\CustomizerProduct;
use App\Models\Fabric;
use App\Models\LayerCategory;
use App\Models\LayerOption;
use Illuminate\Database\Seeder;

class CustomizerSeeder extends Seeder
{
    private const BASE = '/assets/garments/';

    public function run(): void
    {
        $this->seedClassicShirt();
        $this->seedWomanShirt();
        $this->seedWomensTop();
    }

    private function seedClassicShirt(): void
    {
        CustomizerProduct::where('slug', 'classic-shirt')->delete();

        $product = CustomizerProduct::create([
            'name'        => 'Classic Shirt',
            'slug'        => 'classic-shirt',
            'category'    => 'shirt',
            'description' => 'A fully customisable dress shirt. Choose your collar style and fabric colour — each part is a real garment layer composited live in your browser.',
            'base_price'  => 89.00,
            'is_active'   => true,
        ]);

        // z=0 Body base
        $body = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Body',
            'slug'          => 'body',
            'z_index'       => 0,
            'is_required'   => true,
            'is_colorable'  => true,
            'display_order' => -1,
        ]);
        LayerOption::create([
            'layer_category_id' => $body->id,
            'name'           => 'Base',
            'slug'           => 'body-base',
            'image_path'     => self::BASE . 'maxi-base.png',
            'thumbnail_path' => self::BASE . 'maxi-base.png',
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);

        // z=1 Collar fabric
        $collar = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Collar',
            'slug'          => 'collar',
            'z_index'       => 1,
            'is_required'   => true,
            'is_colorable'  => true,
            'display_order' => 0,
        ]);
        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Classic Collar',
            'slug'           => 'classic-collar',
            'image_path'     => self::BASE . 'necklines_classic+number_1+button_close_standard (1).png',
            'thumbnail_path' => self::BASE . 'necklines_classic+number_1+button_close_standard (1).png',
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);
        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Stand-Up Collar',
            'slug'           => 'stand-up-collar',
            'image_path'     => self::BASE . 'necklines_stand_up_close_standard.png',
            'thumbnail_path' => self::BASE . 'necklines_stand_up_close_standard.png',
            'price_modifier' => 5,
            'is_default'     => false,
            'is_active'      => true,
            'display_order'  => 1,
        ]);

        // z=2 Collar buttons overlay
        $collarButtons = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Collar Buttons',
            'slug'          => 'collar-buttons',
            'z_index'       => 2,
            'is_required'   => true,
            'is_colorable'  => false,
            'display_order' => 1,
        ]);
        LayerOption::create([
            'layer_category_id' => $collarButtons->id,
            'name'           => 'Standard',
            'slug'           => 'collar-button-standard',
            'image_path'     => self::BASE . 'necklines_classic+number_1+button_close_standard.png',
            'thumbnail_path' => self::BASE . 'necklines_classic+number_1+button_close_standard.png',
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);

        // z=3 Sleeves fabric
        $sleeves = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Sleeves',
            'slug'          => 'sleeves',
            'z_index'       => 3,
            'is_required'   => true,
            'is_colorable'  => true,
            'display_order' => 2,
        ]);
        LayerOption::create([
            'layer_category_id' => $sleeves->id,
            'name'           => 'Long — Squared Cuffs',
            'slug'           => 'long-sleeves-squared-cuffs',
            'image_path'     => self::BASE . 'sleeves_long+cuffs_style_squared.png',
            'thumbnail_path' => self::BASE . 'sleeves_long+cuffs_style_squared.png',
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);

        // z=4 Cuff buttons overlay
        $cuffButtons = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Cuff Buttons',
            'slug'          => 'cuff-buttons',
            'z_index'       => 4,
            'is_required'   => true,
            'is_colorable'  => false,
            'display_order' => 3,
        ]);
        LayerOption::create([
            'layer_category_id' => $cuffButtons->id,
            'name'           => 'Pearl',
            'slug'           => 'cuff-button-pearl',
            'image_path'     => self::BASE . 'sleeves_long+cuffs_style_squared (1).png',
            'thumbnail_path' => self::BASE . 'sleeves_long+cuffs_style_squared (1).png',
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);

        // z=5 Body buttons overlay
        $bodyButtons = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Body Buttons',
            'slug'          => 'body-buttons',
            'z_index'       => 5,
            'is_required'   => true,
            'is_colorable'  => false,
            'display_order' => 4,
        ]);
        LayerOption::create([
            'layer_category_id' => $bodyButtons->id,
            'name'           => 'Standard',
            'slug'           => 'body-button-standard',
            'image_path'     => self::BASE . 'body+button_close_standard.png',
            'thumbnail_path' => self::BASE . 'body+button_close_standard.png',
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);

        foreach ([
            ['White',      '#FFFFFF', 0, 0],
            ['Light Blue', '#BFDBFE', 0, 1],
            ['Navy',       '#1E3A5F', 5, 2],
            ['Black',      '#1C1C1C', 5, 3],
            ['Blush Pink', '#FBCFE8', 0, 4],
            ['Sage Green', '#BBF7D0', 3, 5],
        ] as [$name, $hex, $price, $order]) {
            Fabric::create([
                'customizer_product_id' => $product->id,
                'name'           => $name,
                'color_hex'      => $hex,
                'price_modifier' => $price,
                'is_active'      => true,
                'display_order'  => $order,
            ]);
        }

        $this->command->info('Classic Shirt seeded.');
    }

    private function seedWomanShirt(): void
    {
        CustomizerProduct::where('slug', 'woman-shirt')->delete();

        $product = CustomizerProduct::create([
            'name'        => 'Woman Shirt',
            'slug'        => 'woman-shirt',
            'category'    => 'shirt',
            'description' => 'A customisable woman\'s shirt. Choose your sleeve length and collar style.',
            'base_price'  => 79.00,
            'is_active'   => true,
        ]);

        // z=1  Sleeves — full-product photo per sleeve style.
        //       thumbnail_path = same garment with Collar 1 (Colar1.jpg)
        //       alt_image_path = same garment with Collar 2 (colar 2.jpg)
        //       (Both collar variant images are fixed — taken independently of sleeve choice.)
        $sleeves = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Sleeves',
            'slug'          => 'sleeves',
            'z_index'       => 1,
            'is_required'   => true,
            'is_colorable'  => false,
            'display_order' => 0,
        ]);

        foreach ([
            ['Sleeveless',   'shirt-sleeveless',   'sleeveless.jpg',     true,  0],
            ['Short Sleeves','shirt-short-sleeves', 'short sleeeves.jpg', false, 1],
            ['Long Sleeves', 'shirt-long-sleeves',  'long sleeves.jpg',   false, 2],
        ] as [$name, $slug, $file, $default, $order]) {
            LayerOption::create([
                'layer_category_id' => $sleeves->id,
                'name'           => $name,
                'slug'           => $slug,
                'image_path'     => self::BASE . $file,
                'thumbnail_path' => self::BASE . 'Colar1.jpg',
                'alt_image_path' => self::BASE . 'colar 2.jpg',
                'price_modifier' => 0,
                'is_default'     => $default,
                'is_active'      => true,
                'display_order'  => $order,
            ]);
        }

        // z=0  Collar — pure UI selector, not rendered as its own canvas layer.
        //       display_order drives image selection: 0=standard, 1=alt1, 2=alt2.
        $collar = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Collar',
            'slug'          => 'collar',
            'z_index'       => 0,
            'is_required'   => true,
            'is_colorable'  => false,
            'display_order' => 1,
        ]);

        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Standard',
            'slug'           => 'standard-collar',
            'image_path'     => self::BASE . 'sleeveless.jpg',
            'thumbnail_path' => self::BASE . 'sleeveless.jpg',
            'display_scale'  => 1.00,
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);

        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Collar 1',
            'slug'           => 'collar-style-1',
            'image_path'     => self::BASE . 'Colar1.jpg',
            'thumbnail_path' => self::BASE . 'Colar1.jpg',
            'display_scale'  => 1.00,
            'price_modifier' => 5,
            'is_default'     => false,
            'is_active'      => true,
            'display_order'  => 1,
        ]);

        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Collar 2',
            'slug'           => 'collar-style-2',
            'image_path'     => self::BASE . 'colar 2.jpg',
            'thumbnail_path' => self::BASE . 'colar 2.jpg',
            'display_scale'  => 1.00,
            'price_modifier' => 5,
            'is_default'     => false,
            'is_active'      => true,
            'display_order'  => 2,
        ]);

        $this->command->info('Woman Shirt seeded.');
    }

    private function seedWomensTop(): void
    {
        CustomizerProduct::where('slug', 'womens-top')->delete();

        $product = CustomizerProduct::create([
            'name'        => "Woman's Top",
            'slug'        => 'womens-top',
            'category'    => 'womens-top',
            'description' => "A customisable woman's top (maika). Choose your sleeve length and collar style.",
            'base_price'  => 59.00,
            'is_active'   => true,
        ]);

        // z=1  Sleeves — full-product photo per sleeve style.
        //       thumbnail_path = same garment with Peter Pan collar (swapped in
        //       PreviewCanvas when the Collar category has 'peter-pan' selected).
        $sleeves = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Sleeves',
            'slug'          => 'sleeves',
            'z_index'       => 1,
            'is_required'   => true,
            'is_colorable'  => false,
            'display_order' => 0,
        ]);

        // image_path     = standard collar variant
        // thumbnail_path = peter pan collar variant
        // alt_image_path = mandarin collar variant
        foreach ([
            ['Sleeveless',   'maika-sleeveless',   'maika sleeveless.jpg',   'maika sleeveless peter pan.jpg',  'maika sleeveless mandarin collar.jpg',  true,  0],
            ['Short Sleeves','maika-short-sleeves', 'maika short sleeves.png','maika short sleevs peter pan.jpg','maika short sleeve mandarin collar.jpg', false, 1],
            ['Long Sleeves', 'maika-long-sleeves',  'maika longsleeves.jpg',  'maika long sleeves peter pan.jpg','maika long sleeves mandarin collar.jpg', false, 2],
        ] as [$name, $slug, $base, $peter, $mandarin, $default, $order]) {
            LayerOption::create([
                'layer_category_id' => $sleeves->id,
                'name'           => $name,
                'slug'           => $slug,
                'image_path'     => self::BASE . $base,
                'thumbnail_path' => self::BASE . $peter,
                'alt_image_path' => self::BASE . $mandarin,
                'price_modifier' => 0,
                'is_default'     => $default,
                'is_active'      => true,
                'display_order'  => $order,
            ]);
        }

        // z=0  Collar — pure UI selector (not rendered as its own canvas layer).
        //       PreviewCanvas checks this category's selection to decide whether
        //       to use image_url or thumbnail_url on the Sleeves layer above.
        $collar = LayerCategory::create([
            'customizer_product_id' => $product->id,
            'name'          => 'Collar',
            'slug'          => 'collar',
            'z_index'       => 0,
            'is_required'   => true,
            'is_colorable'  => false,
            'display_order' => 1,
        ]);

        // display_scale normalises zoom-level differences between photo batches.
        // Standard and Peter Pan shots are consistent (1.00).
        // Mandarin shots were taken closer to the garment, so scale them down (0.72).
        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Standard',
            'slug'           => 'standard-collar',
            'image_path'     => self::BASE . 'maika sleeveless.jpg',
            'thumbnail_path' => self::BASE . 'maika sleeveless.jpg',
            'display_scale'  => 1.00,
            'price_modifier' => 0,
            'is_default'     => true,
            'is_active'      => true,
            'display_order'  => 0,
        ]);

        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Peter Pan',
            'slug'           => 'peter-pan-collar',
            'image_path'     => self::BASE . 'maika sleeveless peter pan.jpg',
            'thumbnail_path' => self::BASE . 'maika sleeveless peter pan.jpg',
            'display_scale'  => 1.00,
            'price_modifier' => 5,
            'is_default'     => false,
            'is_active'      => true,
            'display_order'  => 1,
        ]);

        LayerOption::create([
            'layer_category_id' => $collar->id,
            'name'           => 'Mandarin',
            'slug'           => 'mandarin-collar',
            'image_path'     => self::BASE . 'maika sleeveless mandarin collar.jpg',
            'thumbnail_path' => self::BASE . 'maika sleeveless mandarin collar.jpg',
            'display_scale'  => 0.72,
            'price_modifier' => 5,
            'is_default'     => false,
            'is_active'      => true,
            'display_order'  => 2,
        ]);

        $this->command->info("Woman's Top seeded.");
    }
}
