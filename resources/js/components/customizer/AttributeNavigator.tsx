import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
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
}

function selectedOption(category: LayerCategory, selections: Record<number, number>): LayerOption | undefined {
    return category.options.find(o => o.id === selections[category.id])
        ?? category.options.find(o => o.is_default)
        ?? category.options[0];
}

/**
 * Attribute drill-down for garments with several attributes: a list of what can
 * be changed, then the options for the one being changed. Keeps a garment with
 * five attributes and forty options from arriving as one long scroll, and keeps
 * the customer's current choices visible at the list level.
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
                <button
                    onClick={() => onOpenChange(null)}
                    className="mb-3 flex items-center gap-1 text-xs font-medium text-[#6c625b] transition-colors hover:text-[#111111]"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t('customizer.allAttributes')}
                </button>

                <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[#514843]">
                    {t('customizer.chooseAttribute', { attribute: open.name })}
                </p>

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
                    <p className="mt-3 text-center text-[11px] italic text-slate-400">
                        {t('customizer.previewComingSoon')}
                    </p>
                )}
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
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#514843]">
                {t('customizer.attributesTitle')}
            </p>
            <p className="mb-3 mt-1 text-xs text-slate-400">{t('customizer.attributesHint')}</p>

            {/* Wrapping row rather than a stacked list: six full-width rows ran
                ~370px and pushed the garment off a phone screen. As tiles two to
                a row they take roughly a third of that, so the customer can see
                what they have chosen and the preview at the same time. */}
            <ul className="flex flex-wrap gap-2">
                {categories.map(category => {
                    const current = selectedOption(category, selections);
                    return (
                        <li key={category.id} className="min-w-[calc(50%-0.25rem)] flex-1">
                            <button
                                onClick={() => onOpenChange(category.id)}
                                className="flex h-full w-full flex-col items-start gap-0.5 border border-[#111111]/20 bg-transparent px-3 py-2 text-left transition-colors hover:border-[#111111]"
                            >
                                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#6c625b]">
                                    {category.name}
                                </span>
                                <span className="line-clamp-2 text-sm font-medium leading-snug text-[#111111]">
                                    {current?.name ?? '—'}
                                    {current && current.price_modifier !== 0 && (
                                        <span className="font-normal text-slate-400">
                                            {' '}({current.price_modifier > 0 ? '+' : ''}₾{current.price_modifier})
                                        </span>
                                    )}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </motion.div>
    );
}
