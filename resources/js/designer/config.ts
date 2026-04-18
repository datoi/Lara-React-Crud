/**
 * Kere Designer — Central Configuration
 *
 * Single source of truth for all garment types, fabrics, components, and
 * design details. Import from here instead of defining options inline.
 */

// ─── Core types ───────────────────────────────────────────────────────────────

export type GarmentType = 'dress' | 'shirt' | 'pants' | 'jacket' | 'skirt' | 'coat';

export type DesignConfig = {
    garmentType:  GarmentType | null;
    style:        string;          // subcategory value, e.g. "maxi", "blazer"
    fabric:       string;          // fabric value, e.g. "cotton"
    baseColor:    string;          // hex
    accentColor:  string;          // hex
    components: {
        neckline:  string;
        sleeves:   string;
        length:    string;
    };
    details:      string[];        // design detail values, e.g. ["pocket", "embroidery"]
    sizeStandard: string;
    sizeCm: {
        chest:   string;
        waist:   string;
        hips:    string;
        length:  string;
        inseam:  string;
    };
    height: string;
    notes:  string;
};

export const INITIAL_CONFIG: DesignConfig = {
    garmentType:  null,
    style:        '',
    fabric:       '',
    baseColor:    '#475569',
    accentColor:  '#E2E8F0',
    components: { neckline: '', sleeves: '', length: '' },
    details:      [],
    sizeStandard: 'M',
    sizeCm:       { chest: '', waist: '', hips: '', length: '', inseam: '' },
    height:       '',
    notes:        '',
};

// ─── Garment types ────────────────────────────────────────────────────────────

export interface StyleOption {
    value:       string;
    label:       string;
    description: string;
}

export interface GarmentDefinition {
    type:        GarmentType;
    label:       string;
    emoji:       string;
    description: string;
    allowedComponents: Array<'neckline' | 'sleeves' | 'length'>;
    styles:      StyleOption[];
}

export const GARMENTS: GarmentDefinition[] = [
    {
        type:        'dress',
        label:       'Dress',
        emoji:       '👗',
        description: 'Custom-made dress for any occasion',
        allowedComponents: ['neckline', 'sleeves', 'length'],
        styles: [
            { value: 'maxi',    label: 'Maxi',    description: 'Floor-length, flowing silhouette' },
            { value: 'midi',    label: 'Midi',    description: 'Calf-length, versatile everyday' },
            { value: 'mini',    label: 'Mini',    description: 'Above the knee, youthful and casual' },
            { value: 'a-line',  label: 'A-Line',  description: 'Fitted at top, flared at bottom' },
            { value: 'wrap',    label: 'Wrap',    description: 'Cross-front, adjustable silhouette' },
        ],
    },
    {
        type:        'shirt',
        label:       'Shirt / Top',
        emoji:       '👔',
        description: 'Tops made to your exact fit',
        allowedComponents: ['neckline', 'sleeves'],
        styles: [
            { value: 'button-down', label: 'Button-Down', description: 'Classic collared dress shirt' },
            { value: 'blouse',      label: 'Blouse',      description: 'Soft, elegant, feminine cut' },
            { value: 'polo',        label: 'Polo',        description: 'Smart casual with collar' },
            { value: 'henley',      label: 'Henley',      description: 'Collarless with button placket' },
            { value: 't-shirt',     label: 'T-Shirt',     description: 'Casual everyday tee' },
        ],
    },
    {
        type:        'pants',
        label:       'Trousers',
        emoji:       '👖',
        description: 'Tailored trousers and bottoms',
        allowedComponents: ['length'],
        styles: [
            { value: 'dress-pants', label: 'Dress Pants', description: 'Formal, perfectly tailored' },
            { value: 'chinos',      label: 'Chinos',      description: 'Cotton twill, smart casual' },
            { value: 'wide-leg',    label: 'Wide Leg',    description: 'Relaxed, flowing silhouette' },
            { value: 'slim-fit',    label: 'Slim Fit',    description: 'Narrow cut, modern look' },
            { value: 'joggers',     label: 'Joggers',     description: 'Comfortable, tapered casual' },
        ],
    },
    {
        type:        'jacket',
        label:       'Jacket',
        emoji:       '🧥',
        description: 'Custom jackets and outerwear',
        allowedComponents: ['sleeves', 'length'],
        styles: [
            { value: 'blazer',      label: 'Blazer',      description: 'Structured, smart tailoring' },
            { value: 'bomber',      label: 'Bomber',      description: 'Casual, ribbed-cuff style' },
            { value: 'trench',      label: 'Trench',      description: 'Long, belted, timeless classic' },
            { value: 'windbreaker', label: 'Windbreaker', description: 'Light, water-resistant shell' },
        ],
    },
    {
        type:        'skirt',
        label:       'Skirt',
        emoji:       '👗',
        description: 'Handcrafted skirts in any length',
        allowedComponents: ['length'],
        styles: [
            { value: 'a-line',   label: 'A-Line',  description: 'Classic flare from the waist' },
            { value: 'pencil',   label: 'Pencil',  description: 'Fitted, straight cut' },
            { value: 'pleated',  label: 'Pleated', description: 'Structured pleats for volume' },
            { value: 'wrap',     label: 'Wrap',    description: 'Adjustable tie closure' },
            { value: 'maxi',     label: 'Maxi',    description: 'Floor-length, flowing style' },
        ],
    },
    {
        type:        'coat',
        label:       'Coat',
        emoji:       '🥼',
        description: 'Winter coats crafted to perfection',
        allowedComponents: ['sleeves', 'length'],
        styles: [
            { value: 'overcoat', label: 'Overcoat',  description: 'Classic long formal coat' },
            { value: 'parka',    label: 'Parka',     description: 'Hooded, warm winter coat' },
            { value: 'pea-coat', label: 'Pea Coat',  description: 'Double-breasted, nautical' },
            { value: 'cape',     label: 'Cape',      description: 'Sleeveless, draped style' },
        ],
    },
];

