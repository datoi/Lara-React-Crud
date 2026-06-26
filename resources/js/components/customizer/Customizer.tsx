/**
 * Customizer — top-level wrapper for the 2D layer-based clothing configurator.
 *
 * Layout:
 *   Left  — PreviewCanvas (stacked transparent PNG/SVG layers)
 *   Right — OptionPanel (tabs per category → option swatches + fabric picker)
 *            PriceSummary + Save/Order CTAs
 */
import { useState } from 'react';
import { Bookmark, RotateCcw, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import PreviewCanvas from './PreviewCanvas';
import OptionPanel from './OptionPanel';
import PriceSummary from './PriceSummary';
import SaveDesignModal from './SaveDesignModal';
import { useCustomizer } from '../../hooks/useCustomizer';
import type { CustomizerProduct, Fabric, LayerCategory } from '../../types/customizer';

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

    const [saveOpen, setSaveOpen]   = useState(false);
    const [savedName, setSavedName] = useState<string | null>(null);

    const selectedFabric = fabrics.find(f => f.id === fabricId) ?? null;

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

                {/* Option panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <OptionPanel
                        layerCategories={layerCategories}
                        fabrics={fabrics}
                        selections={selections}
                        subSelections={subSelections}
                        fabricId={fabricId}
                        onSelectOption={selectOption}
                        onSelectSubOption={selectSubOption}
                        onSelectFabric={selectFabric}
                    />
                </div>

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
                        aria-label="Reset all selections to default"
                        className="gap-1.5"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => setSaveOpen(true)}
                        className="gap-1.5 flex-1"
                    >
                        <Bookmark className="w-4 h-4" />
                        Save Design
                    </Button>
                    <Button
                        variant="default"
                        size="default"
                        onClick={() => onOrder?.(getConfiguration())}
                        className="gap-1.5 flex-1 bg-slate-900 hover:bg-slate-700 text-white"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Order — ₾{totalPrice.toFixed(2)}
                    </Button>
                </div>
            </div>

            {/* ── Mobile sticky bottom bar ───────────────────────────────────── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight">₾{totalPrice.toFixed(2)}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={reset}
                    aria-label="Reset"
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
                    className="gap-1.5 shrink-0 bg-slate-900 hover:bg-slate-700 text-white"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Order
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
