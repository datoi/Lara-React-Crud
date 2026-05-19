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
            <div className="sticky top-24">
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
            <div className="flex flex-col gap-5">
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

                {/* Price summary */}
                <PriceSummary
                    basePrice={product.base_price}
                    layerCategories={layerCategories}
                    fabrics={fabrics}
                    selections={selections}
                    fabricId={fabricId}
                    totalPrice={totalPrice}
                />

                {/* Success toast */}
                {savedName && (
                    <p className="text-xs text-center text-slate-500">
                        ✓ "{savedName}" saved to your designs.
                    </p>
                )}

                {/* CTAs */}
                <div className="flex gap-2">
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