export function getGarment(type: GarmentType | null): GarmentDefinition | undefined {
    return GARMENTS.find(g => g.type === type);
}

// ─── Fabrics ──────────────────────────────────────────────────────────────────

export interface FabricOption {
    value:       string;
    label:       string;
    description: string;
    feel:        string;   // short tactile descriptor, shown as tag
    premium:     number;   // extra ₾ added to base price
}

export const FABRICS: FabricOption[] = [
    { value: 'cotton',   label: 'Cotton',   description: 'Breathable everyday comfort',       feel: 'Soft',       premium: 0   },
    { value: 'linen',    label: 'Linen',    description: 'Light, perfect for warm weather',   feel: 'Breezy',     premium: 20  },
    { value: 'silk',     label: 'Silk',     description: 'Luxurious, smooth, elegant drape',  feel: 'Smooth',     premium: 80  },
    { value: 'wool',     label: 'Wool',     description: 'Warm, structured, winter-ready',    feel: 'Cozy',       premium: 60  },
    { value: 'denim',    label: 'Denim',    description: 'Durable, casual classic',           feel: 'Sturdy',     premium: 15  },
    { value: 'velvet',   label: 'Velvet',   description: 'Rich, deep texture, evening wear',  feel: 'Luxurious',  premium: 70  },
    { value: 'chiffon',  label: 'Chiffon',  description: 'Sheer, flowing, delicate look',     feel: 'Sheer',      premium: 30  },
    { value: 'cashmere', label: 'Cashmere', description: 'Ultra-soft, premium warmth',        feel: 'Ultra-soft', premium: 120 },
];

// ─── Style Components ─────────────────────────────────────────────────────────

export interface ComponentChoice {
    value:       string;
    label:       string;
    hint:        string;
}

export const COMPONENTS: Record<'neckline' | 'sleeves' | 'length', ComponentChoice[]> = {
    neckline: [
        { value: 'v-neck',        label: 'V-Neck',      hint: 'Opens at the front in a V shape' },
        { value: 'crew',          label: 'Crew',        hint: 'Rounded, close to the neck' },
        { value: 'scoop',         label: 'Scoop',       hint: 'Low, rounded neckline' },
        { value: 'square',        label: 'Square',      hint: 'Straight horizontal cut' },
        { value: 'collar',        label: 'Collar',      hint: 'Formal fold-over or standing collar' },
    ],
    sleeves: [
        { value: 'sleeveless',    label: 'Sleeveless',  hint: 'No sleeves, bare arms' },
        { value: 'short',         label: 'Short',       hint: 'Above the elbow' },
        { value: 'long',          label: 'Long',        hint: 'Full arm length' },
        { value: 'three-quarter', label: '¾ Length',    hint: 'Between elbow and wrist' },
        { value: 'bell',          label: 'Bell',        hint: 'Flares out from the elbow' },
    ],
    length: [
        { value: 'crop',          label: 'Crop',        hint: 'Above the waist' },
        { value: 'short',         label: 'Short',       hint: 'Mid-thigh length' },
        { value: 'knee',          label: 'Knee',        hint: 'At or near the knee' },
        { value: 'midi',          label: 'Midi',        hint: 'Mid-calf length' },
        { value: 'maxi',          label: 'Maxi',        hint: 'Floor-length' },
    ],
};

// ─── Design Details ───────────────────────────────────────────────────────────

export interface DetailOption {
    value:       string;
    label:       string;
    icon:        string;
    description: string;
    priceAddon:  number;
}

export const DESIGN_DETAILS: DetailOption[] = [
    { value: 'pocket',     label: 'Pocket',     icon: '🗂',  description: 'Functional front or side pocket',   priceAddon: 15 },
    { value: 'zipper',     label: 'Zipper',     icon: '🤐',  description: 'Decorative or functional zipper',   priceAddon: 10 },
    { value: 'buttons',    label: 'Buttons',    icon: '🔘',  description: 'Button detail or closure',           priceAddon: 10 },
    { value: 'pleats',     label: 'Pleats',     icon: '〰',  description: 'Structured pleated sections',        priceAddon: 20 },
    { value: 'ruffle',     label: 'Ruffle',     icon: '🌊',  description: 'Flowing ruffle trim or edges',       priceAddon: 25 },
    { value: 'belt-loop',  label: 'Belt Loop',  icon: '⬤',  description: 'Loops for a belt or sash',           priceAddon: 5  },
    { value: 'embroidery', label: 'Embroidery', icon: '🧵',  description: 'Custom stitched decoration',         priceAddon: 40 },
    { value: 'lace-trim',  label: 'Lace Trim',  icon: '🕸',  description: 'Delicate lace edge or panel',        priceAddon: 30 },
];

// ─── Size options ─────────────────────────────────────────────────────────────

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

// ─── Pricing ──────────────────────────────────────────────────────────────────

export const BASE_PRICES: Record<GarmentType, number> = {
    dress:   180,
    shirt:   90,
    pants:   120,
    jacket:  250,
    skirt:   100,
    coat:    320,
};

export function calcPrice(config: DesignConfig): { base: number; fabric: number; details: number; total: number } {
    const base    = config.garmentType ? (BASE_PRICES[config.garmentType] ?? 150) : 0;
    const fabric  = FABRICS.find(f => f.value === config.fabric)?.premium ?? 0;
    const details = config.details.reduce((sum, d) => {
        return sum + (DESIGN_DETAILS.find(opt => opt.value === d)?.priceAddon ?? 0);
    }, 0);
    return { base, fabric, details, total: base + fabric + details };
}
