/**
 * Customizer — top-level wrapper for the 2D layer-based clothing configurator.
 *
 * Layout:
 *   Left  — PreviewCanvas (stacked transparent PNG/SVG layers)
 *   Right — OptionPanel (tabs per category → option swatches + fabric picker)
 *            PriceSummary + Save/Order CTAs
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, ImageOff, RotateCcw, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import PreviewCanvas, { viewImageUrl } from './PreviewCanvas';
import ViewSwitcher from './ViewSwitcher';
import ColorDotPicker from './ColorDotPicker';
import OptionPanel from './OptionPanel';
import { categoryHasArtwork } from './CategoryOptions';
import PriceSummary from './PriceSummary';
import SaveDesignModal from './SaveDesignModal';
import { useCustomizer } from '../../hooks/useCustomizer';
import type { CustomizerProduct, Fabric, GarmentView, LayerCategory } from '../../types/customizer';

interface CustomizerProps {
    product: CustomizerProduct;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    /** Called when user proceeds to order */
    onOrder?: (configuration: ReturnType<ReturnType<typeof useCustomizer>['getConfiguration']>) => void;
}

export default function Customizer({
    product,
    layerCategories,
    fabrics,
    onOrder,
}: CustomizerProps) {
    const {
        selections,
        subSelections,
        colorSelections,
        fabricId,
        selectOption,
        selectSubOption,
        selectColor,
        selectFabric,
        reset,
        getConfiguration,
        totalPrice,
        resolveOption,
        resolveColor,
    } = useCustomizer({ basePrice: product.base_price, layerCategories, fabrics, persistKey: product.slug });
    const { t } = useTranslation();

    const [saveOpen, setSaveOpen]   = useState(false);
    const [savedName, setSavedName] = useState<string | null>(null);
    const [view, setView]           = useState<GarmentView>('front');
    // Which attribute the drill-down has open — the preview mirrors it.
    const [openAttributeId, setOpenAttributeId] = useState<number | null>(null);

    const selectedFabric = fabrics.find(f => f.id === fabricId) ?? null;

    const hasPanelContent = layerCategories.some(c => c.options.length > 0) || fabrics.length > 0;

    // Whether this garment has been photographed at all. Most Tops have not
    // been shot yet, so there is nothing for the canvas to composite.
    const hasPreviewLayers = layerCategories.some(c =>
        c.slug !== 'collar' && c.is_preview_layer !== false && c.options.some(o => o.image_url),
    );

    // The preview answers whatever the customer is currently looking at.
    // On the details list, and inside an attribute we have photographed (the
    // style/colour layer), it shows the garment. Inside an attribute with no
    // photography — fit, length, neckline, back, sleeves — a picture of the
    // photographed cut would not answer the question being asked, so a
    // placeholder takes its place until those are shot.
    const openAttribute = openAttributeId === null
        ? null
        : layerCategories.find(c => c.id === openAttributeId) ?? null;

    const showPhoto = hasPreviewLayers
        && (openAttribute === null || categoryHasArtwork(openAttribute));

    // Colour dot groups: one per category whose currently-selected style has colour variants
    const colorGroups = layerCategories
        .filter(c => c.slug !== 'collar')
        .map(category => ({ category, option: resolveOption(category) }))
        .filter((g): g is { category: LayerCategory; option: NonNullable<ReturnType<typeof resolveOption>> } =>
            g.option !== null && g.option.colors.length > 0,
        );

    // A view is offered only when every rendered layer has a photo for it,
    // so the composite never mixes angles. The selected colour's photos win.
    const availableViews = useMemo((): GarmentView[] => {
        const renderedSources = layerCategories
            .filter(c => c.slug !== 'collar' && c.is_preview_layer !== false)
            .map(c => resolveOption(c))
            .filter((o): o is NonNullable<typeof o> => o !== null)
            .map(o => resolveColor(o) ?? o);

        if (renderedSources.length === 0) return ['front'];

        return (['front', 'back', 'left', 'right'] as GarmentView[]).filter(v =>
            renderedSources.every(s => viewImageUrl(s, v) !== null),
        );
    }, [layerCategories, resolveOption, resolveColor]);

    // Picking a color/style that lacks the current angle snaps back to front
    useEffect(() => {
        if (!availableViews.includes(view)) setView('front');
    }, [availableViews, view]);

    /**
     * The cookie banner is fixed to the bottom of the viewport and was landing
     * on top of the order bar, hiding the price and the Order button until a
     * visitor dismissed it. Publish this bar's real height so the banner can
     * clear it. The bar is lg:hidden, so on desktop it measures 0 and the
     * banner sits flush with the bottom as before.
     */
    const bottomBarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const publish = () => {
            const h = bottomBarRef.current?.offsetHeight ?? 0;
            document.documentElement.style.setProperty('--kere-bottom-bar', `${h}px`);
        };
        publish();
        window.addEventListener('resize', publish);
        return () => {
            window.removeEventListener('resize', publish);
            document.documentElement.style.removeProperty('--kere-bottom-bar');
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-[1fr_420px] gap-8 items-start"
        >
            {/* ── Preview column ─────────────────────────────────────────────────
                Pinned on phones too, under the 4rem navbar. The options scroll
                beneath it, so a colour tap or an attribute change is always seen
                — previously the garment scrolled away and changes went unnoticed.
                Needs the page colour behind it or scrolling content shows through,
                and z-10 to sit under the z-50 navbar but over the panel. */}
            <div className="sticky top-16 z-10 bg-[var(--kere-page)] pb-2 lg:top-24 lg:z-auto lg:bg-transparent lg:pb-0">
                {showPhoto ? (
                    <PreviewCanvas
                        layerCategories={layerCategories}
                        selections={selections}
                        selectedFabric={selectedFabric}
                        view={view}
                        resolveOption={resolveOption}
                        resolveColor={resolveColor}
                    />
                ) : (
                    /* Same footprint as the canvas so the layout never jumps.
                       Dashed frame and icon so it reads as a placeholder we put
                       there on purpose, not a picture that failed to load. */
                    <div className="flex w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-white/40 px-6 text-center h-40 sm:gap-3 sm:h-72 lg:h-auto lg:aspect-[3/4] lg:max-h-[calc(100vh-10rem)]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-400 sm:h-12 sm:w-12">
                            <ImageOff className="h-4 w-4 stroke-[1.4] sm:h-5 sm:w-5" />
                        </span>
                        <p className="font-serif text-lg font-medium tracking-[-0.035em] text-slate-500 sm:text-2xl">
                            {t('customizer.previewComingSoon')}
                        </p>
                        <p className="max-w-[20rem] text-[11px] leading-snug text-slate-400 sm:text-xs sm:leading-relaxed">
                            {hasPreviewLayers
                                ? t('customizer.previewOptionsSoon')
                                : t('customizer.previewGarmentSoon')}
                        </p>
                    </div>
                )}
                {/* Fabric swatch label below preview */}
                {selectedFabric && showPhoto && (
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Fabric: <span className="font-medium text-slate-600">{selectedFabric.name}</span>
                    </p>
                )}
            </div>

            {/* ── Options column ─────────────────────────────────────────────── */}
            {/* Order note: on phones the preview sits above this column, so the
                colour picker is pulled up directly beneath the photo — tapping a
                colour is pointless if the garment is a screen and a half away.
                From lg the two columns sit side by side and the original order
                (details before colour) applies. Every child carries an explicit
                order because an unset one would collapse to 0 and jump to top. */}
            <div className="flex flex-col gap-5 pb-24 lg:pb-0">
                {/* Product header */}
                <div className="order-1">
                    <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                    {product.description && (
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            {product.description}
                        </p>
                    )}
                </div>

                {/* Option panel */}
                {hasPanelContent && (
                    <div className="order-4 bg-white rounded-2xl border border-slate-100 p-4 lg:order-2">
                        <OptionPanel
                            layerCategories={layerCategories}
                            fabrics={fabrics}
                            selections={selections}
                            subSelections={subSelections}
                            fabricId={fabricId}
                            openAttributeId={openAttributeId}
                            onOpenAttribute={setOpenAttributeId}
                            onSelectOption={selectOption}
                            onSelectSubOption={selectSubOption}
                            onSelectFabric={selectFabric}
                        />
                    </div>
                )}

                {/* Colour dot groups — colours of the currently selected style */}
                {colorGroups.map(({ category, option }) => (
                    <div key={`${category.id}-${option.id}`} className="order-3 bg-white rounded-2xl border border-slate-100 p-4 lg:order-4">
                        <ColorDotPicker
                            label={t('customizer.colorLabel')}
                            colors={option.colors}
                            selectedId={colorSelections[option.id] ?? option.colors.find(c => c.is_default)?.id ?? option.colors[0]?.id}
                            onSelect={colorId => selectColor(option.id, colorId)}
                        />
                    </div>
                ))}

                {/* Sits directly above the colour picker, so on phones it reads as
                    a caption under the pinned garment. Nothing to rotate while the
                    preview is a placeholder; the length guard mirrors
                    ViewSwitcher's own so the ordered wrapper never becomes an
                    empty flex item adding a gap. */}
                {showPhoto && availableViews.length > 1 && (
                    <div className="order-2 -mt-2 lg:order-3 lg:mt-0">
                        <ViewSwitcher views={availableViews} view={view} onChange={setView} />
                    </div>
                )}

                {/* Price summary — hidden on mobile (shown in sticky bar below) */}
                <div className="order-5 hidden lg:block">
                    <PriceSummary
                        basePrice={product.base_price}
                        layerCategories={layerCategories}
                        fabrics={fabrics}
                        selections={selections}
                        fabricId={fabricId}
                        totalPrice={totalPrice}
                    />
                </div>

                {/* Success toast */}
                {savedName && (
                    <p className="order-6 text-xs text-center text-slate-500">
                        ✓ "{savedName}" saved to your designs.
                    </p>
                )}

                {/* CTAs — desktop only (mobile uses sticky bar) */}
                <div className="order-7 hidden lg:flex gap-2">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={reset}
                        aria-label={t('customizer.reset')}
                        className="gap-1.5"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {t('customizer.reset')}
                    </Button>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setSaveOpen(true)}
                        className="gap-1.5 flex-1"
                    >
                        <Bookmark className="w-4 h-4" />
                        {t('customizer.saveDesign')}
                    </Button>
                    <Button
                        variant="default"
                        size="default"
                        onClick={() => onOrder?.(getConfiguration())}
                        className="gap-1.5 flex-1"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {t('customizer.orderPrice', { price: totalPrice.toFixed(2) })}
                    </Button>
                </div>
            </div>

            {/* ── Mobile sticky bottom bar ───────────────────────────────────── */}
            <div ref={bottomBarRef} className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{t('customizer.total')}</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight">₾{totalPrice.toFixed(2)}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={reset}
                    aria-label={t('customizer.reset')}
                    className="gap-1 shrink-0"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveOpen(true)}
                    className="gap-1 shrink-0"
                >
                    <Bookmark className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="default"
                    size="default"
                    onClick={() => onOrder?.(getConfiguration())}
                    className="gap-1.5 shrink-0"
                >
                    <ShoppingBag className="w-4 h-4" />
                    {t('customizer.order')}
                </Button>
            </div>

            <SaveDesignModal
                open={saveOpen}
                onClose={() => setSaveOpen(false)}
                productId={product.id}
                configuration={getConfiguration()}
                onSaved={name => {
                    setSavedName(name);
                    setTimeout(() => setSavedName(null), 4000);
                }}
            />
        </motion.div>
    );
}
