<?php

namespace Database\Seeders;

use App\Models\CustomizerProduct;
use App\Models\LayerCategory;
use App\Models\LayerOption;
use Illuminate\Database\Seeder;

/**
 * Women's "Tops" category — 17 garments, each configurable across five
 * attributes (fit, length, neckline, back design, sleeves).
 *
 * Shape:  CustomizerProduct = garment
 *         LayerCategory     = attribute   (is_preview_layer = false — selector only)
 *         LayerOption       = option      (label + price, artwork optional)
 *
 * Attributes are declared once in ATTRIBUTES and applied to every garment.
 * A garment narrows an attribute with 'only' (whitelist) or 'except'
 * (blacklist) so impossible combinations — sleeves on a camisole, a longline
 * crop top — never reach the customer. Adding a garment is one GARMENTS row;
 * adding an attribute is one ATTRIBUTES row.
 */
class WomensTopsSeeder extends Seeder
{
    private const CATEGORY = 'tops';

    /** Attribute => ordered options [slug => [label, price modifier in GEL]] */
    private const ATTRIBUTES = [
        [
            'slug' => 'fit',
            'name' => 'Fit',
            'default' => 'regular',
            'options' => [
                'body-fitting' => ['Body-Fitting', 0],
                'slim'         => ['Slim', 0],
                'regular'      => ['Regular', 0],
                'relaxed'      => ['Relaxed', 0],
                'oversized'    => ['Oversized', 5],
            ],
        ],
        [
            'slug' => 'length',
            'name' => 'Length',
            'default' => 'waist-length',
            'options' => [
                'cropped'      => ['Cropped', 0],
                'waist-length' => ['Waist-length', 0],
                'hip-length'   => ['Hip-length', 5],
                'longline'     => ['Longline', 12],
            ],
        ],
        [
            'slug' => 'neckline',
            'name' => 'Neckline',
            'default' => 'crew',
            'options' => [
                'crew'         => ['Crew', 0],
                'v'            => ['V', 0],
                'square'       => ['Square', 5],
                'scoop'        => ['Scoop', 0],
                'boat'         => ['Boat', 5],
                'high'         => ['High', 5],
                'turtle'       => ['Turtle', 8],
                'sweetheart'   => ['Sweetheart', 12],
                'halter'       => ['Halter', 10],
                'off-shoulder' => ['Off-shoulder', 12],
                'one-shoulder' => ['One-shoulder', 12],
            ],
        ],
        [
            'slug' => 'back-design',
            'name' => 'Back Design',
            'default' => 'normal',
            'options' => [
                'normal'   => ['Normal / No change', 0],
                'closed'   => ['Closed', 0],
                'v'        => ['V', 6],
                'low'      => ['Low', 10],
                'open'     => ['Open', 14],
                'lace-up'  => ['Lace-up', 20],
                'buttoned' => ['Buttoned', 14],
                'zippered' => ['Zippered', 12],
                'cut-out'  => ['Cut-out', 16],
            ],
        ],
        [
            'slug' => 'sleeves',
            'name' => 'Sleeves',
            'default' => 'short',
            'options' => [
                'sleeveless'    => ['Sleeveless', 0],
                'cap'           => ['Cap', 4],
                'short'         => ['Short', 0],
                'elbow'         => ['Elbow', 5],
                'three-quarter' => ['Three-quarter', 7],
                'long'          => ['Long', 9],
                'puff'          => ['Puff', 16],
                'bell'          => ['Bell', 15],
                'balloon'       => ['Balloon', 16],
                'bishop'        => ['Bishop', 17],
                'one-sleeve'    => ['One sleeve', 13],
            ],
        ],
        [
            'slug' => 'sleeve-fit',
            'name' => 'Sleeve Fit',
            'default' => 'fitted',
            // How the sleeve sits on the arm, independent of which sleeve it is
            // — the same short sleeve can be cut close or cut with room. The
            // T-shirt is photographed both ways; garments with no sleeves at
            // all skip this attribute entirely (see attributesFor).
            'options' => [
                'fitted'  => ['Fitted', 0],
                'relaxed' => ['Relaxed', 0],
            ],
        ],
    ];

