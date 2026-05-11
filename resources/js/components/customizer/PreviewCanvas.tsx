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
import type { LayerCategory, Fabric } from '../../types/customizer';

interface PreviewCanvasProps {
    layerCategories: LayerCategory[];
    selections: Record<number, number>;
    selectedFabric: Fabric | null;
    loading?: boolean;
}

export default function PreviewCanvas({
    layerCategories,
    selections,
    selectedFabric,
    loading = false,
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
    const canvasBackground = selectedFabric?.color_hex ?? '#F5F0EB';

    return (
        <div
            className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
            style={{ backgroundColor: canvasBackground }}
            role="img"
            aria-label={`Shirt preview${selectedFabric ? ` in ${selectedFabric.name}` : ''}`}
        >
            {sorted.map(category => {
                // Collar is a pure UI selector — it has no canvas layer of its own.
                // Its selection is consumed above to drive the usePeterPan flag.
                if (category.slug === 'collar') return null;

                const selectedOptionId = selections[category.id];
                const option =
                    category.options.find(o => o.id === selectedOptionId) ??
                    category.options.find(o => o.is_default) ??
                    category.options[0];

                if (!option) return null;

                // For sleeve layers, pick the image that matches the active collar variant.
                let src = option.image_url;
                if (category.slug === 'sleeves') {
                    if (collarVariant === 'alt1') src = option.thumbnail_url;
                    else if (collarVariant === 'alt2') src = option.alt_image_url ?? option.image_url;
                }

                return (
                    <AnimatePresence mode="popLayout" key={category.id}>
                        <motion.img
                            key={`${category.id}-${option.id}-${collarVariant}`}
                            src={src}
                            alt={`${category.name}: ${option.name}`}
                            draggable={false}
                            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
                            style={{
                                zIndex: category.z_index,
                                // Colorable layers (collar, sleeves) are greyscaled so
                                // the multiply blend produces a clean hue from the container.
                                // Non-colorable detail layers (buttons) stay in their
                                // natural colour so pearl/horn accuracy is preserved.
                                filter: category.is_colorable
                                    ? 'grayscale(1) brightness(1.15)'
                                    : undefined,
                                mixBlendMode: category.is_colorable ? 'multiply' : undefined,
                                // Scale sleeve images to normalise different photo zoom levels.
                                // The scale value comes from the active collar option's
                                // display_scale field (set per photo batch in the seeder).
                                transform: category.slug === 'sleeves' && collarScale !== 1
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
