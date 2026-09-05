import type { LayerCategory, LayerOption } from '../../types/customizer';

/** A colour the garment can be made in, as the customer picks it. */
export interface GarmentColor {
    name: string;
    hex: string;
}

function eachOption(layerCategories: LayerCategory[], visit: (option: LayerOption) => void): void {
    const walk = (option: LayerOption) => {
        visit(option);
        option.children?.forEach(walk);
    };
    for (const category of layerCategories) category.options.forEach(walk);
}

/**
 * The garment's colours, as one list.
 *
 * Colour rows hang off the option that carries the photography — each sleeve
 * shoot has its own set, and one colour word can differ in shade between them
 * because they are separate dye lots. The customer is choosing the colour of a
 * garment, not of a sleeve, so the picker is the union of those sets keyed by
 * name, in the order the catalogue lists them.
 *
 * `shown` is the options currently painting the canvas: their hexes win, so the
 * chip matches the photograph on screen. A colour that shoot never covered
 * keeps the first hex found for it.
 *
 * Ordered by each colour's own place in the catalogue rather than by which
 * shoot happened to introduce it. Taking them first-seen put Green last, after
 * Purple, purely because the first sleeve was shot in Emerald instead — every
 * shoot lists its colours in the same canonical sequence, so the lowest
 * display_order a colour holds anywhere is its place in the palette.
 */
export function garmentColors(layerCategories: LayerCategory[], shown: LayerOption[] = []): GarmentColor[] {
    const byName = new Map<string, { hex: string; order: number; seen: number }>();
    let seen = 0;

    eachOption(layerCategories, option => {
        for (const colour of option.colors ?? []) {
            const existing = byName.get(colour.name);
            if (!existing) {
                byName.set(colour.name, { hex: colour.color_hex, order: colour.display_order, seen: seen++ });
            } else if (colour.display_order < existing.order) {
                existing.order = colour.display_order;
            }
        }
    });

    // Only the shade is restated — the order is fixed above, so the palette
    // never rearranges itself under the customer as they change sleeve.
    for (const option of shown) {
        for (const colour of option.colors ?? []) {
            const existing = byName.get(colour.name);
            if (existing) existing.hex = colour.color_hex;
        }
    }

    return [...byName]
        .sort(([, a], [, b]) => a.order - b.order || a.seen - b.seen)
        .map(([name, { hex }]) => ({ name, hex }));
}

