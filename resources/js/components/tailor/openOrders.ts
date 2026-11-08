import type { TFunction } from 'i18next';
import type { Fabric, LayerCategory } from '../../types/customizer';
import { COLOUR_SPEC_ATTRIBUTE } from '../customizer/designPhoto';
import { readProductName, readSpec } from '../DesignSpecList';

/** What a studio design is photographed from: the garment's layers and fabrics. */
export interface StudioProduct {
    layer_categories: LayerCategory[];
    fabrics: Fabric[];
}

/** An unassigned custom or remodel order, as `GET /api/tailor/open-orders` returns it. */
export interface OpenOrderDesign {
    garment_type?: string;
    clothingType?: string;
    design_file_url?: string | null;
    tailor_notes?: string;
    customization_request?: string;
    /** Studio configuration: raw ids plus a readable spec snapshot */
    customization?: unknown;
    change_request?: string;
    remodel_images?: string[];
}

export interface OpenOrder {
    id: number;
    order_number: string;
    order_type?: string;
    created_at: string;
    custom_design_data: OpenOrderDesign | null;
    expected_price?: number | null;
    /** Calendar day (`YYYY-MM-DD`) the customer would like it ready by */
    needed_by: string | null;
    /** How many measurements the customer gave; the values reach only the tailor they choose */
    measurements_count: number;
    /** First name only, until a tailor is chosen */
    customer: { name: string };
    requests_count: number;
    my_request_status: 'pending' | 'accepted' | 'declined' | null;
}

/** The choices a studio design was ordered with — enough to photograph it again. */
export interface StudioChoices {
    product_slug: string;
    selections: Record<number, number>;
    sub_selections: Record<number, number>;
    color_selections: Record<number, number>;
    color_name: string | null;
    fabric_id: number | null;
}

const isIdMap = (value: unknown): value is Record<number, number> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Read the studio choices out of an order's stored customization. Null for
 * anything that is not a studio design — an uploaded file, a remodel, or an
 * order placed before the product was recorded with it.
 */
export function readStudioChoices(customization: unknown): StudioChoices | null {
    if (!customization || typeof customization !== 'object') return null;
    const c = customization as Record<string, unknown>;
    if (typeof c.product_slug !== 'string' || !isIdMap(c.selections)) return null;

    return {
        product_slug: c.product_slug,
        selections: c.selections,
        sub_selections: isIdMap(c.sub_selections) ? c.sub_selections : {},
        color_selections: isIdMap(c.color_selections) ? c.color_selections : {},
        // Orders used to drop color_name on the way in, keeping only the
        // spec's readable colour line — so that line stands in when it is absent.
        color_name: typeof c.color_name === 'string'
            ? c.color_name
            : readSpec(customization).find(line => line.attribute === COLOUR_SPEC_ATTRIBUTE)?.option ?? null,
        fabric_id: typeof c.fabric_id === 'number' ? c.fabric_id : null,
    };
}

export const GARMENT_KEYS: Record<string, string> = {
    'shirt':      'orderReview.garment_shirt',
    'womens-top': 'orderReview.garment_womensTop',
    'dress':      'orderReview.garment_dress',
    'trousers':   'orderReview.garment_trousers',
    'jacket':     'orderReview.garment_jacket',
    'skirt':      'orderReview.garment_skirt',
    'coat':       'orderReview.garment_coat',
};

/** A request named for a tailor: a remodel, the studio garment, or the garment heading. */
export function openOrderTitle(order: Pick<OpenOrder, 'order_type' | 'custom_design_data'>, t: TFunction): string {
    if (order.order_type === 'remodel') return t('tailorComponents.remodelBadge');
    const design = order.custom_design_data;
    const garmentKey = design?.garment_type ?? design?.clothingType ?? '';
    return readProductName(design?.customization)
        ?? ((GARMENT_KEYS[garmentKey] ? t(GARMENT_KEYS[garmentKey]) : garmentKey) || t('tailorComponents.customDesignBadge'));
}

/** An estimate the tailor sent Kere, as `GET /api/tailor/requests` returns it. */
export interface SentEstimate {
    id: number;
    offered_price: number | null;
    ready_in_days: number | null;
    message: string | null;
    sent_at: string;
    state: 'waiting' | 'offered' | 'chosen' | 'not_chosen' | 'closed';
    order: Omit<OpenOrder, 'requests_count' | 'my_request_status'>;
}

export const isImageUrl = (url: string | null | undefined): url is string =>
    !!url && /\.(jpe?g|png|webp|svg)$/i.test(url);
