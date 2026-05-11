import { motion } from 'motion/react';
import type { LayerCategory, Fabric } from '../../types/customizer';
import CategoryTabs from './CategoryTabs';
import OptionSwatch from './OptionSwatch';
import FabricPicker from './FabricPicker';
import { useState, useEffect } from 'react';

interface OptionPanelProps {
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    selections: Record<number, number>;
    fabricId: number | null;
    onSelectOption: (categoryId: number, optionId: number) => void;
    onSelectFabric: (fabricId: number | null) => void;
}

export default function OptionPanel({
    layerCategories,
    fabrics,
    selections,
    fabricId,
    onSelectOption,
    onSelectFabric,
}: OptionPanelProps) {
    // Only show categories that have more than one option.
    // Single-option layers (button overlays etc.) need no UI picker.
    const choosableCategories = layerCategories.filter(c => c.options.length > 1);

    // Stacked layout: show all choosable categories at once as titled sections.
    // Used when the product has multiple independent selector categories (e.g.
    // Sleeves + Collar on Woman's Top) so the user sees all choices simultaneously.
    const useStackedLayout = choosableCategories.length > 1;

    // Tab layout state (used when there's only one choosable category)
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    useEffect(() => {
        if (!useStackedLayout && choosableCategories.length > 0 && activeCategoryId === null) {
            setActiveCategoryId(choosableCategories[0]?.id ?? null);
        }
    }, [choosableCategories, activeCategoryId, useStackedLayout]);

    const activeCategory = choosableCategories.find(c => c.id === activeCategoryId) ?? null;

    return (
        <div className="flex flex-col gap-4">
            {choosableCategories.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">
                    More options coming soon.
                </p>
            )}

            {/* ── Stacked layout (multiple categories shown simultaneously) ── */}
            {useStackedLayout && choosableCategories.map((category, i) => (
                <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                    className={i > 0 ? 'border-t border-slate-100 pt-4' : undefined}
                >
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        {category.name}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {category.options.map(option => (
                            <OptionSwatch
                                key={option.id}
                                option={option}
                                isSelected={selections[category.id] === option.id}
                                onSelect={() => onSelectOption(category.id, option.id)}
                            />
                        ))}
                    </div>
                </motion.div>
            ))}

            {/* ── Tab layout (single choosable category) ── */}
            {!useStackedLayout && choosableCategories.length > 0 && (
                <>
                    <CategoryTabs
                        categories={choosableCategories}
                        activeId={activeCategoryId}
                        onSelect={setActiveCategoryId}
                    />
                    <div
                        id={activeCategoryId ? `panel-${activeCategoryId}` : undefined}
                        role="tabpanel"
                        className="min-h-[160px]"
                    >
                        {activeCategory && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {activeCategory.options.map(option => (
                                    <OptionSwatch
                                        key={option.id}
                                        option={option}
                                        isSelected={selections[activeCategory.id] === option.id}
                                        onSelect={() => onSelectOption(activeCategory.id, option.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Fabric / colour picker — always visible */}
            {fabrics.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                    <FabricPicker
                        fabrics={fabrics}
                        selectedId={fabricId}
                        onSelect={onSelectFabric}
                    />
                </div>
            )}
        </div>
    );
}