    /**
     * The 17 Tops garments. 'only' whitelists an attribute's options,
     * 'except' removes them; an attribute left unmentioned offers the full set.
     */
    private const GARMENTS = [
        [
            'slug' => 't-shirt', 'name' => 'T-shirt', 'price' => 45,
            'description' => 'Everyday jersey tee, cut and finished to your measurements.',
            'except' => [
                'neckline' => ['sweetheart', 'halter', 'off-shoulder', 'one-shoulder'],
                'sleeves'  => ['one-sleeve'],
            ],
            'photos' => [
                // Two shoots of the same tee that differ in one thing: how the
                // sleeve sits. So the photography varies along one attribute,
                // and choosing a sleeve fit shows the shoot that depicts it
                // rather than a picture of the other one.
                'attribute' => 'sleeve-fit',
                // The cut the photography actually shows. Pinned as this
                // garment's defaults so the preview and the spec panel agree
                // the moment the page opens.
                'depicts' => [
                    'fit'         => 'body-fitting',
                    'length'      => 'cropped',
                    'neckline'    => 'crew',
                    'sleeves'     => 'short',
                    'back-design' => 'normal',
                    'sleeve-fit'  => 'fitted',
                ],
                // First variant is the default; its first colour becomes the
                // card preview and the opening customizer view. Swatch hexes
                // are sampled from the photographs themselves.
                'variants' => [
                    'fitted' => [
                        'folder' => 'WomanTshirtFitted',
                        'colors' => [
                            ['slug' => 'burgundy', 'name' => 'Burgundy', 'hex' => '#770421'],
                            ['slug' => 'black', 'name' => 'Black', 'hex' => '#141414'],
                            ['slug' => 'charcoal-gray', 'name' => 'Charcoal Gray', 'hex' => '#3c4249'],
                            ['slug' => 'light-gray', 'name' => 'Light Gray', 'hex' => '#cecece'],
                            ['slug' => 'white', 'name' => 'White', 'hex' => '#f1f1f3'],
                            ['slug' => 'off-white', 'name' => 'Off-White', 'hex' => '#f9f2e6'],
                            ['slug' => 'cream', 'name' => 'Cream', 'hex' => '#fef0d1'],
                            ['slug' => 'beige', 'name' => 'Beige', 'hex' => '#e5cdaf'],
                            ['slug' => 'camel', 'name' => 'Camel', 'hex' => '#c79762'],
                            ['slug' => 'brown', 'name' => 'Brown', 'hex' => '#6d422a'],
                            ['slug' => 'olive', 'name' => 'Olive', 'hex' => '#6d7f27'],
                            ['slug' => 'emerald', 'name' => 'Emerald', 'hex' => '#017b57'],
                            ['slug' => 'turquoise', 'name' => 'Turquoise', 'hex' => '#5ee4db'],
                            ['slug' => 'sky', 'name' => 'Sky', 'hex' => '#9bd2f2'],
                            ['slug' => 'blue', 'name' => 'Blue', 'hex' => '#3a6eec'],
                            ['slug' => 'navy', 'name' => 'Navy', 'hex' => '#010f6d'],
                            ['slug' => 'lavender', 'name' => 'Lavender', 'hex' => '#c188e1'],
                            ['slug' => 'purple', 'name' => 'Purple', 'hex' => '#5e088d'],
                            ['slug' => 'pink', 'name' => 'Pink', 'hex' => '#fd2a86'],
                            ['slug' => 'blush', 'name' => 'Blush', 'hex' => '#fcd0d1'],
                            ['slug' => 'red', 'name' => 'Red', 'hex' => '#d8111b'],
                            ['slug' => 'orange', 'name' => 'Orange', 'hex' => '#fd6c03'],
                            ['slug' => 'yellow', 'name' => 'Yellow', 'hex' => '#fdd62c'],
                        ],
                    ],
                    'relaxed' => [
                        'folder' => 'WomanTshirtRelaxed',
                        'colors' => [
                            ['slug' => 'burgundy', 'name' => 'Burgundy', 'hex' => '#76031e'],
                            ['slug' => 'black', 'name' => 'Black', 'hex' => '#181818'],
                            ['slug' => 'red', 'name' => 'Red', 'hex' => '#de191f'],
                            ['slug' => 'pink', 'name' => 'Pink', 'hex' => '#fc2d7c'],
                            ['slug' => 'orange', 'name' => 'Orange', 'hex' => '#fc6d03'],
                            ['slug' => 'yellow', 'name' => 'Yellow', 'hex' => '#fcd02c'],
                            ['slug' => 'green', 'name' => 'Green', 'hex' => '#00724a'],
                            ['slug' => 'olive', 'name' => 'Olive', 'hex' => '#6f7342'],
                            ['slug' => 'brown', 'name' => 'Brown', 'hex' => '#663a25'],
                        ],
                    ],
                ],
            ],
        ],
        [
            'slug' => 'shirt', 'name' => 'Shirt', 'price' => 75,
            'description' => 'Classic buttoned shirt with a structured collar and cuffs.',
            'only'   => ['neckline' => ['crew', 'v', 'square', 'boat', 'high']],
            'except' => ['sleeves' => ['one-sleeve']],
        ],
        [
            'slug' => 'blouse', 'name' => 'Blouse', 'price' => 85,
            'description' => 'Soft, fluid blouse — the most versatile piece in the range.',
            'except' => ['sleeves' => ['one-sleeve']],
        ],
        [
            'slug' => 'tank-top', 'name' => 'Tank Top', 'price' => 40,
            'description' => 'Clean sleeveless tank with your choice of neckline and back.',
            'only'   => ['sleeves' => ['sleeveless']],
            'except' => ['neckline' => ['turtle', 'off-shoulder', 'one-shoulder']],
        ],
        [
            'slug' => 'camisole', 'name' => 'Camisole', 'price' => 45,
            'description' => 'Fine-strap camisole, layered or worn on its own.',
            'only' => [
                'sleeves'  => ['sleeveless'],
                'neckline' => ['v', 'square', 'scoop', 'sweetheart', 'halter', 'one-shoulder'],
            ],
            'except' => ['length' => ['longline']],
        ],
        [
            'slug' => 'crop-top', 'name' => 'Crop Top', 'price' => 45,
            'description' => 'Cropped silhouette finishing above the waist.',
            'only'   => ['length' => ['cropped']],
            'except' => ['sleeves' => ['one-sleeve']],
        ],
        [
            'slug' => 'corset-top', 'name' => 'Corset Top', 'price' => 110,
            'description' => 'Boned, structured corset top with a sculpted waist.',
            'only' => [
                'fit'      => ['body-fitting', 'slim'],
                'length'   => ['cropped', 'waist-length'],
                'neckline' => ['square', 'sweetheart', 'v', 'halter', 'off-shoulder', 'one-shoulder'],
                'sleeves'  => ['sleeveless', 'cap', 'short', 'puff', 'one-sleeve'],
            ],
        ],
        [
            'slug' => 'bodysuit', 'name' => 'Bodysuit', 'price' => 80,
            'description' => 'Second-skin bodysuit that stays put under anything.',
            'only' => [
                'fit'    => ['body-fitting', 'slim', 'regular'],
                'length' => ['waist-length', 'hip-length'],
            ],
        ],
        [
            'slug' => 'tunic', 'name' => 'Tunic', 'price' => 85,
            'description' => 'Longline tunic worn loose over trousers or leggings.',
            'only'   => ['length' => ['hip-length', 'longline']],
            'except' => [
                'neckline' => ['halter', 'sweetheart', 'one-shoulder'],
                'sleeves'  => ['one-sleeve'],
            ],
        ],
        [
            'slug' => 'sweatshirt', 'name' => 'Sweatshirt', 'price' => 70,
            'description' => 'Brushed-back sweatshirt with ribbed cuffs and hem.',
            'only' => [
                'neckline' => ['crew', 'v', 'square', 'boat', 'high'],
                'sleeves'  => ['short', 'elbow', 'three-quarter', 'long', 'puff', 'balloon'],
            ],
            'except' => ['fit' => ['body-fitting']],
        ],
        [
            'slug' => 'hoodie', 'name' => 'Hoodie', 'price' => 85,
            'description' => 'Hooded sweatshirt with a lined hood and deep pocket.',
            'only' => [
                'neckline' => ['crew', 'v', 'high'],
                'sleeves'  => ['short', 'three-quarter', 'long', 'balloon'],
            ],
            'except' => ['fit' => ['body-fitting']],
        ],
        [
            'slug' => 'sweater', 'name' => 'Sweater', 'price' => 95,
            'description' => 'Knitted sweater in the weight and neckline you choose.',
            'except' => [
                'neckline' => ['halter', 'sweetheart', 'one-shoulder'],
                'sleeves'  => ['cap', 'one-sleeve'],
            ],
        ],
        [
            'slug' => 'cardigan', 'name' => 'Cardigan', 'price' => 95,
            'description' => 'Open-front knitted cardigan, buttoned or free.',
            'only' => [
                'neckline'    => ['v', 'crew', 'square', 'boat', 'high'],
                'back-design' => ['normal', 'closed'],
            ],
            'except' => ['sleeves' => ['one-sleeve']],
        ],
        [
            'slug' => 'vest', 'name' => 'Vest', 'price' => 65,
            'description' => 'Sleeveless vest that layers over a shirt or on its own.',
            'only'   => ['sleeves' => ['sleeveless']],
            'except' => ['neckline' => ['halter', 'sweetheart', 'off-shoulder', 'one-shoulder']],
        ],
        [
            'slug' => 'evening-top', 'name' => 'Evening Top', 'price' => 120,
            'description' => 'Occasion top in a finer cloth, with every finish available.',
        ],
        [
            'slug' => 'off-shoulder-top', 'name' => 'Off-shoulder Top', 'price' => 80,
            'description' => 'Neckline that sits below the shoulder line.',
            'only'   => ['neckline' => ['off-shoulder', 'one-shoulder', 'sweetheart', 'boat']],
            'except' => ['sleeves' => ['sleeveless']],
        ],
        [
            'slug' => 'wrap-top', 'name' => 'Wrap Top', 'price' => 80,
            'description' => 'Cross-front wrap that ties to your own fit.',
            'only' => [
                'neckline'    => ['v', 'sweetheart', 'square', 'scoop', 'one-shoulder'],
                'back-design' => ['normal', 'closed', 'v', 'low'],
            ],
            'except' => ['sleeves' => ['one-sleeve']],
        ],
    ];

