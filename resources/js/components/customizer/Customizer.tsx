/**
 * Customizer — top-level wrapper for the 2D layer-based clothing configurator.
 *
 * Layout:
 *   Left  — PreviewCanvas (stacked transparent PNG/SVG layers)
 *   Right — OptionPanel (tabs per category → option swatches + fabric picker)
 *            PriceSummary + Save/Order CTAs
 */
import { useEffect, useMemo, useState } from 'react';
import { Bookmark, RotateCcw, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import PreviewCanvas, { viewImageUrl } from './PreviewCanvas';
import ViewSwitcher from './ViewSwitcher';
import ColorDotPicker from './ColorDotPicker';
import OptionPanel from './OptionPanel';
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
        fabricId,
        selectOption,
        selectSubOption,
        selectFabric,
        reset,
        getConfiguration,
        totalPrice,
        resolveOption,
    } = useCustomizer({ basePrice: product.base_price, layerCategories, fabrics });
    const { t } = useTranslation();

    const [saveOpen, setSaveOpen]   = useState(false);
    const [savedName, setSavedName] = useState<string | null>(null);
    const [view, setView]           = useState<GarmentView>('front');

    const selectedFabric = fabrics.find(f => f.id === fabricId) ?? null;

    // Categories where every choice is colour-tagged render as dots under the
    // preview; the rest stay as image swatches in the right-hand panel.
    const isDotCategory = (category: LayerCategory) =>
        category.options.length > 0 &&
        category.options.every(o => o.color_hex && !(o.children && o.children.length > 0));

    const dotCategories   = layerCategories.filter(isDotCategory);
    const panelCategories = layerCategories.filter(c => !isDotCategory(c));
    const hasPanelContent = panelCategories.some(c => c.options.length > 0) || fabrics.length > 0;

    // A view is offered only when every rendered layer has a photo for it,
    // so the composite never mixes angles.
    const availableViews = useMemo((): GarmentView[] => {
        const renderedOptions = layerCategories
            .filter(c => c.slug !== 'collar' && c.is_preview_layer !== false)
            .map(c => resolveOption(c))
            .filter((o): o is NonNullable<typeof o> => o !== null);

        if (renderedOptions.length === 0) return ['front'];

        return (['front', 'back', 'left', 'right'] as GarmentView[]).filter(v =>
            renderedOptions.every(o => viewImageUrl(o, v) !== null),
        );
    }, [layerCategories, resolveOption]);

    // Picking a color/style that lacks the current angle snaps back to front
    useEffect(() => {
        if (!availableViews.includes(view)) setView('front');
    }, [availableViews, view]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-[1fr_420px] gap-8 items-start"
        >
            {/* ── Preview column ─────────────────────────────────────────────── */}
            <div className="lg:sticky lg:top-24">
                <PreviewCanvas
                    layerCategories={layerCategories}
                    selections={selections}
                    selectedFabric={selectedFabric}
                    view={view}
                    resolveOption={resolveOption}
                />
                {/* Fabric swatch label below preview */}
                {selectedFabric && (
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Fabric: <span className="font-medium text-slate-600">{selectedFabric.name}</span>
                    </p>
                )}
            </div>

            {/* ── Options column ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-5 pb-24 lg:pb-0">
                {/* Product header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                    {product.description && (
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            {product.description}
                        </p>
                    )}
                </div>

                {/* Option panel — hidden when colour dots are the only choice */}
                {hasPanelContent && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-4">
                        <OptionPanel
                            layerCategories={panelCategories}
                            fabrics={fabrics}
                            selections={selections}
                            subSelections={subSelections}
                            fabricId={fabricId}
                            onSelectOption={selectOption}
                            onSelectSubOption={selectSubOption}
                            onSelectFabric={selectFabric}
                        />
                    </div>
                )}

                {/* Colour dot groups */}
                {dotCategories.map(category => (
                    <div key={category.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                        <ColorDotPicker
                            category={category}
                            selectedId={selections[category.id]}
                            onSelect={optionId => selectOption(category.id, optionId)}
                        />
                    </div>
                ))}

                <ViewSwitcher views={availableViews} view={view} onChange={setView} />

                {/* Price summary — hidden on mobile (shown in sticky bar below) */}
                <div className="hidden lg:block">
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
                    <p className="text-xs text-center text-slate-500">
                        ✓ "{savedName}" saved to your designs.
                    </p>
                )}

                {/* CTAs — desktop only (mobile uses sticky bar) */}
                <div className="hidden lg:flex gap-2">
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
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
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
