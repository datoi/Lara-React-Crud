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
 *         LayerCategory     = attribute
 *         LayerOption       = option      (label + price, artwork optional)
 *
 * Attributes are declared once in ATTRIBUTES and applied to every garment.
 * A garment narrows an attribute with 'only' (whitelist) or 'except'
 * (blacklist) so impossible combinations — sleeves on a camisole, a longline
 * crop top — never reach the customer. Adding a garment is one GARMENTS row;
 * adding an attribute is one ATTRIBUTES row.
 *
 * Photography, where a garment has any, belongs to the attribute the shoot
 * varies: that attribute becomes the preview layer, its photographed options
 * carry the images and the colourways, and each of them records in 'depicts'
 * the rest of the cut it was shot in. There is no separate "style" selector —
 * the customer specifies the garment and the canvas answers with a photograph
 * when, and only when, one exists for what they specified.
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
                'wide'          => ['Wide', 4],
                'dropped'       => ['Dropped Shoulder', 4],
                'oversized'     => ['Oversized', 6],
                'puff'          => ['Puff', 16],
                'bell'          => ['Bell', 15],
                'balloon'       => ['Balloon', 16],
                'bishop'        => ['Bishop', 17],
                'one-sleeve'    => ['One sleeve', 13],
            ],
        ],
    ];

    /**
     * The T-shirt photography, keyed by the sleeve each shoot depicts.
     *
     * The 2026 studio set photographs one cropped crew tee in five sleeve
     * constructions. They differ in the sleeve alone: measured across all 102
     * configurations the body is one garment (hem 584-625px, unchanged between
     * shoots) while the sleeve runs from a set-in cap ending 48% down the body
     * to a dropped shoulder ending at 71%. So the shoots are options of the
     * Sleeves attribute, and fit, length and neckline stay what the file names
     * declare them to be for every frame — body-fitting, cropped, crew.
     *
     * Both the masters and the derived set are named by the sleeve slug, so a
     * key here is also the file prefix on disk — see photoPath().
     *
     * Every sleeve opens on the same 'cover' colour, so the tiles differ only in
     * the sleeve and changing sleeve never changes the colour the customer is
     * looking at. Hexes are sampled from the photographs themselves, which is
     * why one colour word differs in shade between sleeves — they are separate
     * shoots of separate dye lots. Both the files and the hexes come from
     * scripts/prepare-tshirt-photos.mjs.
     */
    private const TSHIRT_SLEEVES = [
        'cap' => [
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
        'wide' => [
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
        'dropped' => [
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
        'oversized' => [
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
        'puff' => [
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
                // Sleeves is the attribute the shoot varies — five constructions
                // of one tee — so its options carry the photographs and the
                // colourways, and it is the layer the canvas paints.
                'attribute' => 'sleeves',
                'options'   => self::TSHIRT_SLEEVES,
                'default'   => 'cap',
                'cover'     => 'burgundy',
                // The rest of the cut every photograph shows, read off the file
                // names. Pinned as this garment's defaults so the preview and
                // the spec panel agree the moment the page opens, and recorded
                // on each photographed option so the canvas can withhold a
                // picture of a tee the customer is no longer specifying.
                'depicts' => [
                    'fit'         => 'body-fitting',
                    'length'      => 'cropped',
                    'neckline'    => 'crew',
                    // The shoot delivered a back view of every colourway, and
                    // every one of them is plain and closed — so the back is
                    // photographed too, and asking for a lace-up back leaves
                    // the picture wrong from behind.
                    'back-design' => 'normal',
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

        $product = CustomizerProduct::updateOrCreate(
            ['slug' => "womens-{$garment['slug']}"],
            [
                'name' => $garment['name'],
                'category' => self::CATEGORY,
                'gender' => 'women',
                'description' => $garment['description'],
                'base_price' => $garment['price'],
                'is_active' => true,
                'preview_image_path' => $photos
                    ? self::photoPath($photos, $photos['default'], $photos['cover'], 'front')
                    : null,
            ],
        );

        $seeded = [];
        foreach (self::ATTRIBUTES as $order => $attribute) {
            if ($this->seedAttribute($product, $attribute, $order, $garment)) {
                $seeded[] = $attribute['slug'];
            }
        }

        // Retires attributes this garment no longer has — including the 'style'
        // selector the photography used to sit behind, now that its five shoots
        // are sleeve options. Cascades to their options and colours; a saved
        // design holding a removed id falls back to the category default when
        // it is reopened.
        $product->layerCategories()->whereNotIn('slug', $seeded)->delete();
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

    /** Folder the prepared T-shirt photography is served from. */
    private const PHOTO_FOLDER = 'WomanTshirtStudio';

    /**
     * Public path of one photograph — /assets/garments/<folder>/<prefix><colour>-<view>.png
     * — or null when the angle is not offered, the option is not photographed,
     * or the shoot did not deliver it. A rotation view pointing at a file that
     * is not on disk would give the customer a tile that 404s; null instead
     * leaves the angle out of the switcher, which already offers only views
     * every rendered layer has. See scripts/prepare-tshirt-photos.mjs.
     */
    private static function photoPath(array $photos, string $option, string $color, string $view): ?string
    {
        if (! isset($photos['options'][$option]) || ! in_array($view, self::PHOTO_VIEWS, true)) {
            return null;
        }

        $path = '/assets/garments/'.self::PHOTO_FOLDER."/{$option}-{$color}-{$view}.png";

        return file_exists(public_path($path)) ? $path : null;
    }

    /**
     * One attribute of one garment. Returns false when this garment offers none
     * of the attribute's options, so the caller can retire the category.
     *
     * The attribute a garment's photography varies is also its preview layer:
     * its options carry the photographs and their colourways, and the canvas
     * paints whichever one is selected. Every other attribute stays a labelled
     * choice the customizer must not try to composite.
     */
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

        $photos = $garment['photos'] ?? null;
        $shoots = $photos !== null && $photos['attribute'] === $attribute['slug']
            ? $photos['options']
            : [];

        $category = LayerCategory::updateOrCreate(
            ['customizer_product_id' => $product->id, 'slug' => $attribute['slug']],
            [
                'name' => $attribute['name'],
                'children_label' => null,
                'z_index' => $order + 1,
                'is_required' => true,
                // Real colour photography — never tint it with a fabric swatch.
                'is_colorable' => false,
                'is_preview_layer' => $shoots !== [],
                'display_order' => $order,
            ],
        );

        // A photographed garment opens on the option its shoot leads with, and
        // pins the cut those photographs show; otherwise the line-wide default
        // applies. Any of them can have been filtered out for this garment (a
        // camisole has no 'short' sleeve), so fall back through to the first
        // surviving option.
        $default = $this->firstAvailable([
            $shoots !== [] ? $photos['default'] : null,
            $photos['depicts'][$attribute['slug']] ?? null,
            $attribute['default'],
        ], $slugs) ?? $slugs[0];

        // The options the photography shows: every photographed sleeve, or the
        // single value the shoot pins on a labelled attribute. The base price
        // buys the garment as it was photographed — the same tee, cut
        // differently at the shoulder — so none of them carries a surcharge and
        // only deviating from the shoot costs extra. Keeps the opening total
        // equal to the "starting from" price on the garment card.
        $free = $shoots !== []
            ? array_keys($shoots)
            : array_filter([$photos['depicts'][$attribute['slug']] ?? null]);

        // Narrowing can remove every zero-cost option — an Off-shoulder Top has
        // no plain neckline, a Tunic no short length — which left base_price
        // advertised on the card but unreachable in the customizer. Modifiers
        // are relative to the cheapest choice this garment actually offers, so
        // "Starting from" is always a price someone can pay. Garments that keep
        // a zero-cost option subtract nothing and are unaffected.
        $cheapest = min(array_map(fn (string $s) => $attribute['options'][$s][1], $slugs));

        foreach ($slugs as $index => $slug) {
            [$label, $priceModifier] = $attribute['options'][$slug];
            $priceModifier = in_array($slug, $free, true) ? 0 : $priceModifier - $cheapest;

            $shot = isset($shoots[$slug]);
            $cover = fn (string $view) => $shot
                ? self::photoPath($photos, $slug, $photos['cover'], $view)
                : null;

            $option = LayerOption::updateOrCreate(
                ['layer_category_id' => $category->id, 'slug' => $slug],
                [
                    'parent_option_id' => null,
                    'name' => $label,
                    'image_path' => $cover('front'),
                    'thumbnail_path' => $cover('front'),
                    'back_image_path' => $cover('back'),
                    'left_image_path' => $cover('left'),
                    'right_image_path' => $cover('right'),
                    'color_hex' => null,
                    // What the photograph shows besides this option, so the
                    // canvas can withhold it once the customer specifies a
                    // garment the shoot never covered.
                    'depicts' => $shot ? $photos['depicts'] : null,
                    'price_modifier' => $priceModifier,
                    'is_default' => $slug === $default,
                    'is_active' => true,
                    'display_order' => $index,
                ],
            );

            $this->seedColors($option, $photos, $slug, $shoots[$slug] ?? null);
        }

        // A re-run with tightened restrictions retires the options that no longer
        // apply. Deactivating rather than deleting keeps saved designs resolvable.
        $category->allOptions()
            ->whereNotIn('slug', $slugs)
            ->update(['is_active' => false]);

        return true;
    }

    /**
     * The colourways of one option, or none when it is not photographed.
     *
     * Colours hang off the option rather than the garment because each shoot
     * has its own set — the puff sleeve was shot in 13 colours, the others in
     * 20 to 23 — and its own sampled hexes. Every sleeve leads with the same
     * cover colour, so the dots do not move when the customer changes sleeve.
     */
    private function seedColors(LayerOption $option, ?array $photos, string $slug, ?array $colors): void
    {
        if ($colors === null) {
            $option->colors()->delete();

            return;
        }

        $names = [];

        foreach ($colors as $index => $color) {
            $names[] = $color['name'];

            $option->colors()->updateOrCreate(
                ['name' => $color['name']],
                [
                    'color_hex' => $color['hex'],
                    'image_path' => self::photoPath($photos, $slug, $color['slug'], 'front'),
                    'back_image_path' => self::photoPath($photos, $slug, $color['slug'], 'back'),
                    'left_image_path' => self::photoPath($photos, $slug, $color['slug'], 'left'),
                    'right_image_path' => self::photoPath($photos, $slug, $color['slug'], 'right'),
                    'is_default' => $color['slug'] === $photos['cover'],
                    'display_order' => $index,
                ],
            );
        }

        // A colour dropped from the shoot must not linger as a dot pointing at
        // a file that is no longer served.
        $option->colors()->whereNotIn('name', $names)->delete();
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
