import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LayerCategory, LayerOption } from '../../types/customizer';
import CategoryOptions, { categoryHasArtwork } from './CategoryOptions';

interface AttributeNavigatorProps {
    categories: LayerCategory[];
    selections: Record<number, number>;
    subSelections: Record<number, number>;
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
    onSelectOption,
    onSelectSubOption,
}: AttributeNavigatorProps) {
    const { t } = useTranslation();
    const [openId, setOpenId] = useState<number | null>(null);

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
                    onClick={() => setOpenId(null)}
                    className="mb-3 flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t('customizer.allAttributes')}
                </button>

                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t('customizer.chooseAttribute', { attribute: open.name })}
                    </p>
                    {!categoryHasArtwork(open) && (
                        <span className="text-[11px] italic text-slate-400">
                            {t('customizer.previewComingSoon')}
                        </span>
                    )}
                </div>

                <CategoryOptions
                    category={open}
                    selections={selections}
                    subSelections={subSelections}
                    onSelectOption={onSelectOption}
                    onSelectSubOption={onSelectSubOption}
                />
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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('customizer.attributesTitle')}
            </p>
            <p className="mb-3 mt-1 text-xs text-slate-400">{t('customizer.attributesHint')}</p>

            <ul className="divide-y divide-slate-100 border-y border-slate-100">
                {categories.map(category => {
                    const current = selectedOption(category, selections);
                    return (
                        <li key={category.id}>
                            <button
                                onClick={() => setOpenId(category.id)}
                                className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-slate-50"
                            >
                                <span className="min-w-0">
                                    <span className="block text-sm font-medium text-slate-900">{category.name}</span>
                                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                                        {current?.name ?? '—'}
                                        {current && current.price_modifier !== 0 && (
                                            <span className="text-slate-400">
                                                {' '}({current.price_modifier > 0 ? '+' : ''}₾{current.price_modifier})
                                            </span>
                                        )}
                                        {/* Choosable as normal — only the picture is missing. */}
                                        {!categoryHasArtwork(category) && (
                                            <span className="italic text-slate-400">
                                                {' · '}{t('customizer.previewComingSoon')}
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </motion.div>
    );
}
