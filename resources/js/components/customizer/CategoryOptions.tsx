import { motion } from 'motion/react';
import type { LayerCategory } from '../../types/customizer';
import OptionSwatch from './OptionSwatch';

/** True if any top-level option in this category has sub-options */
export function categoryHasChildren(category: LayerCategory): boolean {
    return category.options.some(o => o.children && o.children.length > 0);
}

/** Label-only options need wider tiles than picture swatches to stay readable. */
function gridClass(category: LayerCategory): string {
    const hasArtwork = category.options.some(o => o.thumbnail_url);
    return hasArtwork
        ? 'grid grid-cols-3 sm:grid-cols-4 gap-2'
        : 'grid grid-cols-2 sm:grid-cols-3 gap-2';
}

interface CategoryOptionsProps {
    category: LayerCategory;
    selections: Record<number, number>;
    subSelections: Record<number, number>;
    onSelectOption: (categoryId: number, optionId: number) => void;
    onSelectSubOption: (parentOptionId: number, childOptionId: number) => void;
}

/**
 * The options of one attribute — a flat swatch grid, or a two-level picker when
 * the attribute's options carry sub-styles. Shared by the stacked panel and the
 * attribute drill-down so both stay identical.
 */
export default function CategoryOptions({
    category,
    selections,
    subSelections,
    onSelectOption,
    onSelectSubOption,
}: CategoryOptionsProps) {
    if (categoryHasChildren(category)) {
        return (
            <HierarchicalPicker
                category={category}
                selectedParentId={selections[category.id]}
                subSelections={subSelections}
                onSelectParent={id => onSelectOption(category.id, id)}
                onSelectChild={onSelectSubOption}
            />
        );
    }

    return (
        <div className={gridClass(category)}>
            {category.options.map(option => (
                <OptionSwatch
                    key={option.id}
                    option={option}
                    isSelected={selections[category.id] === option.id}
                    onSelect={() => onSelectOption(category.id, option.id)}
                />
            ))}
        </div>
    );
}

// ── Two-level picker: parent swatches → labeled child swatches ───────────────

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
            {/* Parent options */}
            <div className={gridClass(category)}>
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
