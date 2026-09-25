import { depictsSelection } from './depicts';
import type { LayerCategory, LayerOption, OptionColor } from '../../types/customizer';

/**
 * How a configuration becomes a photograph, shared by the designer (live
 * choices) and the tailor's view of an ordered design (stored choices), so the
 * two can never disagree about what the customer's garment looks like.
 */

/**
 * The spec line that carries the garment's colour. Orders placed before the
 * colour name was stored alongside the ids still have it here, which is how
 * their photograph is recovered.
 */
export const COLOUR_SPEC_ATTRIBUTE = 'Colour';

/** The option a category renders: the sub-selected child when there is one, else the selected parent. */
export function resolveEffectiveOption(
    category: LayerCategory,
    selections: Record<number, number>,
    subSelections: Record<number, number>,
): LayerOption | null {
    const parent = category.options.find(o => o.id === selections[category.id])
        ?? category.options.find(o => o.is_default)
        ?? category.options[0]
        ?? null;

    if (!parent) return null;

    if (parent.children && parent.children.length > 0) {
        const child = parent.children.find(c => c.id === subSelections[parent.id]) ?? parent.children[0];
        if (child) return child;
    }

    return parent;
}

/** The colour variant whose photographs replace an option's own, when it has colours. */
export function resolveOptionColor(option: LayerOption, colorSelections: Record<number, number>): OptionColor | null {
    if (!option.colors || option.colors.length === 0) return null;

    return option.colors.find(c => c.id === colorSelections[option.id])
        ?? option.colors.find(c => c.is_default)
        ?? option.colors[0];
}

/** The categories that paint a layer — the legacy collar picker and selector-only categories do not. */
export function previewCategories(layerCategories: LayerCategory[]): LayerCategory[] {
    return layerCategories.filter(c => c.slug !== 'collar' && c.is_preview_layer !== false);
}

/**
 * Whether the photographs show the garment as specified.
 *
 * Every painting category needs a photo, of this cut (see depictsSelection),
 * in the chosen colour. The shoots do not all cover the same colours; showing
 * an option's own default instead would repaint the garment a colour nobody
 * chose, so the photograph is withheld exactly as it is for a cut never shot.
 */
export function showsDesign(
    layerCategories: LayerCategory[],
    selections: Record<number, number>,
    resolveOption: (category: LayerCategory) => LayerOption | null,
    resolveColor: (option: LayerOption) => OptionColor | null,
    colorName: string | null | undefined,
): boolean {
    const options = previewCategories(layerCategories).map(resolveOption);

    return options.length > 0 && options.every(option =>
        option !== null
        && (resolveColor(option)?.image_url ?? option.image_url) !== null
        && depictsSelection(option, layerCategories, selections)
        && (!option.colors?.length || resolveColor(option)?.name === colorName),
    );
}
