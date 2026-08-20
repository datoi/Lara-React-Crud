/**
 * Garment taxonomy — the top level of the design studio.
 *
 * Hierarchy:  Section → Category → Garment → Attribute → Option
 *                        ^^^^^^^^   (this file)   (customizer_products / layer_categories / layer_options)
 *
 * Only the Category level lives in the frontend, because it is navigation
 * rather than catalogue data. Everything below it comes from the API so
 * garments and their attributes stay editable in the customizer admin.
 */

import type { Section } from '../hooks/useSection';

export interface GarmentCategory {
    /** Navigation key — mirrored in the URL as ?cat= */
    key: string;
    /** i18n key for the display label */
    tKey: string;
    /**
     * customizer_products.category values filed under this heading. A heading
     * may cover more than one so regrouping the studio never orphans garments
     * catalogued under an older key.
     */
    productCategories: string[];
    /**
     * Written to draft.garment_type — drives tailor matching
     * (/api/tailors?garment_type=) and the order-review label. Kept on the
     * established keys so the downstream order flow is unaffected by regrouping.
     */
    orderKey: string;
    /** Cut-out artwork. Categories without art render a typographic card instead. */
    image?: string;
    /** Placeholder shown on a garment card that has no preview photo */
    emoji: string;
}

const ART = '/assets/design-categories';

const WOMEN: GarmentCategory[] = [
    { key: 'tops',             tKey: 'design.cat_tops',            productCategories: ['tops', 'shirt'],          orderKey: 'shirt',    image: `${ART}/shirt-cutout.png`,    emoji: '👕' },
    { key: 'bottoms',          tKey: 'design.cat_bottoms',         productCategories: ['bottoms', 'trousers'],    orderKey: 'trousers', image: `${ART}/trousers-cutout.png`, emoji: '👖' },
    { key: 'skirts',           tKey: 'design.cat_skirts',          productCategories: ['skirts', 'skirt'],        orderKey: 'skirt',    image: `${ART}/skirt-cutout.png`,    emoji: '🩱' },
    { key: 'dresses',          tKey: 'design.cat_dresses',         productCategories: ['dresses', 'dress'],       orderKey: 'dress',    image: `${ART}/dress-cutout.png`,    emoji: '👗' },
    { key: 'evening-dresses',  tKey: 'design.cat_eveningDresses',  productCategories: ['evening-dresses'],        orderKey: 'dress',                                        emoji: '👗' },
    { key: 'jumpsuits',        tKey: 'design.cat_jumpsuits',       productCategories: ['jumpsuits'],              orderKey: 'jumpsuits',                                    emoji: '🩳' },
    { key: 'suits',            tKey: 'design.cat_suits',           productCategories: ['suits'],                  orderKey: 'suits',                                        emoji: '🥻' },
    { key: 'blazers',          tKey: 'design.cat_blazers',         productCategories: ['blazers', 'jacket', 'coat'], orderKey: 'jacket',  image: `${ART}/jacket-cutout.png`,   emoji: '🧥' },
];

const MEN: GarmentCategory[] = [
    { key: 'shirt',    tKey: 'design.cat_shirt',    productCategories: ['shirt'],    orderKey: 'shirt',    image: `${ART}/shirt-cutout.png`,    emoji: '👔' },
    { key: 'trousers', tKey: 'design.cat_trousers', productCategories: ['trousers'], orderKey: 'trousers', image: `${ART}/trousers-cutout.png`, emoji: '👖' },
    { key: 'jacket',   tKey: 'design.cat_jacket',   productCategories: ['jacket'],   orderKey: 'jacket',   image: `${ART}/jacket-cutout.png`,   emoji: '🧥' },
    { key: 'coat',     tKey: 'design.cat_coat',     productCategories: ['coat'],     orderKey: 'coat',     image: `${ART}/coat-cutout.png`,     emoji: '🧤' },
];

const SECTION_CATEGORIES: Record<Section, GarmentCategory[]> = { women: WOMEN, men: MEN };

export function categoriesFor(section: Section): GarmentCategory[] {
    return SECTION_CATEGORIES[section];
}

export function findCategory(section: Section, key: string | null | undefined): GarmentCategory | undefined {
    if (!key) return undefined;
    return SECTION_CATEGORIES[section].find(c => c.key === key);
}

/** The heading a catalogued garment belongs under — used to rebuild a breadcrumb from a product. */
export function categoryForProduct(section: Section, productCategory: string): GarmentCategory | undefined {
    return SECTION_CATEGORIES[section].find(c => c.productCategories.includes(productCategory));
}
