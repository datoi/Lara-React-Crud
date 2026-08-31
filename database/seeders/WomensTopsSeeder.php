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
    ];

    /**
     * The T-shirt photography: one style per sleeve construction, each with its
     * own colourway. Style is the preview layer, so choosing one swaps both the
     * garment on the canvas and the colour dots underneath it.
     *
     * Classic is the original shoot and stays the default, at the head of the
     * row. The five after it come from the 2026 studio set, which photographs
     * the same cropped crew tee — the cut 'depicts' pins — in five sleeve
     * constructions. They differ in the sleeve alone: measured across all 102
     * configurations the body is one garment (hem 584-625px) while the sleeve
     * runs from a fitted set-in to a dropped shoulder, so fit, length and
     * neckline stay the labelled selectors they already were.
     *
     * A style opens on its 'cover' colour, which is also its tile thumbnail —
     * six different ones, because five styles thumbnailed in black read as the
     * same garment repeated. Cover is independent of colour order, so the dots
     * stay in one canonical sequence across every style. Hexes are sampled from the
     * photographs themselves, which is why one colour word differs in shade
     * between styles — they are separate shoots of separate dye lots. Both the
     * files and the hexes come from scripts/prepare-tshirt-photos.mjs.
     */
    private const TSHIRT_STYLES = [
        [
            'slug' => 'classic', 'name' => 'Classic',
            'cover' => 'burgundy',
            'folder' => 'WomanTshirtClassic', 'prefix' => '',
            'colors' => [
                ['slug' => 'burgundy',        'name' => 'Burgundy',     'hex' => '#76041f'],
                ['slug' => 'black',           'name' => 'Black',        'hex' => '#181818'],
                ['slug' => 'red',             'name' => 'Red',          'hex' => '#de1a1f'],
                ['slug' => 'pink',            'name' => 'Pink',         'hex' => '#fc2d7c'],
                ['slug' => 'orange',          'name' => 'Orange',       'hex' => '#fc6d05'],
                ['slug' => 'yellow',          'name' => 'Yellow',       'hex' => '#fcd02c'],
                ['slug' => 'green',           'name' => 'Green',        'hex' => '#01714a'],
                ['slug' => 'olive',           'name' => 'Olive',        'hex' => '#6f7342'],
                ['slug' => 'brown',           'name' => 'Brown',        'hex' => '#663a25'],
            ],
        ],
        [
            'slug' => 'fitted', 'name' => 'Fitted',
            'cover' => 'navy',
            'folder' => 'WomanTshirtStudio', 'prefix' => 'fitted-',
            'colors' => [
                ['slug' => 'black',           'name' => 'Black',        'hex' => '#151515'],
                ['slug' => 'charcoal',        'name' => 'Charcoal',     'hex' => '#3c4249'],
                ['slug' => 'navy',            'name' => 'Navy',         'hex' => '#02116e'],
                ['slug' => 'brown',           'name' => 'Brown',        'hex' => '#6b4129'],
                ['slug' => 'camel',           'name' => 'Camel',        'hex' => '#c69661'],
                ['slug' => 'beige',           'name' => 'Beige',        'hex' => '#e4cbad'],
                ['slug' => 'cream',           'name' => 'Cream',        'hex' => '#fef0cf'],
                ['slug' => 'off-white',       'name' => 'Off-White',    'hex' => '#f2eadc'],
                ['slug' => 'white',           'name' => 'White',        'hex' => '#e6e5e8'],
                ['slug' => 'light-gray',      'name' => 'Light Gray',   'hex' => '#cccccc'],
                ['slug' => 'blush',           'name' => 'Blush',        'hex' => '#fccfd0'],
                ['slug' => 'pink',            'name' => 'Pink',         'hex' => '#fd2a87'],
                ['slug' => 'red',             'name' => 'Red',          'hex' => '#d8111b'],
                ['slug' => 'burgundy',        'name' => 'Burgundy',     'hex' => '#780423'],
                ['slug' => 'orange',          'name' => 'Orange',       'hex' => '#fe6d03'],
                ['slug' => 'yellow',          'name' => 'Yellow',       'hex' => '#fed72b'],
                ['slug' => 'olive',           'name' => 'Olive',        'hex' => '#6c7e25'],
                ['slug' => 'emerald',         'name' => 'Emerald',      'hex' => '#017b58'],
                ['slug' => 'turquoise',       'name' => 'Turquoise',    'hex' => '#5ce4da'],
                ['slug' => 'sky',             'name' => 'Sky',          'hex' => '#9bd2f2'],
                ['slug' => 'blue',            'name' => 'Blue',         'hex' => '#3b6fec'],
                ['slug' => 'lavender',        'name' => 'Lavender',     'hex' => '#c38be3'],
                ['slug' => 'purple',          'name' => 'Purple',       'hex' => '#620991'],
            ],
        ],
        [
            'slug' => 'wide', 'name' => 'Wide',
            'cover' => 'olive',
            'folder' => 'WomanTshirtStudio', 'prefix' => 'wide-',
            'colors' => [
                ['slug' => 'black',           'name' => 'Black',        'hex' => '#1e1e1f'],
                ['slug' => 'charcoal',        'name' => 'Charcoal',     'hex' => '#454446'],
                ['slug' => 'navy',            'name' => 'Navy',         'hex' => '#182042'],
                ['slug' => 'brown',           'name' => 'Brown',        'hex' => '#5b392b'],
                ['slug' => 'camel',           'name' => 'Camel',        'hex' => '#cd9b6e'],
                ['slug' => 'beige',           'name' => 'Beige',        'hex' => '#e9daca'],
                ['slug' => 'cream',           'name' => 'Cream',        'hex' => '#f7edd6'],
                ['slug' => 'off-white',       'name' => 'Off-White',    'hex' => '#f2e9e0'],
                ['slug' => 'white',           'name' => 'White',        'hex' => '#e9e8ea'],
                ['slug' => 'light-gray',      'name' => 'Light Gray',   'hex' => '#d3d3d8'],
                ['slug' => 'blush',           'name' => 'Blush',        'hex' => '#fcdedd'],
                ['slug' => 'pink',            'name' => 'Pink',         'hex' => '#fd398f'],
                ['slug' => 'red',             'name' => 'Red',          'hex' => '#e71223'],
                ['slug' => 'burgundy',        'name' => 'Burgundy',     'hex' => '#662032'],
                ['slug' => 'orange',          'name' => 'Orange',       'hex' => '#fd670d'],
                ['slug' => 'yellow',          'name' => 'Yellow',       'hex' => '#fdd318'],
                ['slug' => 'olive',           'name' => 'Olive',        'hex' => '#6c6d3f'],
                ['slug' => 'green',           'name' => 'Green',        'hex' => '#018f5c'],
                ['slug' => 'turquoise',       'name' => 'Turquoise',    'hex' => '#36ced1'],
                ['slug' => 'sky',             'name' => 'Sky',          'hex' => '#9dd4f4'],
                ['slug' => 'blue',            'name' => 'Blue',         'hex' => '#164bd2'],
                ['slug' => 'lavender',        'name' => 'Lavender',     'hex' => '#cdb2e9'],
                ['slug' => 'purple',          'name' => 'Purple',       'hex' => '#6e24a3'],
            ],
        ],
        [
            'slug' => 'dropped', 'name' => 'Dropped',
            'cover' => 'camel',
            'folder' => 'WomanTshirtStudio', 'prefix' => 'dropped-',
            'colors' => [
                ['slug' => 'black',           'name' => 'Black',        'hex' => '#171717'],
                ['slug' => 'charcoal',        'name' => 'Charcoal',     'hex' => '#4d4d4f'],
                ['slug' => 'navy',            'name' => 'Navy',         'hex' => '#1d2234'],
                ['slug' => 'brown',           'name' => 'Brown',        'hex' => '#4a322b'],
                ['slug' => 'camel',           'name' => 'Camel',        'hex' => '#d79d68'],
                ['slug' => 'beige',           'name' => 'Beige',        'hex' => '#ebdcc9'],
                ['slug' => 'cream',           'name' => 'Cream',        'hex' => '#f6ead9'],
                ['slug' => 'off-white',       'name' => 'Off-White',    'hex' => '#ece8e0'],
                ['slug' => 'white',           'name' => 'White',        'hex' => '#e8e8ea'],
                ['slug' => 'light-gray',      'name' => 'Light Gray',   'hex' => '#dfdfdf'],
                ['slug' => 'blush',           'name' => 'Blush',        'hex' => '#fcdfde'],
                ['slug' => 'pink',            'name' => 'Pink',         'hex' => '#fc4292'],
                ['slug' => 'red',             'name' => 'Red',          'hex' => '#f20c21'],
                ['slug' => 'burgundy',        'name' => 'Burgundy',     'hex' => '#681628'],
                ['slug' => 'orange',          'name' => 'Orange',       'hex' => '#fd6710'],
                ['slug' => 'yellow',          'name' => 'Yellow',       'hex' => '#fee03e'],
                ['slug' => 'olive',           'name' => 'Olive',        'hex' => '#68684a'],
                ['slug' => 'green',           'name' => 'Green',        'hex' => '#006f4e'],
                ['slug' => 'sky',             'name' => 'Sky',          'hex' => '#d6e7f8'],
                ['slug' => 'blue',            'name' => 'Blue',         'hex' => '#1952d9'],
            ],
        ],
        [
            'slug' => 'oversized', 'name' => 'Oversized',
            'cover' => 'orange',
            'folder' => 'WomanTshirtStudio', 'prefix' => 'oversized-',
            'colors' => [
                ['slug' => 'black',           'name' => 'Black',        'hex' => '#1c1c1c'],
                ['slug' => 'charcoal',        'name' => 'Charcoal',     'hex' => '#474747'],
                ['slug' => 'navy',            'name' => 'Navy',         'hex' => '#1c243b'],
                ['slug' => 'brown',           'name' => 'Brown',        'hex' => '#643a29'],
                ['slug' => 'camel',           'name' => 'Camel',        'hex' => '#cb935f'],
                ['slug' => 'beige',           'name' => 'Beige',        'hex' => '#eedfcf'],
                ['slug' => 'cream',           'name' => 'Cream',        'hex' => '#f6ead6'],
                ['slug' => 'off-white',       'name' => 'Off-White',    'hex' => '#eee8df'],
                ['slug' => 'white',           'name' => 'White',        'hex' => '#e8e8ea'],
                ['slug' => 'light-gray',      'name' => 'Light Gray',   'hex' => '#ceced0'],
                ['slug' => 'blush',           'name' => 'Blush',        'hex' => '#fadedd'],
                ['slug' => 'pink',            'name' => 'Pink',         'hex' => '#fc559b'],
                ['slug' => 'red',             'name' => 'Red',          'hex' => '#e50d1c'],
                ['slug' => 'burgundy',        'name' => 'Burgundy',     'hex' => '#591729'],
                ['slug' => 'orange',          'name' => 'Orange',       'hex' => '#fd640e'],
                ['slug' => 'yellow',          'name' => 'Yellow',       'hex' => '#fdca0d'],
                ['slug' => 'olive',           'name' => 'Olive',        'hex' => '#6e6e4f'],
                ['slug' => 'green',           'name' => 'Green',        'hex' => '#006c4a'],
                ['slug' => 'turquoise',       'name' => 'Turquoise',    'hex' => '#23cfe4'],
                ['slug' => 'sky',             'name' => 'Sky',          'hex' => '#b9daf7'],
                ['slug' => 'blue',            'name' => 'Blue',         'hex' => '#0f44c3'],
                ['slug' => 'lavender',        'name' => 'Lavender',     'hex' => '#d6c5ed'],
                ['slug' => 'purple',          'name' => 'Purple',       'hex' => '#572e88'],
            ],
        ],
        [
            'slug' => 'puff', 'name' => 'Puff',
            'cover' => 'pink',
            'folder' => 'WomanTshirtStudio', 'prefix' => 'puff-',
            'colors' => [
                ['slug' => 'black',           'name' => 'Black',        'hex' => '#1f1f1f'],
                ['slug' => 'charcoal',        'name' => 'Charcoal',     'hex' => '#48474a'],
                ['slug' => 'brown',           'name' => 'Brown',        'hex' => '#6e4b3a'],
                ['slug' => 'camel',           'name' => 'Camel',        'hex' => '#d09c74'],
                ['slug' => 'beige',           'name' => 'Beige',        'hex' => '#ead6c0'],
                ['slug' => 'cream',           'name' => 'Cream',        'hex' => '#f3e9da'],
                ['slug' => 'off-white',       'name' => 'Off-White',    'hex' => '#eee9e1'],
                ['slug' => 'white',           'name' => 'White',        'hex' => '#e8e7e9'],
                ['slug' => 'light-gray',      'name' => 'Light Gray',   'hex' => '#c1c1c3'],
                ['slug' => 'blush',           'name' => 'Blush',        'hex' => '#f9dad9'],
                ['slug' => 'pink',            'name' => 'Pink',         'hex' => '#f6357f'],
                ['slug' => 'burgundy',        'name' => 'Burgundy',     'hex' => '#5a192b'],
                ['slug' => 'orange',          'name' => 'Orange',       'hex' => '#fd6b1f'],
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
                // The cut every T-shirt photograph shows. Pinned as this
                // garment's defaults so the preview and the spec panel agree
                // the moment the page opens.
                'depicts' => [
                    'fit'      => 'body-fitting',
                    'length'   => 'cropped',
                    'neckline' => 'crew',
                    'sleeves'  => 'cap',
                ],
                'styles' => self::TSHIRT_STYLES,
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
        $lead = $photos['styles'][0] ?? null;

        $product = CustomizerProduct::updateOrCreate(
            ['slug' => "womens-{$garment['slug']}"],
            [
                'name' => $garment['name'],
                'category' => self::CATEGORY,
                'gender' => 'women',
                'description' => $garment['description'],
                'base_price' => $garment['price'],
                'is_active' => true,
                'preview_image_path' => $lead
                    ? self::photoPath($lead, $lead['cover'], 'front')
                    : null,
            ],
        );

        // Display order 0 is reserved for the photographed style layer, so the
        // garment and its colours sit above the tailoring spec.
        foreach (self::ATTRIBUTES as $order => $attribute) {
            $this->seedAttribute($product, $attribute, $order + 1, $garment);
        }

        if ($photos) {
            $this->seedPhotoLayer($product, $photos);
        }
    }

    /**
     * Angles the T-shirt is offered in — every angle the shoot delivered.
     *
     * One caveat, measured and knowingly accepted: the side masters are posed
     * less consistently than the fronts. Within a single style the side profile
     * varies 9-13% between colours, where the fronts vary 0.3-0.8%, so changing
     * colour while looking at a side view can read as a slightly different cut.
     * That is drape and rotation in the photography, not a mapping fault — every
     * file was checked to be the right colour, the right style, and a true mirror
     * of its pair. It shows only when flipping colours on a side view, which is
     * narrow enough that hiding 203 photographs to avoid it costs more than it
     * saves. A consistently posed re-shoot of the side angles would settle it.
     *
     * A view still resolves to null when its file is genuinely absent, so
     * puff/black offers three angles rather than a wrong fourth.
     */
    private const PHOTO_VIEWS = ['front', 'back', 'left', 'right'];

    /**
     * Public path of one photograph — /assets/garments/<folder>/<prefix><colour>-<view>.png
     * — or null when the angle is not offered, or the shoot did not deliver it.
     * A rotation view pointing at a file that is not on disk would give the
     * customer a tile that 404s; null instead leaves the angle out of the
     * switcher, which already offers only views every rendered layer has.
     * See scripts/prepare-tshirt-photos.mjs.
     */
    private static function photoPath(array $style, string $color, string $view): ?string
    {
        if (! in_array($view, self::PHOTO_VIEWS, true)) {
            return null;
        }

        $path = "/assets/garments/{$style['folder']}/{$style['prefix']}{$color}-{$view}.png";

        return file_exists(public_path($path)) ? $path : null;
    }

    /**
     * The photographed garment: a Style option per shoot, each carrying a colour
     * variant per colourway. Same shape the customizer admin produces, and the
     * same shape MensGarmentsSeeder uses — the canvas composites the selected
     * option, the colour dots swap it.
     */
    private function seedPhotoLayer(CustomizerProduct $product, array $photos): void
    {
        $category = LayerCategory::updateOrCreate(
            ['customizer_product_id' => $product->id, 'slug' => 'style'],
            [
                'name' => 'Style',
                'children_label' => null,
                'z_index' => 1,
                'is_required' => true,
                // Real colour photography — never tint it with a fabric swatch.
                'is_colorable' => false,
                'is_preview_layer' => true,
                'display_order' => 0,
            ],
        );

        foreach ($photos['styles'] as $order => $style) {
            $cover = $style['cover'];

            $option = LayerOption::updateOrCreate(
                ['layer_category_id' => $category->id, 'slug' => $style['slug']],
                [
                    'parent_option_id' => null,
                    'name' => $style['name'],
                    'image_path' => self::photoPath($style, $cover, 'front'),
                    'thumbnail_path' => self::photoPath($style, $cover, 'front'),
                    'back_image_path' => self::photoPath($style, $cover, 'back'),
                    'left_image_path' => self::photoPath($style, $cover, 'left'),
                    'right_image_path' => self::photoPath($style, $cover, 'right'),
                    'color_hex' => null,
                    // The base price buys any of the photographed sleeves — the
                    // same tee, cut differently at the shoulder.
                    'price_modifier' => 0,
                    'is_default' => $order === 0,
                    'is_active' => true,
                    'display_order' => $order,
                ],
            );

            foreach ($style['colors'] as $index => $color) {
                $option->colors()->updateOrCreate(
                    ['name' => $color['name']],
                    [
                        'color_hex' => $color['hex'],
                        'image_path' => self::photoPath($style, $color['slug'], 'front'),
                        'back_image_path' => self::photoPath($style, $color['slug'], 'back'),
                        'left_image_path' => self::photoPath($style, $color['slug'], 'left'),
                        'right_image_path' => self::photoPath($style, $color['slug'], 'right'),
                        'is_default' => $color['slug'] === $cover,
                        'display_order' => $index,
                    ],
                );
            }
        }
    }

    private function seedAttribute(
        CustomizerProduct $product,
        array $attribute,
        int $order,
        array $garment,
    ): void {
        $slugs = $this->allowedOptionSlugs($attribute, $garment);
        if ($slugs === []) {
            return;
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
