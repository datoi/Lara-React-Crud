/**
 * Customizer — top-level wrapper for the 2D layer-based clothing configurator.
 *
 * Layout:
 *   Left  — PreviewCanvas (stacked transparent PNG/SVG layers)
 *   Right — OptionPanel (tabs per category → option swatches + fabric picker)
 *            PriceSummary + Save/Order CTAs
 */
import { useEffect, useMemo, useState } from 'react';
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
import type { CustomizerProduct, DesignConfiguration, Fabric, GarmentView, LayerCategory } from '../../types/customizer';

interface CustomizerProps {
    product: CustomizerProduct;
    /** Saved design being reopened, if the page was entered with ?design= */
    savedConfiguration?: DesignConfiguration | null;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    /** Called when the user proceeds. Receives the live total so the order
     *  flow records the price the customer was actually shown. */
    onOrder?: (configuration: DesignConfiguration, totalPrice: number) => void;
}

export default function Customizer({
    product,
    savedConfiguration,
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
    } = useCustomizer({ basePrice: product.base_price, layerCategories, fabrics, persistKey: product.slug, savedConfiguration });
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


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid items-start lg:grid-cols-[55%_45%]"
        >
            {/* ── Preview column ─────────────────────────────────────────────────
                Pinned on phones too, under the 4rem navbar. The options scroll
                beneath it, so a colour tap or an attribute change is always seen
                — previously the garment scrolled away and changes went unnoticed.
                Needs the page colour behind it or scrolling content shows through,
                and z-10 to sit under the z-50 navbar but over the panel. */}
            <div className="sticky top-11 z-10 bg-[#F2F1ED] lg:top-11 lg:z-auto">
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
                    <div className="flex h-52 w-full flex-col items-center justify-center gap-2 border-b border-[#111111]/15 bg-[#F2F1ED] px-6 text-center sm:h-80 sm:gap-3 lg:h-[calc(100vh-3rem)]">
                        <span className="flex h-9 w-9 items-center justify-center border border-[#111111]/20 text-[#6c625b] sm:h-12 sm:w-12">
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
                    <p className="border-b border-[#111111]/15 bg-[#E4E0D7] px-4 py-3 text-center text-xs text-[#6c625b]">
                        Fabric: <span className="font-medium text-[#111111]">{selectedFabric.name}</span>
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
            {/* Clearance for the consent banner is reserved globally on <body>
                from its measured height — a fixed guess here was 112px against
                a banner up to 184px in Georgian, leaving the Continue button
                partly unclickable. */}
            <div className="flex min-h-[calc(100vh-3rem)] flex-col bg-[#E4E0D7] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
                {/* Product header */}
                <div className="order-1 border-b border-[#111111]/20 pb-6">
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6c625b]">{product.category}</p>
                    <h1 className="text-lg font-medium uppercase leading-tight text-[#111111]">{product.name}</h1>
                    <p className="mt-2 text-sm font-medium text-[#111111]">₾{totalPrice.toFixed(2)}</p>
                    {product.description && (
                        <p className="mt-5 max-w-xl text-xs leading-5 text-[#514843]">
                            {product.description}
                        </p>
                    )}
                </div>

                {/* Option panel */}
                {hasPanelContent && (
                    <div className="order-4 border-b border-[#111111]/20 py-6 lg:order-2">
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
                    <div key={`${category.id}-${option.id}`} className="order-3 border-b border-[#111111]/20 py-6 lg:order-4">
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
                    <div className="order-2 border-b border-[#111111]/20 py-4 lg:order-3">
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
                    <p className="order-6 py-3 text-center text-xs text-[#6c625b]">
                        ✓ "{savedName}" saved to your designs.
                    </p>
                )}

                {/* CTAs — desktop only (mobile uses sticky bar) */}
                {/* Wraps because Button forces whitespace-nowrap: the Georgian
                    labels ("გადატვირთვა", "დიზაინის შენახვა", "შეკვეთა — ₾45.00")
                    cannot shrink and pushed this row ~20px past the column,
                    giving the whole desktop page a horizontal scrollbar. */}
                <div className="order-7 hidden gap-2 pt-6 lg:flex lg:flex-wrap">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={reset}
                        aria-label={t('customizer.reset')}
                        className="gap-1.5 rounded-none border-[#111111]/30 bg-transparent text-[#111111] hover:bg-[#111111] hover:text-white"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {t('customizer.reset')}
                    </Button>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setSaveOpen(true)}
                        className="flex-1 gap-1.5 rounded-none border-[#111111] bg-transparent text-[#111111] hover:bg-[#111111] hover:text-white"
                    >
                        <Bookmark className="w-4 h-4" />
                        {t('customizer.saveDesign')}
                    </Button>
                    <Button
                        variant="default"
                        size="default"
                        onClick={() => onOrder?.(getConfiguration(), totalPrice)}
                        className="flex-1 gap-1.5 rounded-none bg-[#111111] text-white hover:bg-[#333333]"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {t('customizer.continuePrice', { price: totalPrice.toFixed(2) })}
                    </Button>
                </div>

                {/* ── Mobile price + actions ─────────────────────────────────
                    In the flow rather than fixed to the viewport, so it no
                    longer floats over the page or fights the consent banner.
                    Lives inside the options column because the outer element is
                    a two-column grid — as a grid sibling it would have taken a
                    cell of its own on desktop. */}
                {/* gap-2 and flex-wrap because every child is shrink-0: the
                    Georgian labels pushed this row 2px past a 360px screen.
                    The tighter gap makes it fit; the wrap keeps it safe for
                    longer prices or labels. */}
                <div className="order-8 -mx-5 mt-6 flex flex-wrap items-center gap-2 border-t border-[#111111]/20 bg-[#E4E0D7] px-5 py-4 sm:-mx-8 sm:px-8 lg:hidden">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#6c625b]">{t('customizer.total')}</p>
                    <p className="text-lg font-medium leading-tight text-[#111111]">₾{totalPrice.toFixed(2)}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={reset}
                    aria-label={t('customizer.reset')}
                    className="shrink-0 gap-1 rounded-none border-[#111111]/30 bg-transparent"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveOpen(true)}
                    className="shrink-0 gap-1 rounded-none border-[#111111]/30 bg-transparent"
                >
                    <Bookmark className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="default"
                    size="default"
                    onClick={() => onOrder?.(getConfiguration(), totalPrice)}
                    className="shrink-0 gap-1.5 rounded-none bg-[#111111] text-white"
                >
                    <ShoppingBag className="w-4 h-4" />
                    {t('customizer.continueLabel')}
                </Button>
                </div>
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
