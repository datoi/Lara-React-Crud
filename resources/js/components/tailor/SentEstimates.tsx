import { Loader2, Scissors } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { formatTimestampDay } from '../../lib/dates';
import { Button } from '../ui/button';
import { openOrderTitle, type SentEstimate } from './openOrders';

/** How each outcome reads: wine for good news, plain for the rest. */
const STATE_STYLE: Record<SentEstimate['state'], string> = {
    waiting: 'border-slate-200 bg-slate-50 text-slate-700',
    offered: 'border-brand/30 bg-brand/5 text-brand',
    chosen: 'border-brand bg-brand text-white',
    not_chosen: 'border-slate-200 bg-white text-slate-500',
    closed: 'border-slate-200 bg-white text-slate-500',
};

/**
 * "გაშვებული შეთავაზებები": the estimates this tailor sent Kere and what became
 * of each. The open feed drops a request once Kere chooses a tailor, so this
 * is where a tailor learns the outcome (the CEO's request, 2026-11-08).
 */
export function SentEstimates({ active, onCount, onShowMine }: { active: boolean; onCount?: (count: number) => void; onShowMine?: () => void }) {
    const { t } = useTranslation();
    const [estimates, setEstimates] = useState<SentEstimate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const res = await fetch('/api/tailor/requests', {
                headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setEstimates((await res.json()).estimates ?? []);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (active) load();
    }, [active, load]);

    useEffect(() => {
        if (!loading && !loadError) onCount?.(estimates.length);
    }, [estimates, loading, loadError, onCount]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-900">{t('tailorComponents.tabSent')}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{t('tailorComponents.sentDesc')}</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : loadError ? (
                <div className="px-6 py-10 text-center">
                    <p className="text-sm text-destructive">{t('tailorComponents.sentLoadFailed')}</p>
                    <Button variant="default" size="sm" onClick={load} className="mt-3">{t('tailorComponents.openDesignsRetry')}</Button>
                </div>
            ) : estimates.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-400">{t('tailorComponents.noSent')}</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {estimates.map((estimate) => (
                        <li key={estimate.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                    {estimate.order.order_type === 'remodel' && <Scissors className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />}
                                    <span className="break-words">{openOrderTitle(estimate.order, t)}</span>
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    #{estimate.order.order_number} · {t('tailorComponents.sentOn', { date: formatTimestampDay(estimate.sent_at, t) })}
                                </p>
                                {estimate.offered_price != null && estimate.ready_in_days != null && (
                                    <p className="mt-1 text-sm text-slate-700">
                                        {t('tailorComponents.yourEstimate', { price: estimate.offered_price, count: estimate.ready_in_days })}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <span className={`inline-flex border px-2 py-1 text-xs font-medium ${STATE_STYLE[estimate.state]}`}>
                                    {t(`tailorComponents.state_${estimate.state}`)}
                                </span>
                                {estimate.state === 'chosen' && onShowMine && (
                                    <button type="button" onClick={onShowMine} className="text-xs font-medium text-brand underline underline-offset-4">
                                        {t('tailorComponents.seeInMyOrders')}
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
