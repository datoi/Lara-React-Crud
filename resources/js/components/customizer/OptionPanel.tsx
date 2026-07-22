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
    subSelections: Record<number, number>;
    fabricId: number | null;
    onSelectOption: (categoryId: number, optionId: number) => void;
    onSelectSubOption: (parentOptionId: number, childOptionId: number) => void;
    onSelectFabric: (fabricId: number | null) => void;
}

/** True if any top-level option in this category has sub-options */
function categoryHasChildren(category: LayerCategory): boolean {
    return category.options.some(o => o.children && o.children.length > 0);
}

export default function OptionPanel({
    layerCategories,
    fabrics,
    selections,
    subSelections,
    fabricId,
    onSelectOption,
    onSelectSubOption,
    onSelectFabric,
}: OptionPanelProps) {
    const choosableCategories = layerCategories.filter(c => c.options.length > 0);
    const useStackedLayout = choosableCategories.length > 1;

    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    useEffect(() => {
        if (!useStackedLayout && choosableCategories.length > 0 && activeCategoryId === null) {
            setActiveCategoryId(choosableCategories[0]?.id ?? null);
        }
    }, [choosableCategories, activeCategoryId, useStackedLayout]);

    const activeCategory = choosableCategories.find(c => c.id === activeCategoryId) ?? null;

    const renderCategory = (category: LayerCategory, i: number) => {
        const selectedParentId = selections[category.id];
        const hasChildren = categoryHasChildren(category);

        return (
            <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className={useStackedLayout && i > 0 ? 'border-t border-slate-100 pt-4' : undefined}
            >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {category.name}
                </p>

                {hasChildren ? (
                    <HierarchicalPicker
                        category={category}
                        selectedParentId={selectedParentId}
                        subSelections={subSelections}
                        onSelectParent={id => onSelectOption(category.id, id)}
                        onSelectChild={onSelectSubOption}
                    />
                ) : (
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
                )}
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col gap-4">
            {choosableCategories.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">
                    More options coming soon.
                </p>
            )}

            {/* Stacked layout */}
            {useStackedLayout && choosableCategories.map((cat, i) => renderCategory(cat, i))}

            {/* Tab layout */}
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
                        {activeCategory && renderCategory(activeCategory, 0)}
                    </div>
                </>
            )}

            {/* Fabric / colour picker */}
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

// ── Two-level picker: parent pills → labeled child swatches ──────────────────

function HierarchicalPicker({
    category,
    selectedParentId,
    subSelections,
    onSelectParent,
    onSelectChild,
}: {
    category: LayerCategory;
    selectedParentId: number | undefined;
    subSelections: Record<number, number>;
    onSelectParent: (id: number) => void;
    onSelectChild: (parentId: number, childId: number) => void;
}) {
    const selectedParent = category.options.find(o => o.id === selectedParentId)
        ?? category.options[0];
    const children = selectedParent?.children ?? [];
    const childrenLabel = category.children_label ?? 'Style';

    return (
        <div className="space-y-4">
            {/* Parent options — image swatches */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {category.options.map(option => (
                    <OptionSwatch
                        key={option.id}
                        option={option}
                        isSelected={(selectedParentId ?? category.options[0]?.id) === option.id}
                        onSelect={() => onSelectParent(option.id)}
                    />
                ))}
            </div>

            {/* Sub-styles section with its own label */}
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {childrenLabel}
                </p>

                {children.length > 0 ? (
                    <motion.div
                        key={selectedParent?.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-3 sm:grid-cols-4 gap-2"
                    >
                        {children.map(child => (
                            <OptionSwatch
                                key={child.id}
                                option={child}
                                isSelected={subSelections[selectedParent!.id] === child.id}
                                onSelect={() => onSelectChild(selectedParent!.id, child.id)}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <p className="text-xs text-slate-400 italic">No {childrenLabel.toLowerCase()} options yet.</p>
                )}
            </div>
        </div>
    );
}
