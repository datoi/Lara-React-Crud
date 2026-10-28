import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { translateServerMessage } from '../../lib/serverMessage';
import { OrderChat } from '../OrderChat';
import { Button } from '../ui/button';
import { TailorScore, type TailorScoreValue } from './ReviewsTab';

/**
 * Kere's side of an open request (terms §8, §18). Tailors send Kere internal
 * estimates; an admin picks one, sets the price and time the customer sees,
 * and sends that as Kere's offer. The customer never sees the estimates or
 * who sent them. Kere also holds both conversations on every order.
 */

export interface AdminEstimate {
    id: number;
    /** `score` is the tailor's internal review score, which customers never see */
    tailor: { id: number; name: string; score: TailorScoreValue | null } | null;
    price: number | null;
    days: number | null;
    message: string | null;
    status: 'pending' | 'accepted' | 'declined';
}

export interface AdminOffer {
    price: number;
    total: number;
    first_payment: number | null;
    days: number | null;
    note: string | null;
    request_id: number;
}

export interface OfferableOrder {
    id: number;
    order_type: 'marketplace' | 'custom' | 'remodel';
    estimates: AdminEstimate[];
    offer: AdminOffer | null;
}

const money = (amount: number) => `₾${Number(amount).toFixed(2)}`;

export function KereOfferForm({ order, onSent }: { order: OfferableOrder; onSent: () => void }) {
    const { t } = useTranslation();
    const usable = order.estimates.filter((e) => e.status === 'pending');
    const [requestId, setRequestId] = useState<number | null>(order.offer?.request_id ?? null);
    const [price, setPrice] = useState(order.offer ? String(order.offer.price) : '');
    const [days, setDays] = useState(order.offer?.days ? String(order.offer.days) : '');
    const [note, setNote] = useState(order.offer?.note ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const choose = (estimate: AdminEstimate) => {
        setRequestId(estimate.id);
        setPrice(estimate.price != null ? String(estimate.price) : '');
        setDays(estimate.days != null ? String(estimate.days) : '');
    };

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}/offer`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: requestId, price: Number(price), days: Number(days), note: note.trim() || null }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(translateServerMessage(data, t, 'adminOffer.errorSend'));
                return;
            }
            onSent();
        } catch {
            setError(t('adminOffer.errorSend'));
        } finally {
            setBusy(false);
        }
    };

    if (order.estimates.length === 0) {
        return <p className="text-xs text-slate-400">{t('adminOffer.noEstimates')}</p>;
    }

    const valid = requestId !== null && Number(price) >= 1 && Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 120;

    return (
        <div className="w-72 max-w-full space-y-2">
            {order.offer && (
                <p className="text-xs text-slate-900">
                    {t('adminOffer.sent', { price: money(order.offer.price), days: order.offer.days ?? '—' })}
                </p>
            )}

            <fieldset className="space-y-1.5">
                <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('adminOffer.estimates')}</legend>
                {order.estimates.map((estimate) => (
                    <label
                        key={estimate.id}
                        className={`flex items-start gap-2 border px-2 py-1.5 text-xs ${estimate.status === 'pending' ? 'cursor-pointer border-slate-200' : 'border-slate-100 text-slate-400'}`}
                    >
                        <input
                            type="radio"
                            name={`estimate-${order.id}`}
                            className="mt-0.5 accent-brand"
                            checked={requestId === estimate.id}
                            disabled={estimate.status !== 'pending'}
                            onChange={() => choose(estimate)}
                        />
                        <span className="min-w-0">
                            <span className="font-medium text-slate-900">{estimate.tailor?.name ?? '—'}</span>
                            {estimate.tailor && <> · <TailorScore score={estimate.tailor.score} /></>}
                            {' · '}
                            {estimate.price != null ? money(estimate.price) : '—'}
                            {estimate.days != null && ` · ${t('adminOffer.days', { count: estimate.days })}`}
                            {estimate.message && <span className="block truncate text-slate-500">“{estimate.message}”</span>}
                        </span>
                    </label>
                ))}
            </fieldset>

            {usable.length > 0 && (
                <div className="space-y-2 border border-slate-200 bg-white p-2">
                    <div className="grid grid-cols-2 gap-2">
                        <label className="block text-xs text-slate-600">
                            {t('adminOffer.price')}
                            <input type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full border border-slate-200 px-2 py-1 text-sm" />
                        </label>
                        <label className="block text-xs text-slate-600">
                            {t('adminOffer.daysLabel')}
                            <input type="number" min="1" max="120" step="1" value={days} onChange={(e) => setDays(e.target.value)} className="mt-1 w-full border border-slate-200 px-2 py-1 text-sm" />
                        </label>
                    </div>
                    <input
                        type="text"
                        value={note}
                        maxLength={500}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('adminOffer.note')}
                        aria-label={t('adminOffer.note')}
                        className="w-full border border-slate-200 px-2 py-1 text-xs"
                    />
                    <Button size="sm" disabled={busy || !valid} onClick={() => void submit()} className="h-7 px-3 text-xs">
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : order.offer ? t('adminOffer.resend') : t('adminOffer.send')}
                    </Button>
                    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
                </div>
            )}
        </div>
    );
}

/** Both of an order's conversations, with the customer and with the tailor. */
export function AdminOrderChat({ orderId, adminId, hasTailor }: { orderId: number; adminId: number; hasTailor: boolean }) {
    const { t } = useTranslation();
    const [channel, setChannel] = useState<'customer' | 'tailor'>('customer');

    return (
        <div>
            <div role="tablist" className="mb-2 flex gap-4 text-xs">
                {(['customer', 'tailor'] as const).map((c) => (
                    <button
                        key={c}
                        type="button"
                        role="tab"
                        aria-selected={channel === c}
                        disabled={c === 'tailor' && !hasTailor}
                        onClick={() => setChannel(c)}
                        className={`border-b-2 pb-1 font-medium disabled:cursor-not-allowed disabled:opacity-40 ${channel === c ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}
                    >
                        {t(c === 'customer' ? 'adminOffer.chatCustomer' : 'adminOffer.chatTailor')}
                    </button>
                ))}
            </div>
            <OrderChat key={channel} orderId={orderId} currentUserId={adminId} adminChannel={channel} />
        </div>
    );
}
