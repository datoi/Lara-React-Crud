/**
 * PreviewCanvas — 2D layer compositor.
 *
 * Rendering model:
 *   All PNG layers share the same canvas dimensions and are pre-aligned by
 *   the art pipeline. Each <img> is position:absolute filling the container
 *   so they naturally stack on top of each other.
 *
 * z_index order (ascending = closer to viewer):
 *   1  Collar fabric   ← rendered first (behind)
 *   2  Collar buttons  ← detail overlay
 *   3  Sleeves         ← fabric layer
 *   4  Cuff buttons    ← detail overlay
 *   5  Body buttons    ← topmost detail
 *
 * Fabric colour tinting:
 *   The source PNGs are rendered in a neutral beige/ecru tone.
 *   We apply:
 *     filter: grayscale(1) brightness(1.15)
 *   to convert the beige to a clean greyscale shadow map, then
 *     mix-blend-mode: multiply
 *   over a container whose background-color is the selected fabric hex.
 *   Result: white highlights → pure fabric colour; dark fold shadows → darker
 *   version of the fabric colour — realistic 3-D drape preserved.
 *
 *   Button detail layers (is_colorable = false) are NOT greyscaled so their
 *   pearl/horn colour stays accurate regardless of fabric selection.
 */
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { LayerCategory, LayerOption, Fabric, GarmentView } from '../../types/customizer';

/** The option's image for a view, or null when the option has no photo for it */
export function viewImageUrl(option: LayerOption, view: GarmentView): string | null {
    switch (view) {
        case 'back':  return option.back_image_url;
        case 'left':  return option.left_image_url;
        case 'right': return option.right_image_url;
        default:      return option.image_url;
    }
}

interface PreviewCanvasProps {
    layerCategories: LayerCategory[];
    selections: Record<number, number>;
    selectedFabric: Fabric | null;
    loading?: boolean;
    /** Camera angle to render; layers missing the view fall back to their front image */
    view?: GarmentView;
    /** If provided, used to resolve the effective option (parent or child) per category */
    resolveOption?: (category: LayerCategory) => LayerOption | null;
}

export default function PreviewCanvas({
    layerCategories,
    selections,
    selectedFabric,
    loading = false,
    view = 'front',
    resolveOption,
}: PreviewCanvasProps) {
    // Sort ascending: lowest z_index renders first (behind)
    const sorted = useMemo(
        () => [...layerCategories].sort((a, b) => a.z_index - b.z_index),
        [layerCategories],
    );

    // Resolve which image variant to show on the sleeves layer, driven by the
    // "collar" selector category.  Uses display_order instead of slug so the
    // same logic works for any product (woman shirt, woman's top, etc.):
    //   display_order 0 → standard  → image_url
    //   display_order 1 → alt1      → thumbnail_url
    //   display_order 2 → alt2      → alt_image_url
    // collarScale is applied as a CSS scale() transform to normalise photos
    // taken at different zoom levels (stored per collar option in DB).
    const { collarVariant, collarScale } = useMemo((): {
        collarVariant: 'standard' | 'alt1' | 'alt2';
        collarScale: number;
    } => {
        const collarCat = layerCategories.find(c => c.slug === 'collar');
        if (!collarCat) return { collarVariant: 'standard', collarScale: 1 };
        const selectedId = selections[collarCat.id];
        const selected = collarCat.options.find(o => o.id === selectedId)
            ?? collarCat.options.find(o => o.is_default);
        const scale   = selected?.display_scale ?? 1;
        const variant = selected?.display_order === 2 ? 'alt2'
                      : selected?.display_order === 1 ? 'alt1'
                      : 'standard';
        return { collarVariant: variant, collarScale: scale };
    }, [layerCategories, selections]);

    if (loading) {
        return (
            <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center">
                    <div className="w-32 h-4 bg-slate-200 rounded" />
                    <div className="w-24 h-4 bg-slate-200 rounded" />
                </div>
            </div>
        );
    }

    // The container background colour IS the fabric tint source.
    // Greyscaled + brightened PNGs multiply against it to produce the
    // final fabric colour while preserving fold shadows.
    const canvasBackground = selectedFabric?.color_hex ?? 'transparent';

    return (
        <div
            className="relative w-full h-56 sm:h-72 lg:h-auto lg:aspect-[3/4] lg:max-h-[calc(100vh-10rem)]"
            style={{ backgroundColor: canvasBackground }}
            role="img"
            aria-label={`Shirt preview${selectedFabric ? ` in ${selectedFabric.name}` : ''}`}
        >
            {sorted.map(category => {
                // Selector-only categories (and the legacy collar picker) paint no layer
                if (category.slug === 'collar' || category.is_preview_layer === false) return null;

                // Resolve effective option: uses child sub-selection when available
                const option = resolveOption
                    ? resolveOption(category)
                    : (() => {
                        const selectedOptionId = selections[category.id];
                        const parent = category.options.find(o => o.id === selectedOptionId)
                            ?? category.options.find(o => o.is_default)
                            ?? category.options[0];
                        if (!parent) return null;
                        // Legacy collar-variant system
                        if (category.slug === 'sleeves') return parent;
                        return parent;
                    })();

                if (!option) return null;

                // Legacy collar-variant image switching (only when resolveOption not provided)
                let src = option.image_url;
                if (!resolveOption && category.slug === 'sleeves') {
                    if (collarVariant === 'alt1') src = option.thumbnail_url;
                    else if (collarVariant === 'alt2') src = option.alt_image_url ?? option.image_url;
                }

                // Rotation view — falls back to the front image when this layer has no photo for the angle
                if (view !== 'front') {
                    src = viewImageUrl(option, view) ?? src;
                }

                return (
                    <AnimatePresence mode="popLayout" key={category.id}>
                        <motion.img
                            key={`${category.id}-${option.id}-${view}`}
                            src={src}
                            alt={`${category.name}: ${option.name}`}
                            draggable={false}
                            className="absolute inset-0 w-full h-full object-scale-down object-[center_25%] pointer-events-none select-none"
                            style={{
                                zIndex: category.z_index,
                                filter: category.is_colorable
                                    ? 'grayscale(1) brightness(1.15)'
                                    : undefined,
                                mixBlendMode: category.is_colorable ? 'multiply' : undefined,
                                transform: !resolveOption && category.slug === 'sleeves' && collarScale !== 1
                                    ? `scale(${collarScale})`
                                    : undefined,
                                transformOrigin: 'center top',
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                        />
                    </AnimatePresence>
                );
            })}
        </div>
    );
}
