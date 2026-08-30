/**
 * Customizer — the garment configurator.
 *
 * Layout:
 *   Left rail  — the photograph and the angles it can be seen from, pinned so a
 *                change is always visible while the options scroll past it.
 *   Right      — the garment's name and running total, then its specification as
 *                a grid of cards, the colourway, the price breakdown and the CTA.
 *
 * Opening an attribute replaces the right column below the header with that
 * attribute's options: one question at a time, with the total still on screen.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
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
    /** Trail above the configurator — supplied by the page, which knows the taxonomy. */
    breadcrumb?: ReactNode;
    /** Called when the user proceeds. Receives the live total so the order
     *  flow records the price the customer was actually shown. */
    onOrder?: (configuration: DesignConfiguration, totalPrice: number) => void;
}

export default function Customizer({
    product,
    savedConfiguration,
    layerCategories,
    fabrics,
    breadcrumb,
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

    // The preview answers whatever the customer is currently looking at. On the
    // spec grid, and inside an attribute we have photographed, it shows the
    // garment. Inside an attribute with no photography — fit, length, neckline,
    // back, sleeves — a picture of the photographed cut would not answer the
    // question being asked, so a placeholder takes its place until those are shot.
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
    const renderedSources = useMemo(() => layerCategories
        .filter(c => c.slug !== 'collar' && c.is_preview_layer !== false)
        .map(c => resolveOption(c))
        .filter((o): o is NonNullable<typeof o> => o !== null)
        .map(o => resolveColor(o) ?? o),
        [layerCategories, resolveOption, resolveColor]);

    const availableViews = useMemo((): GarmentView[] => {
        if (renderedSources.length === 0) return ['front'];

        return (['front', 'back', 'left', 'right'] as GarmentView[]).filter(v =>
            renderedSources.every(s => viewImageUrl(s, v) !== null),
        );
    }, [renderedSources]);

    // The switcher shows each angle of the garment as it is currently configured.
    // Only meaningful when a single layer paints the canvas, which is every
    // photographed garment we have — a composite has no one thumbnail.
    const thumbnailFor = (candidate: GarmentView): string | null =>
        renderedSources.length === 1 ? viewImageUrl(renderedSources[0], candidate) : null;

    // Picking a color/style that lacks the current angle snaps back to front
    useEffect(() => {
        if (!availableViews.includes(view)) setView('front');
    }, [availableViews, view]);

    const addOns = Math.max(0, totalPrice - product.base_price);
    const drilledIn = openAttributeId !== null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto box-border w-full max-w-[1400px] px-[clamp(1rem,4vw,2.5rem)] pb-[clamp(2.5rem,6vw,4.5rem)] pt-[clamp(1rem,3vw,1.75rem)]"
        >
            {breadcrumb && <div className="mb-5">{breadcrumb}</div>}

            <div className="grid items-start gap-[clamp(1.75rem,4vw,3.25rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">

                {/* ── Preview rail ───────────────────────────────────────────
                    Pinned under the fixed navbar so a colour tap or an attribute
                    change is always seen — previously the garment scrolled away
                    and changes went unnoticed. Needs the page colour behind it or
                    scrolling content shows through. */}
                {/* Pinned only once there are two columns. A square preview plus
                    its angle tiles is ~436px, and pinning that on a 740px phone
                    leaves a band the page tail can never escape: whatever sits
                    last — the Continue button — ends up underneath it at every
                    scroll position, because the rail stays stuck until its grid
                    ends. Capping the height would only move the failure to a
                    smaller screen, so below the breakpoint the rail scrolls with
                    the page. Width is still capped so the card stays square. */}
                <div className="z-10 mx-auto flex w-full max-w-[52vh] flex-col gap-3 bg-[#E4E0D7] min-[900px]:sticky min-[900px]:top-14 min-[900px]:max-w-none">
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
                        <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 border border-[#111111]/[0.16] bg-white px-6 text-center">
                            <span className="flex h-12 w-12 items-center justify-center border border-[#111111]/20 text-[#655D55]">
                                <ImageOff className="h-5 w-5 stroke-[1.4]" />
                            </span>
                            <p className="font-serif text-xl font-semibold tracking-[-0.02em] text-[#111111] sm:text-2xl">
                                {t('customizer.previewComingSoon')}
                            </p>
                            <p className="max-w-[22rem] text-xs leading-relaxed text-[#655D55]">
                                {hasPreviewLayers
                                    ? t('customizer.previewOptionsSoon')
                                    : t('customizer.previewGarmentSoon')}
                            </p>
                        </div>
                    )}

                    {showPhoto && (
                        <ViewSwitcher
                            views={availableViews}
                            view={view}
                            onChange={setView}
                            thumbnailFor={thumbnailFor}
                        />
                    )}

                    {selectedFabric && showPhoto && (
                        <p className="border border-[#111111]/[0.16] bg-white px-4 py-2.5 text-center text-xs text-[#655D55]">
                            {t('customizer.fabric')}: <span className="font-medium text-[#111111]">{selectedFabric.name}</span>
                        </p>
                    )}
                </div>

                {/* ── Configuration column ───────────────────────────────────── */}
                <div className="flex flex-col">

                    {/* Header — name, description and the running total. Stays put
                        while an attribute is open, so the price never disappears
                        at the moment the customer is changing what it depends on. */}
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                        <div>
                            <h1 className="mb-2 font-serif text-[clamp(1.7rem,6vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-[#111111]">
                                {product.name}
                            </h1>
                            {product.description && (
                                <p className="max-w-[38ch] text-[15px] leading-normal text-[#655D55] [text-wrap:pretty]">
                                    {product.description}
                                </p>
                            )}
                        </div>
                        <div className="min-w-24 flex-none pt-1.5 text-right">
                            <div className="font-serif text-[26px] font-semibold tabular-nums text-[#111111]">
                                ₾{totalPrice.toFixed(2)}
                            </div>
                            <div className="mt-0.5 text-xs text-[#655D55]">
                                {addOns > 0
                                    ? t('customizer.addOnsLabel', { amount: addOns.toFixed(2) })
                                    : t('customizer.basePriceLabel')}
                            </div>
                        </div>
                    </div>

                    {hasPanelContent && (
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
                            onReset={() => { reset(); setOpenAttributeId(null); }}
                        />
                    )}

                    {/* Colour, price and the CTA belong to the whole garment, so
                        they stay put while a single attribute is open — the moment
                        a choice is changing the total is exactly when the total is
                        worth seeing. A rule separates them from the open attribute,
                        which otherwise runs straight into the colour row. */}
                    <div className={drilledIn ? 'mt-8 border-t border-[#111111]/20' : undefined}>
                        {colorGroups.map(({ category, option }) => (
                            <div key={`${category.id}-${option.id}`} className="mt-8">
                                <ColorDotPicker
                                    label={t('customizer.colorLabel')}
                                    colors={option.colors}
                                    selectedId={colorSelections[option.id] ?? option.colors.find(c => c.is_default)?.id ?? option.colors[0]?.id}
                                    onSelect={colorId => selectColor(option.id, colorId)}
                                />
                            </div>
                        ))}

                        <div className="mt-8">
                            <PriceSummary
                                basePrice={product.base_price}
                                layerCategories={layerCategories}
                                fabrics={fabrics}
                                selections={selections}
                                fabricId={fabricId}
                                totalPrice={totalPrice}
                            />
                        </div>

                        {savedName && (
                            <p className="pt-3 text-center text-xs text-[#655D55]">
                                ✓ "{savedName}" saved to your designs.
                            </p>
                        )}

                        {/* Wraps because Button forces whitespace-nowrap: the
                            Georgian labels cannot shrink and would otherwise
                            push the column past the viewport. */}
                        <div className="mt-4 flex flex-wrap gap-2.5">
                            <Button
                                variant="default"
                                size="default"
                                onClick={() => onOrder?.(getConfiguration(), totalPrice)}
                                className="h-12 flex-[1_1_13.75rem] rounded-none bg-[#6F1D24] text-[15px] font-semibold text-white hover:bg-[#5A171D]"
                            >
                                {t('customizer.continuePrice', { price: totalPrice.toFixed(2) })}
                            </Button>
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setSaveOpen(true)}
                                className="h-12 rounded-none border-[#111111]/[0.16] bg-white px-6 text-[15px] font-medium text-[#111111] hover:border-[#111111] hover:bg-white"
                            >
                                {t('customizer.saveDesign')}
                            </Button>
                        </div>

                        <p className="mt-3 max-w-[46ch] text-xs leading-relaxed text-[#655D55]">
                            {t('customizer.measurementNote')}
                        </p>
                    </div>
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
