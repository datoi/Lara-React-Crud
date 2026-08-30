import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { LayerCategory, LayerOption } from '../../types/customizer';
import OptionSwatch from './OptionSwatch';

/** True if any top-level option in this category has sub-options */
export function categoryHasChildren(category: LayerCategory): boolean {
    return category.options.some(o => o.children && o.children.length > 0);
}

/**
 * True when this attribute's options carry photography rather than being plain
 * labels. Drives both the tile shape here and the "preview coming soon" note —
 * an attribute is fully choosable either way, it just cannot be shown yet.
 */
export function categoryHasArtwork(category: LayerCategory): boolean {
    return category.options.some(o => o.thumbnail_url || o.colors.length > 0);
}

/** Photographed options stay picture tiles; labelled ones get the wider row tile. */
function gridClass(category: LayerCategory): string {
    return categoryHasArtwork(category)
        ? 'grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]'
        : 'grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))]';
}

interface CategoryOptionsProps {
    category: LayerCategory;
    selections: Record<number, number>;
    subSelections: Record<number, number>;
    onSelectOption: (categoryId: number, optionId: number) => void;
    onSelectSubOption: (parentOptionId: number, childOptionId: number) => void;
}

/**
 * The options of one attribute — a flat tile grid, or a two-level picker when
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

    const withArtwork = categoryHasArtwork(category);
    const selectedId = selections[category.id]
        ?? category.options.find(o => o.is_default)?.id
        ?? category.options[0]?.id;

    return (
        <div className={gridClass(category)}>
            {category.options.map(option => (
                withArtwork ? (
                    <OptionSwatch
                        key={option.id}
                        option={option}
                        isSelected={selectedId === option.id}
                        onSelect={() => onSelectOption(category.id, option.id)}
                    />
                ) : (
                    <OptionTile
                        key={option.id}
                        option={option}
                        isSelected={selectedId === option.id}
                        onSelect={() => onSelectOption(category.id, option.id)}
                    />
                )
            ))}
        </div>
    );
}

/**
 * A labelled option: mark box, name, and its surcharge. Wide enough to read a
 * full option name without truncating — "Normal / No change" and the Georgian
 * labels both need the room.
 */
function OptionTile({
    option,
    isSelected,
    onSelect,
}: {
    option: LayerOption;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={isSelected}
            aria-label={`${option.name}${option.price_modifier !== 0 ? ` — ${option.price_modifier > 0 ? '+' : ''}₾${option.price_modifier}` : ''}`}
            className={[
                'flex min-h-[56px] w-full cursor-pointer items-center gap-3 bg-white px-3.5 py-3 text-left transition-colors',
                isSelected
                    ? 'border border-[#111111] shadow-[inset_0_0_0_1px_#111111]'
                    : 'border border-[#111111]/[0.16] hover:border-[#111111]',
            ].join(' ')}
        >
            <span
                className={[
                    'flex h-5 w-5 flex-none items-center justify-center',
                    isSelected ? 'bg-[#111111]' : 'border border-[#111111]/[0.16]',
                ].join(' ')}
            >
                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>

            <span className="flex-1 text-[15px] font-medium leading-[1.3] text-[#111111]">
                {option.name}
            </span>

            {option.price_modifier !== 0 && (
                <span className="flex-none text-[13px] tabular-nums text-[#655D55]">
                    {option.price_modifier > 0 ? '+' : ''}₾{option.price_modifier}
                </span>
            )}
        </button>
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
    const { t } = useTranslation();
    const selectedParent = category.options.find(o => o.id === selectedParentId)
        ?? category.options[0];
    const children = selectedParent?.children ?? [];
    const childrenLabel = category.children_label ?? t('customizer.attributesTitle');

    return (
        <div className="space-y-5">
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

            <div>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.11em] text-[#655D55]">
                    {childrenLabel}
                </p>

                {children.length > 0 && (
                    <motion.div
                        key={selectedParent?.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]"
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
                )}
            </div>
        </div>
    );
}