    public function run(): void
    {
        foreach (self::GARMENTS as $garment) {
            $this->seedGarment($garment);
        }
    }

    private function seedGarment(array $garment): void
    {
        $photos = $garment['photos'] ?? null;
        $default = $photos ? $this->defaultVariant($photos) : null;

        $product = CustomizerProduct::updateOrCreate(
            ['slug' => "womens-{$garment['slug']}"],
            [
                'name' => $garment['name'],
                'category' => self::CATEGORY,
                'gender' => 'women',
                'description' => $garment['description'],
                'base_price' => $garment['price'],
                'is_active' => true,
                'preview_image_path' => $default
                    ? "/assets/garments/{$default['folder']}/{$default['colors'][0]['slug']}-front.png"
                    : null,
            ],
        );

        $attributes = $this->attributesFor($garment);
        $seeded = [];

        foreach ($attributes as $order => $attribute) {
            if ($this->seedAttribute($product, $attribute, $order, $garment)) {
                $seeded[] = $attribute['slug'];
            }
        }

        if ($photos) {
            $this->seedPhotos($product, $photos);
        }

        // A garment that no longer offers an attribute — or the retired 'style'
        // layer, now that the photography hangs off a real attribute — must not
        // keep a stale category advertising choices this seeder no longer makes.
        // Options and their colours cascade with it.
        $product->layerCategories()->whereNotIn('slug', $seeded)->get()->each->delete();
    }

