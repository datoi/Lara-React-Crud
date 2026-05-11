import type { LayerCategory, Fabric } from '../../types/customizer';

interface PriceSummaryProps {
    basePrice: number;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    selections: Record<number, number>;
    fabricId: number | null;
    totalPrice: number;
}

export default function PriceSummary({
    basePrice,
    layerCategories,
    fabrics,
    selections,
    fabricId,
    totalPrice,
}: PriceSummaryProps) {
    const selectedFabric = fabrics.find(f => f.id === fabricId) ?? null;

    // Collect non-zero option modifiers to display line items
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
        modifierLines.push({ label: `Fabric: ${selectedFabric.name}`, amount: selectedFabric.price_modifier });
    }

    return (
        <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex justify-between text-slate-400">
                    <span>Base price</span>
                    <span>₾{basePrice.toFixed(2)}</span>
                </div>
                {modifierLines.map((line, i) => (
                    <div key={i} className="flex justify-between text-slate-400">
                        <span className="truncate max-w-[65%]">{line.label}</span>
                        <span>
                            {line.amount > 0 ? '+' : ''}₾{line.amount.toFixed(2)}
                        </span>
                    </div>
                ))}
                <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-slate-700">
                    <span>Total</span>
                    <span>₾{totalPrice.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
