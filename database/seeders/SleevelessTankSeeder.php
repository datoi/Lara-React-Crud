<?php

namespace Database\Seeders;

use App\Models\CustomizerProduct;
use App\Models\LayerCategory;
use App\Models\LayerOption;
use Illuminate\Database\Seeder;

class SleevelessTankSeeder extends Seeder
{
    public function run(): void
    {
        $product = CustomizerProduct::updateOrCreate(
            ['slug' => 'sleeveless-tank'],
            [
                'name' => 'Sleeveless Tank',
                'category' => 'shirt',
                'gender' => 'unisex',
                'description' => 'Classic sleeveless tank — pick your colour.',
                'base_price' => 90,
                'is_active' => true,
                'preview_image_path' => '/assets/garments/shirts/white-front.png',
            ],
        );

        // Colours used to be a separate layer category; they now live on the style
        LayerCategory::where('customizer_product_id', $product->id)
            ->where('slug', 'color')
            ->get()
            ->each(function (LayerCategory $legacy) {
                $legacy->allOptions()->delete();
                $legacy->delete();
            });

        $styleCategory = LayerCategory::updateOrCreate(
            ['customizer_product_id' => $product->id, 'slug' => 'style'],
            [
                'name' => 'Style your own',
                'children_label' => null,
                'z_index' => 1,
                'is_required' => true,
                'is_colorable' => false,
                'is_preview_layer' => true,
                'display_order' => 0,
            ],
        );

        $style = LayerOption::updateOrCreate(
            ['layer_category_id' => $styleCategory->id, 'slug' => 'sleeveless'],
            [
                'parent_option_id' => null,
                'name' => 'Sleeveless',
                'image_path' => '/assets/garments/shirts/white-front.png',
                'thumbnail_path' => '/assets/garments/shirts/white-front.png',
                'back_image_path' => null,
                'left_image_path' => null,
                'right_image_path' => null,
                'color_hex' => null,
                'price_modifier' => 0,
                'is_default' => true,
                'is_active' => true,
                'display_order' => 0,
            ],
        );

        $colors = [
            ['name' => 'White',      'slug' => 'white',      'hex' => '#f4f4f2', 'default' => true,  'views' => true],
            ['name' => 'Black',      'slug' => 'black',      'hex' => '#202020', 'default' => false, 'views' => false],
            ['name' => 'Grey',       'slug' => 'grey',       'hex' => '#a9adb2', 'default' => false, 'views' => false],
            ['name' => 'Navy',       'slug' => 'navy',       'hex' => '#2a3245', 'default' => false, 'views' => false],
            ['name' => 'Light Blue', 'slug' => 'light-blue', 'hex' => '#d8e1ea', 'default' => false, 'views' => false],
            ['name' => 'Olive',      'slug' => 'olive',      'hex' => '#565a33', 'default' => false, 'views' => false],
            ['name' => 'Beige',      'slug' => 'beige',      'hex' => '#eadfc8', 'default' => false, 'views' => false],
            ['name' => 'Tan',        'slug' => 'tan',        'hex' => '#c9b9a0', 'default' => false, 'views' => false],
            ['name' => 'Brown',      'slug' => 'brown',      'hex' => '#5f4a36', 'default' => false, 'views' => false],
        ];

        foreach ($colors as $index => $color) {
            $style->colors()->updateOrCreate(
                ['name' => $color['name']],
                [
                    'color_hex' => $color['hex'],
                    'image_path' => "/assets/garments/shirts/{$color['slug']}-front.png",
                    'back_image_path' => $color['views'] ? "/assets/garments/shirts/{$color['slug']}-back.png" : null,
                    'left_image_path' => $color['views'] ? "/assets/garments/shirts/{$color['slug']}-left.png" : null,
                    'right_image_path' => $color['views'] ? "/assets/garments/shirts/{$color['slug']}-right.png" : null,
                    'is_default' => $color['default'],
                    'display_order' => $index,
                ],
            );
        }
    }
}
