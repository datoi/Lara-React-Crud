import { useTranslation } from 'react-i18next';
import type { DesignSpecLine } from '../types/customizer';

/**
 * The garment specification a customer configured, as the tailor needs to read
 * it: attribute, chosen option, and what the option adds.
 *
 * Orders carry the raw option ids too, but those are meaningless to a person and
 * do not survive a retired option — this snapshot is what makes a studio order
 * actually fulfillable.
 */
export default function DesignSpecList({
    spec,
    label,
    garment = null,
}: {
    spec: DesignSpecLine[];
    label: string;
    /** The garment being made. Heads the list so a tailor reads what it is first. */
    garment?: string | null;
}) {
    const { t } = useTranslation();

    if (spec.length === 0) return null;

    return (
        <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {garment && (
                    <div className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                        <dt className="shrink-0 text-xs text-slate-500">{t('orderReview.garment')}</dt>
                        <dd className="text-right text-xs font-semibold text-slate-900">{garment}</dd>
                    </div>
                )}
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
 * The garment the customer was actually configuring.
 *
 * garment_type on the order is a taxonomy bucket — every one of the Tops
 * garments files under "shirt" — so on its own it cannot tell a corset top from
 * a hoodie. Null on orders placed before the name was carried, which the caller
 * should fall back from rather than render blank.
 */
export function readProductName(customization: unknown): string | null {
    if (!customization || typeof customization !== 'object') return null;
    const name = (customization as { product_name?: unknown }).product_name;
    return typeof name === 'string' && name.trim() !== '' ? name : null;
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
