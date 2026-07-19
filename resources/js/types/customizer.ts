// ─── API response shapes ─────────────────────────────────────────────────────

export interface LayerOption {
    id: number;
    name: string;
    slug: string;
    image_url: string;
    thumbnail_url: string;
    /** Third collar variant (e.g. mandarin) — null for options that have no alternate */
    alt_image_url: string | null;
    /** Rotation views — null when the option only has a front photo */
    back_image_url: string | null;
    left_image_url: string | null;
    right_image_url: string | null;
    /** Dot colour for swatch-style pickers — null renders as an image thumbnail */
    color_hex: string | null;
    /** CSS scale factor to normalise photos taken at different zoom levels (default 1.0) */
    display_scale: number;
    price_modifier: number;
    is_default: boolean;
    display_order: number;
    /** Sub-options (e.g. collar variants for a specific sleeve type) */
    children?: LayerOption[];
}

export interface LayerCategory {
    id: number;
    name: string;
    /** Label for the sub-styles section (e.g. "Collar") */
    children_label: string | null;
    slug: string;
    /** Lower value renders behind higher value — layer 1 is the bottom silhouette */
    z_index: number;
    is_required: boolean;
    /** When true, the active fabric color is CSS-tinted over this layer */
    is_colorable: boolean;
    /** When false, the category is a selector only — its options never paint a canvas layer */
    is_preview_layer: boolean;
    display_order: number;
    options: LayerOption[];
}

export interface Fabric {
    id: number;
    name: string;
    color_hex: string;
    /** URL to a tileable texture PNG, or null for solid color only */
    texture_url: string | null;
    price_modifier: number;
    display_order: number;
}

export interface CustomizerProduct {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string | null;
    base_price: number;
    preview_image_url: string | null;
    layer_categories: LayerCategory[];
    fabrics: Fabric[];
}

export interface SavedDesign {
    id: number;
    name: string;
    configuration: DesignConfiguration;
    preview_url: string | null;
    product: Pick<CustomizerProduct, 'id' | 'name' | 'slug'>;
    created_at: string;
    updated_at: string;
}

// ─── Engine state ─────────────────────────────────────────────────────────────

/** Camera angle shown on the preview canvas */
export type GarmentView = 'front' | 'back' | 'left' | 'right';

/**
 * The live configuration state held in useCustomizer.
 * selections maps layer_category.id → layer_option.id
 */
export interface DesignConfiguration {
    selections: Record<number, number>;
    fabric_id: number | null;
}

export interface PreviewResult {
    base_price: number;
    option_modifiers: number;
    fabric_modifier: number;
    total: number;
    selections: Record<number, number>;
    fabric_id: number | null;
}
