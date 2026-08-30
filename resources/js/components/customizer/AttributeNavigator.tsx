import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LayerCategory, LayerOption } from '../../types/customizer';
import CategoryOptions, { categoryHasArtwork } from './CategoryOptions';

interface AttributeNavigatorProps {
    categories: LayerCategory[];
    selections: Record<number, number>;
    subSelections: Record<number, number>;
    /**
     * Attribute currently open, or null for the list. Controlled from the
     * Customizer because the preview mirrors it — an attribute we have
     * photographed shows the garment, one we have not shows a placeholder.
     */
    openId: number | null;
    onOpenChange: (id: number | null) => void;
    onSelectOption: (categoryId: number, optionId: number) => void;
    onSelectSubOption: (parentOptionId: number, childOptionId: number) => void;
    onReset: () => void;
}

function selectedOption(category: LayerCategory, selections: Record<number, number>): LayerOption | undefined {
    return category.options.find(o => o.id === selections[category.id])
        ?? category.options.find(o => o.is_default)
        ?? category.options[0];
}

/**
 * The garment specification, and the way into changing any line of it.
 *
 * The list is a grid of spec cards — one per attribute, each showing what is
 * currently chosen and what it costs, so the whole configuration is readable at
 * a glance rather than only after opening every row. Tapping a card replaces the
 * list with that attribute's options; there is never more than one open.
 *
 * Selections live in useCustomizer above this component, so opening and closing
 * an attribute never disturbs them.
 */
export default function AttributeNavigator({
    categories,
    selections,
    subSelections,
    openId,
    onOpenChange,
    onSelectOption,
    onSelectSubOption,
    onReset,
}: AttributeNavigatorProps) {
    const { t } = useTranslation();

    const open = categories.find(c => c.id === openId) ?? null;

    if (open) {
        return (
            <motion.div
                key={`attribute-${open.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-3.5 pb-4 pt-6">
                    <button
                        type="button"
                        onClick={() => onOpenChange(null)}
                        aria-label={t('customizer.allAttributes')}
                        // 44px rather than the handoff's 36px: it is the only way
                        // back out of an attribute on a phone, and the swatches
                        // beside it already sit at the 44px touch minimum.
                        className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center border border-[#111111]/[0.16] bg-white text-[#111111] transition-colors hover:border-[#111111]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.11em] text-[#655D55]">
                            {t('customizer.attributesTitle')}
                        </div>
                        <div className="font-serif text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[#111111]">
                            {open.name}
                        </div>
                    </div>
                </div>

                <CategoryOptions
                    category={open}
                    selections={selections}
                    subSelections={subSelections}
                    onSelectOption={onSelectOption}
                    onSelectSubOption={onSelectSubOption}
                />

                {/* Sits under the options, where the customer is looking after
                    choosing — the choice itself is real, only the picture is missing. */}
                {!categoryHasArtwork(open) && (
                    <p className="mt-3.5 text-[12px] italic leading-relaxed text-[#655D55]">
                        {t('customizer.previewOptionsSoon')}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => onOpenChange(null)}
                    className="mt-5 h-12 cursor-pointer border-0 bg-[#111111] px-6 text-sm font-medium text-[#E4E0D7] transition-colors hover:bg-[#333333]"
                >
                    {t('customizer.backToDetails')}
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="attribute-list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-3.5 mt-8 flex flex-wrap items-baseline gap-x-3.5 gap-y-2.5">
                <span className="font-serif text-[18px] font-semibold text-[#111111]">
                    {t('customizer.attributesTitle')}
                </span>
                <span className="text-xs text-[#655D55]">
                    {t('customizer.attributeCount', { count: categories.length })}
                </span>
                <div className="flex-1" />
                {/* Padded to a 44px touch target and pulled back out of the flow,
                    so it reads as the handoff's plain text button but is not a
                    20px-tall tap area on a phone. */}
                <button
                    type="button"
                    onClick={onReset}
                    className="-my-3 cursor-pointer border-0 bg-transparent px-0 py-3 text-[13px] text-[#655D55] transition-colors hover:text-[#111111]"
                >
                    {t('customizer.reset')}
                </button>
            </div>

            {/* A grid rather than a stacked list: six full-width rows ran ~370px
                and pushed the garment off a phone screen. As cards two to a row
                they take roughly a third of that, so the customer can see what
                they have chosen and the preview at the same time. */}
            <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,168px),1fr))]">
                {categories.map(category => {
                    const current = selectedOption(category, selections);
                    const modifier = current?.price_modifier ?? 0;

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onOpenChange(category.id)}
                            className="flex cursor-pointer flex-col gap-2 border border-[#111111]/[0.16] bg-white px-4 pb-3 pt-3.5 text-left transition-colors hover:border-[#111111]"
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-[0.11em] text-[#655D55]">
                                    {category.name}
                                </span>
                                {modifier !== 0 && (
                                    <span className="flex-none text-[11px] text-[#6F1D24]">
                                        {modifier > 0 ? '+' : ''}₾{modifier}
                                    </span>
                                )}
                            </span>

                            <span className="block font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#111111] [text-wrap:pretty]">
                                {current?.name ?? '—'}
                            </span>

                            <span className="flex items-center justify-between gap-2 pt-0.5">
                                <span className="text-[11px] text-[#655D55]">
                                    {t('customizer.optionCount', { count: category.options.length })}
                                </span>
                                <ChevronRight className="h-3.5 w-3.5 flex-none text-[#655D55]" />
                            </span>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
