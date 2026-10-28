import type { LayerOption } from '../../types/customizer';

/** A colour the garment can be made in, as the customer picks it. */
export interface GarmentColor {
    name: string;
    hex: string;
}

/**
 * The colours the garment can be made in as it is now specified.
 *
 * Colour rows hang off the options that carry the photography — each sleeve
 * shoot has its own set, and one colour word can differ in shade between them
 * because they are separate dye lots. `shown` is the options currently painting
 * the canvas, and a colour is offered only when every one of them was
 * photographed in it, so the picker never holds a colour the stage could only
 * answer with a placeholder (owner's rule, 2026-10-28). Changing sleeve can
 * therefore change the list: Emerald is Cap's alone, and Rolled Cuff has no Red.
 *
 * The hex is the shown option's own, so the chip matches the photograph on
 * screen. Ordered by display_order, which the catalogue numbers from one fixed
 * palette, so a colour keeps its place as the customer changes sleeve.
 */
export function garmentColors(shown: LayerOption[]): GarmentColor[] {
    const shoots = shown.map(option => option.colors ?? []).filter(colours => colours.length > 0);
    if (shoots.length === 0) return [];

    return shoots[0]
        .filter(colour => shoots.every(colours => colours.some(c => c.name === colour.name)))
        .sort((a, b) => a.display_order - b.display_order)
        .map(colour => ({ name: colour.name, hex: colour.color_hex }));
}
