import { useTranslation } from 'react-i18next';
import type { LayerCategory, Fabric } from '../../types/customizer';
import AttributeNavigator from './AttributeNavigator';
import FabricPicker from './FabricPicker';

interface OptionPanelProps {
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    selections: Record<number, number>;
    subSelections: Record<number, number>;
    fabricId: number | null;
    /** Attribute open in the drill-down; owned by Customizer so the preview can mirror it. */
    openAttributeId: number | null;
    onOpenAttribute: (id: number | null) => void;
    onSelectOption: (categoryId: number, optionId: number) => void;
    onSelectSubOption: (parentOptionId: number, childOptionId: number) => void;
    onSelectFabric: (fabricId: number | null) => void;
    onReset: () => void;
}

/**
 * The garment specification and the fabric choice. Every attribute goes through
 * the same spec-card grid regardless of how many there are — a garment with two
 * attributes and one with six should not read as two different pages.
 */
export default function OptionPanel({
    layerCategories,
    fabrics,
    selections,
    subSelections,
    fabricId,
    openAttributeId,
    onOpenAttribute,
    onSelectOption,
    onSelectSubOption,
    onSelectFabric,
    onReset,
}: OptionPanelProps) {
    const { t } = useTranslation();
    const choosableCategories = layerCategories.filter(c => c.options.length > 0);

    return (
        <div className="flex flex-col">
            {choosableCategories.length === 0 && (
                <p className="py-4 text-center text-sm text-[#655D55]">
                    {t('customizer.noOptionsYet')}
                </p>
            )}

            {choosableCategories.length > 0 && (
                <AttributeNavigator
                    categories={choosableCategories}
                    selections={selections}
                    subSelections={subSelections}
                    openId={openAttributeId}
                    onOpenChange={onOpenAttribute}
                    onSelectOption={onSelectOption}
                    onSelectSubOption={onSelectSubOption}
                    onReset={onReset}
                />
            )}

            {/* Material, like colour, is a property of the whole garment, so it
                stays visible while an attribute is open. No garment carries
                fabrics yet; the picker stays wired so one that does still gets
                it, and stays out of the layout when it has none. */}
            {fabrics.length > 0 && (
                <div className="mt-8 border-t border-[#111111]/20 pt-6">
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