    /**
     * The attributes this garment offers, in display order.
     *
     * Sleeve fit is meaningless on a garment with no sleeves, and deriving that
     * from the sleeve options themselves keeps it from drifting out of step with
     * a second hand-maintained list of sleeveless garments.
     *
     * @return list<array<string, mixed>>
     */
    private function attributesFor(array $garment): array
    {
        $sleeves = $this->allowedOptionSlugs(
            self::ATTRIBUTES[array_search('sleeves', array_column(self::ATTRIBUTES, 'slug'), true)],
            $garment,
        );
        $sleeveless = $sleeves === ['sleeveless'];

        return array_values(array_filter(
            self::ATTRIBUTES,
            fn (array $a) => ! ($sleeveless && $a['slug'] === 'sleeve-fit'),
        ));
    }

    /** The shoot a garment opens on: the first variant listed. */
    private function defaultVariant(array $photos): array
    {
        return $photos['variants'][array_key_first($photos['variants'])];
    }

    /**
     * Hang the photography off the attribute it varies along: each variant is
     * an option that already exists as a labelled choice, given the shoot that
     * depicts it plus that shoot's colours. The canvas composites it and the
     * colour dots swap it, exactly as with the men's garments.
     */
    private function seedPhotos(CustomizerProduct $product, array $photos): void
    {
        $category = $product->layerCategories()->where('slug', $photos['attribute'])->first();
        if (! $category) {
            return;
        }

        // Only now does this attribute become a canvas layer; every other
        // attribute stays a labelled choice the customizer must not composite.
        $category->update(['is_preview_layer' => true, 'is_colorable' => false]);

        foreach ($photos['variants'] as $slug => $variant) {
            $option = $category->allOptions()->where('slug', $slug)->first();
            if (! $option) {
                continue;
            }

            $base = "/assets/garments/{$variant['folder']}";
            $first = $variant['colors'][0]['slug'];

            $option->update([
                'image_path' => "{$base}/{$first}-front.png",
                'thumbnail_path' => "{$base}/{$first}-front.png",
                'back_image_path' => "{$base}/{$first}-back.png",
                'left_image_path' => "{$base}/{$first}-left.png",
                'right_image_path' => "{$base}/{$first}-right.png",
                'color_hex' => null,
            ]);

            foreach ($variant['colors'] as $index => $color) {
                $option->colors()->updateOrCreate(
                    ['name' => $color['name']],
                    [
                        'color_hex' => $color['hex'],
                        'image_path' => "{$base}/{$color['slug']}-front.png",
                        'back_image_path' => "{$base}/{$color['slug']}-back.png",
                        'left_image_path' => "{$base}/{$color['slug']}-left.png",
                        'right_image_path' => "{$base}/{$color['slug']}-right.png",
                        'is_default' => $index === 0,
                        'display_order' => $index,
                    ],
                );
            }

            // A re-shoot can drop a colour — the relaxed set has a Green the
            // fitted one does not. Its row would otherwise survive
            // updateOrCreate and keep pointing at a file that no longer exists.
            $option->colors()
                ->whereNotIn('name', array_column($variant['colors'], 'name'))
                ->delete();
        }
    }

