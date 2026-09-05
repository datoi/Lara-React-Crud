import { useTranslation } from 'react-i18next';

export interface ReviewRow {
    label: string;
    value: string;
    /** Right-hand figure already formatted — a surcharge, a base price, or null for none */
    amount: string | null;
}

/**
 * The last step: what the customer has specified, in the order they specified
 * it. No inputs — the decisions are all behind them, and measurements belong to
 * the tailor, so the only thing left to do is read it and go.
 */
export default function ReviewSheet({ rows }: { rows: ReviewRow[] }) {
    const { t } = useTranslation();

    return (
        <div>
            {rows.map(row => (
                <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 border-b border-[rgba(111,29,36,0.14)] px-0.5 py-[13px]"
                >
                    <span className="w-[9ch] flex-none text-[11px] uppercase tracking-[0.12em] text-[var(--kd-muted)]">
                        {row.label}
                    </span>
                    <span className="kd-display flex-1 text-[21px] text-[var(--kd-ink)]">{row.value}</span>
                    <span className="flex-none text-[13px] tabular-nums text-[var(--kd-muted)]">
                        {row.amount ?? '—'}
                    </span>
                </div>
            ))}

            <p className="mt-[18px] max-w-[44ch] text-[13px] leading-[1.55] text-[var(--kd-body)]">
                {t('customizer.measurementNote')}
            </p>
        </div>
    );
}
