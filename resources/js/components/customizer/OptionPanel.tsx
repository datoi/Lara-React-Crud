import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { LayerCategory, Fabric } from '../../types/customizer';
import CategoryOptions, { categoryHasArtwork } from './CategoryOptions';
import AttributeNavigator from './AttributeNavigator';
import FabricPicker from './FabricPicker';

/**
 * Above this many attributes the stacked panel stops being scannable, so the
 * options move behind a drill-down. Garments with one or two attributes keep
 * showing everything at once.
 */
const DRILLDOWN_MIN_CATEGORIES = 3;

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
    const { t } = useTranslation();
    const choosableCategories = layerCategories.filter(c => c.options.length > 0);

    return (
        <div className="flex flex-col gap-4">
            {choosableCategories.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                    {t('customizer.noOptionsYet')}
                </p>
            )}

            {choosableCategories.length >= DRILLDOWN_MIN_CATEGORIES ? (
                <AttributeNavigator
                    categories={choosableCategories}
                    selections={selections}
                    subSelections={subSelections}
                    onSelectOption={onSelectOption}
                    onSelectSubOption={onSelectSubOption}
                />
            ) : (
                choosableCategories.map((category, i) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        className={i > 0 ? 'border-t border-slate-100 pt-4' : undefined}
                    >
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {category.name}
                        </p>

                        <CategoryOptions
                            category={category}
                            selections={selections}
                            subSelections={subSelections}
                            onSelectOption={onSelectOption}
                            onSelectSubOption={onSelectSubOption}
                        />

                        {!categoryHasArtwork(category) && (
                            <p className="mt-3 text-center text-[11px] italic text-slate-400">
                                {t('customizer.previewComingSoon')}
                            </p>
                        )}
                    </motion.div>
                ))
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
