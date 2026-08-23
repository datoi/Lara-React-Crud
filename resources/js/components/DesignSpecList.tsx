import type { DesignSpecLine } from '../types/customizer';

/**
 * The garment specification a customer configured, as the tailor needs to read
 * it: attribute, chosen option, and what the option adds.
 *
 * Orders carry the raw option ids too, but those are meaningless to a person and
 * do not survive a retired option — this snapshot is what makes a studio order
 * actually fulfillable.
 */
export default function DesignSpecList({ spec, label }: { spec: DesignSpecLine[]; label: string }) {
    if (spec.length === 0) return null;

    return (
        <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {spec.map((line, i) => (
                    <div key={`${line.attribute}-${i}`} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                        <dt className="shrink-0 text-xs text-slate-500">{line.attribute}</dt>
                        <dd className="text-right text-xs font-medium text-slate-900">
                            {line.option}
                            {line.price_modifier !== 0 && (
                                <span className="ml-1 font-normal text-slate-400">
                                    ({line.price_modifier > 0 ? '+' : ''}₾{line.price_modifier})
                                </span>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

/**
 * Pull the spec out of an order's stored custom_design_data.customization.
 * Anything malformed yields an empty list rather than throwing — these rows are
 * historical JSON and predate the field.
 */
export function readSpec(customization: unknown): DesignSpecLine[] {
    if (!customization || typeof customization !== 'object') return [];
    const spec = (customization as { spec?: unknown }).spec;
    if (!Array.isArray(spec)) return [];
    return spec.filter((l): l is DesignSpecLine =>
        !!l && typeof l === 'object'
        && typeof (l as DesignSpecLine).attribute === 'string'
        && typeof (l as DesignSpecLine).option === 'string');
}
