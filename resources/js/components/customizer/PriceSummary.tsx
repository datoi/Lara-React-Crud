import { useTranslation } from 'react-i18next';
import type { LayerCategory, Fabric } from '../../types/customizer';

interface PriceSummaryProps {
    basePrice: number;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    selections: Record<number, number>;
    fabricId: number | null;
    totalPrice: number;
}

/**
 * What the customer is paying for, line by line: the base garment, then every
 * choice that added to it, then the total. Only non-zero modifiers appear, so a
 * default configuration shows two lines rather than a page of zeroes.
 */
export default function PriceSummary({
    basePrice,
    layerCategories,
    fabrics,
    selections,
    fabricId,
    totalPrice,
}: PriceSummaryProps) {
    const { t } = useTranslation();
    const selectedFabric = fabrics.find(f => f.id === fabricId) ?? null;

    const modifierLines: { label: string; amount: number }[] = [];
    for (const category of layerCategories) {
        const optId = selections[category.id];
        if (optId === undefined) continue;
        const opt = category.options.find(o => o.id === optId);
        if (opt && opt.price_modifier !== 0) {
            modifierLines.push({ label: `${category.name}: ${opt.name}`, amount: opt.price_modifier });
        }
    }
    if (selectedFabric && selectedFabric.price_modifier !== 0) {
        modifierLines.push({
            label: `${t('customizer.fabric')}: ${selectedFabric.name}`,
            amount: selectedFabric.price_modifier,
        });
    }

    return (
        <div className="flex flex-col gap-[7px] border border-[#111111]/[0.16] bg-white px-5 py-[18px]">
            <div className="flex justify-between gap-3 text-[13px] text-[#655D55]">
                <span>{t('customizer.basePriceLabel')}</span>
                <span className="flex-none tabular-nums">₾{basePrice.toFixed(2)}</span>
            </div>

            {modifierLines.map((line, i) => (
                <div key={i} className="flex justify-between gap-3 text-[13px] text-[#655D55]">
                    <span>{line.label}</span>
                    <span className="flex-none tabular-nums">
                        {line.amount > 0 ? '+' : ''}₾{line.amount.toFixed(2)}
                    </span>
                </div>
            ))}

            <div className="mt-[3px] flex items-baseline justify-between gap-3 border-t border-[#111111]/[0.16] pt-2.5 text-[15px] font-semibold text-[#111111]">
                <span>{t('customizer.total')}</span>
                <span className="flex-none font-serif text-[20px] tabular-nums">₾{totalPrice.toFixed(2)}</span>
            </div>
        </div>
    );
}
