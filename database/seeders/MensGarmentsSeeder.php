<?php

namespace Database\Seeders;

use App\Models\CustomizerProduct;
use App\Models\LayerCategory;
use App\Models\LayerOption;
use Illuminate\Database\Seeder;

/**
 * Men's-section customiser garments (shirts + trousers).
 *
 * Every product follows the Sleeveless Tank shape: a single "style" layer whose
 * colour variants each carry their own front photo. White is the only colour
 * shot from other angles; those view files are picked up automatically when they
 * exist on disk (see viewPath), so a garment with fewer white views needs no
 * special-casing. Add a product by calling seedColorGarment() with its folder
 * and the colour slugs it ships — no per-product boilerplate.
 */
class MensGarmentsSeeder extends Seeder
{
    /** slug => [display name, swatch hex] — shared across the whole men's line. */
    private const PALETTE = [
        'white'      => ['White',      '#f4f4f2'],
        'black'      => ['Black',      '#202020'],
        'charcoal'   => ['Charcoal',   '#3f4247'],
        'grey'       => ['Grey',       '#a9adb2'],
        'slate'      => ['Slate Blue', '#6f7f8a'],
        'navy'       => ['Navy',       '#2a3245'],
        'dark-blue'  => ['Dark Blue',  '#26324a'],
        'light-blue' => ['Light Blue', '#d8e1ea'],
        'olive'      => ['Olive',      '#565a33'],
        'khaki'      => ['Khaki',      '#b8a074'],
        'sand'       => ['Sand',       '#d8c6a3'],
        'brown'      => ['Brown',      '#5f4a36'],
    ];

    public function run(): void
    {
        // The first slug in each list is the default colour — it becomes the card
        // preview and the initial customiser view, so lead with a hero colour that
        // photographs well rather than plain white.

        // Shirts
        $this->seedColorGarment('mens-elbow-shirt', "Men's Elbow-Sleeve Shirt", 'Elbow Sleeve', 'elbow-sleeve', 95, 'shirt', 'ManElbowShirts',
            ['navy', 'white', 'black', 'grey', 'dark-blue', 'light-blue', 'olive', 'sand', 'brown']);

        $this->seedColorGarment('mens-short-sleeve-tee', "Men's Short-Sleeve Tee", 'Short Sleeve', 'short-sleeve', 45, 'shirt', 'ManShortSleeve',
            ['navy', 'white', 'black', 'grey', 'light-blue', 'olive', 'sand', 'brown']);

        // Trousers
        $this->seedColorGarment('mens-chino-trousers', "Men's Chino Trousers", 'Chino', 'chino', 120, 'trousers', 'ManTrousersChino',
            ['olive', 'white', 'black', 'charcoal', 'grey', 'slate', 'navy', 'khaki', 'brown']);
        $this->seedColorGarment('mens-corduroy-trousers', "Men's Corduroy Trousers", 'Corduroy', 'corduroy', 120, 'trousers', 'ManTrousersCurdory',
            ['khaki', 'white', 'black', 'charcoal', 'grey', 'slate', 'navy', 'olive', 'brown']);
        $this->seedColorGarment('mens-dress-trousers', "Men's Dress Trousers", 'Dress', 'dress', 120, 'trousers', 'ManTrousersDress',
            ['charcoal', 'white', 'black', 'grey', 'slate', 'navy', 'olive', 'khaki', 'brown']);
        $this->seedColorGarment('mens-cargo-trousers', "Men's Cargo Trousers", 'Cargo', 'cargo', 120, 'trousers', 'ManTrousersCargo',
            ['olive', 'white', 'black', 'charcoal', 'grey', 'slate', 'navy', 'khaki', 'sand', 'brown']);
    }

    /**
     * Seed one men's colour-variant garment (product + single style layer + colours).
     * The first slug in $colorSlugs is the default colour.
     *
     * @param  list<string>  $colorSlugs  keys into self::PALETTE
     */
    private function seedColorGarment(
        string $slug,
        string $name,
        string $styleName,
        string $styleSlug,
        float $basePrice,
        string $category,
        string $folder,
        array $colorSlugs,
    ): void {
        $base = "/assets/garments/{$folder}";
        $default = $colorSlugs[0];

        $product = CustomizerProduct::updateOrCreate(
            ['slug' => $slug],
            [
                'name' => $name,
                'category' => $category,
                'gender' => 'men',
                'description' => "{$name} — pick your colour.",
                'base_price' => $basePrice,
                'is_active' => true,
                'preview_image_path' => "{$base}/{$default}-front.png",
            ],
        );

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
            ['layer_category_id' => $styleCategory->id, 'slug' => $styleSlug],
            [
                'parent_option_id' => null,
                'name' => $styleName,
                'image_path' => "{$base}/{$default}-front.png",
                'thumbnail_path' => "{$base}/{$default}-front.png",
                'color_hex' => null,
                'price_modifier' => 0,
                'is_default' => true,
                'is_active' => true,
                'display_order' => 0,
            ],
        );

        foreach ($colorSlugs as $index => $colorSlug) {
            [$colorName, $hex] = self::PALETTE[$colorSlug];

            $style->colors()->updateOrCreate(
                ['name' => $colorName],
                [
                    'color_hex' => $hex,
                    'image_path' => "{$base}/{$colorSlug}-front.png",
                    'back_image_path' => $this->viewPath($base, $colorSlug, 'back'),
                    'left_image_path' => $this->viewPath($base, $colorSlug, 'left'),
                    'right_image_path' => $this->viewPath($base, $colorSlug, 'right'),
                    'is_default' => $index === 0,
                    'display_order' => $index,
                ],
            );
        }

        $this->command->info("{$name} seeded.");
    }

    /** Extra-angle photo path, or null when that view wasn't shot for this colour. */
    private function viewPath(string $base, string $colorSlug, string $view): ?string
    {
        $relative = "{$base}/{$colorSlug}-{$view}.png";

        return file_exists(public_path($relative)) ? $relative : null;
    }
}
