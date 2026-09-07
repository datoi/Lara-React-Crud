import type { LayerCategory, LayerOption } from '../../types/customizer';

/** The option a category is currently on, resolved the way useCustomizer does. */
function selectedSlug(category: LayerCategory, selections: Record<number, number>): string | null {
    const option = category.options.find(o => o.id === selections[category.id])
        ?? category.options.find(o => o.is_default)
        ?? category.options[0];

    return option?.slug ?? null;
}

/**
 * Whether a photographed option is a picture of the garment being configured.
 *
 * A photograph shows more than the option it is filed under: every T-shirt
 * sleeve was shot on a body-fitting, cropped, crew-neck tee. Ask for a longline
 * V-neck and the photograph describes a garment the customer is not buying, so
 * the option declares the rest of the cut it depicts and the canvas withholds
 * it rather than showing the wrong tee.
 *
 * An option with nothing to declare — every labelled choice, and any photograph
 * that holds whatever else is selected — always matches.
 */
export function depictsSelection(
    option: LayerOption,
    layerCategories: LayerCategory[],
    selections: Record<number, number>,
): boolean {
    if (!option.depicts) return true;

    return Object.entries(option.depicts).every(([categorySlug, optionSlug]) => {
        const category = layerCategories.find(c => c.slug === categorySlug);

        // An attribute this garment does not offer cannot contradict the photo.
        return category === undefined || selectedSlug(category, selections) === optionSlug;
    });
}