    /** @return bool whether this garment offers the attribute at all */
    private function seedAttribute(
        CustomizerProduct $product,
        array $attribute,
        int $order,
        array $garment,
    ): bool {
        $slugs = $this->allowedOptionSlugs($attribute, $garment);
        if ($slugs === []) {
            return false;
        }

        $category = LayerCategory::updateOrCreate(
            ['customizer_product_id' => $product->id, 'slug' => $attribute['slug']],
            [
                'name' => $attribute['name'],
                'children_label' => null,
                'z_index' => $order + 1,
                'is_required' => true,
                'is_colorable' => false,
                // Labelled choice, not a canvas layer — the customizer must not
                // try to composite a photo for it.
                'is_preview_layer' => false,
                'display_order' => $order,
            ],
        );

        // A photographed garment pins the attributes its shots depict; otherwise
        // the line-wide default applies. Either can have been filtered out for
        // this garment (a camisole has no 'short' sleeve), so fall back through
        // to the first surviving option.
        $default = $this->firstAvailable([
            $garment['photos']['depicts'][$attribute['slug']] ?? null,
            $attribute['default'],
        ], $slugs) ?? $slugs[0];

        $depicted = $garment['photos']['depicts'][$attribute['slug']] ?? null;

        // Narrowing can remove every zero-cost option — an Off-shoulder Top has
        // no plain neckline, a Tunic no short length — which left base_price
        // advertised on the card but unreachable in the customizer. Modifiers
        // are relative to the cheapest choice this garment actually offers, so
        // "Starting from" is always a price someone can pay. Garments that keep
        // a zero-cost option subtract nothing and are unaffected.
        $cheapest = min(array_map(fn (string $s) => $attribute['options'][$s][1], $slugs));

        foreach ($slugs as $index => $slug) {
            [$label, $priceModifier] = $attribute['options'][$slug];
            $priceModifier -= $cheapest;

            // On a photographed garment the base price buys the cut in the
            // photos, so those options carry no surcharge — only deviating
            // from what was shot costs extra. Keeps the opening total equal to
            // the "starting from" price on the garment card.
            if ($slug === $depicted) {
                $priceModifier = 0;
            }

            LayerOption::updateOrCreate(
                ['layer_category_id' => $category->id, 'slug' => $slug],
                [
                    'parent_option_id' => null,
                    'name' => $label,
                    'image_path' => null,
                    'thumbnail_path' => null,
                    'price_modifier' => $priceModifier,
                    'is_default' => $slug === $default,
                    'is_active' => true,
                    'display_order' => $index,
                ],
            );
        }

        // A re-run with tightened restrictions retires the options that no longer
        // apply. Deactivating rather than deleting keeps saved designs resolvable.
        $category->allOptions()
            ->whereNotIn('slug', $slugs)
            ->update(['is_active' => false]);

        return true;
    }

    /**
     * First candidate that survived this garment's restrictions.
     *
     * @param  list<string|null>  $candidates  in order of preference
     * @param  list<string>  $available
     */
    private function firstAvailable(array $candidates, array $available): ?string
    {
        foreach ($candidates as $candidate) {
            if ($candidate !== null && in_array($candidate, $available, true)) {
                return $candidate;
            }
        }

        return null;
    }

    /** @return list<string> option slugs this garment offers, in canonical order */
    private function allowedOptionSlugs(array $attribute, array $garment): array
    {
        $slugs = array_keys($attribute['options']);
        $only = $garment['only'][$attribute['slug']] ?? null;
        $except = $garment['except'][$attribute['slug']] ?? [];

        return array_values(array_filter(
            $slugs,
            fn (string $slug) => ($only === null || in_array($slug, $only, true))
                && ! in_array($slug, $except, true),
        ));
    }
}
