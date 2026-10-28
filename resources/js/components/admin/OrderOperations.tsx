import { Loader2, Truck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { formatTimestampDay } from '../../lib/dates';
import { translateServerMessage } from '../../lib/serverMessage';
import { PhotoGrid } from '../PhotoPicker';
import { Button } from '../ui/button';

/**
 * What Kere itself does on an order (terms §13–§16): book the courier at each
 * hand-over, refund money through Flitt, and answer returns and problem reports.
 */

export interface AdminOrderMoney {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    paid_total: number;
    refunded_total: number;
    open_claims_count: number;
    next_courier_step: 'pickup' | 'ship' | 'deliver' | null;
    refunds: { amount: number; status: string; note: string | null; created_at: string }[];
}

interface AdminClaim {
    id: number;
    type: 'return' | 'problem';
    status: 'open' | 'resolved' | 'rejected';
    message: string | null;
    photos: string[];
    resolution_note: string | null;
    created_at: string;
    order: { id: number; order_number: string; order_type: string; total: number; delivered_at: string | null } | null;
    customer: { name: string; email: string | null; phone: string | null } | null;
}

const COURIER: Record<'pickup' | 'ship' | 'deliver', { path: string; label: string }> = {
    pickup: { path: 'picked-up', label: 'adminCare.stepPickup' },
    ship: { path: 'ship', label: 'adminCare.stepShip' },
    deliver: { path: 'deliver', label: 'adminCare.stepDeliver' },
};

async function send(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data: data as { code?: unknown; refunded?: number } };
}

const money = (amount: number) => `₾${Number(amount).toFixed(2)}`;

function RefundForm({ order, onDone }: { order: AdminOrderMoney; onDone: () => void }) {
    const { t } = useTranslation();
    const refundable = Math.round((order.paid_total - order.refunded_total) * 100) / 100;
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(String(refundable));
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (refundable <= 0) return null;

    if (!open) {
        return (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-7 px-0 text-xs">
                {t('adminCare.refundOpen')}
            </Button>
        );
    }

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await send(`/api/admin/orders/${order.id}/refund`, 'POST', { amount: Number(amount), note: note.trim() || null });
            if (!ok) {
                const partial = data.refunded ? ` ${t('adminCare.refundPartial', { amount: money(data.refunded) })}` : '';
                // An earlier unanswered refund turned out to have gone through, and
                // nothing new was sent: the admin has to see that before asking again.
                setError(
                    data.code === 'refund_confirmed_earlier'
                        ? t('adminCare.refundConfirmedEarlier', { amount: money(data.refunded ?? 0) })
                        : translateServerMessage(data, t, 'adminCare.refundFailed') + partial,
                );
                if (data.refunded) onDone();
                return;
            }
            setOpen(false);
            onDone();
        } catch {
            setError(t('adminCare.refundFailed'));
        } finally {
            setBusy(false);
        }
    };

    const value = Number(amount);
    const valid = value > 0 && value <= refundable;

    return (
        <div className="mt-2 w-56 space-y-2 border border-slate-200 bg-white p-2">
            <label className="block text-xs text-slate-600">
                {t('adminCare.refundAmount', { max: money(refundable) })}
                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={refundable}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full border border-slate-200 px-2 py-1 text-sm"
                />
            </label>
            <input
                type="text"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('adminCare.refundNote')}
                aria-label={t('adminCare.refundNote')}
                className="w-full border border-slate-200 px-2 py-1 text-xs"
            />
            <div className="flex gap-2">
                <Button size="sm" disabled={busy || !valid} onClick={() => void submit()} className="h-7 px-3 text-xs">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('adminCare.refundSubmit')}
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setOpen(false)} className="h-7 px-0 text-xs">
                    {t('adminCare.cancel')}
                </Button>
            </div>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function OrderOperations({ order, onChanged }: { order: AdminOrderMoney; onChanged: () => void }) {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const step = order.next_courier_step;
    const owed = order.status === 'cancelled' && order.paid_total > order.refunded_total;

    const courier = async () => {
        if (!step) return;
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await send(`/api/admin/orders/${order.id}/${COURIER[step].path}`, 'PATCH');
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminCare.stepFailed'));
                return;
            }
            onChanged();
        } catch {
            setError(t('adminCare.stepFailed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mt-1.5 space-y-1">
            {step && (
                <Button variant="outline" size="sm" onClick={() => void courier()} disabled={busy} className="flex h-7 items-center gap-1 px-2.5 text-xs">
                    <Truck className="h-3.5 w-3.5" />
                    {busy ? t('adminDashboard.delivering') : t(COURIER[step].label)}
                </Button>
            )}
            {order.paid_total > 0 && (
                <p className="text-[11px] text-slate-500">
                    {t('adminCare.paid', { amount: money(order.paid_total) })}
                    {order.refunded_total > 0 && ` · ${t('adminCare.refunded', { amount: money(order.refunded_total) })}`}
                </p>
            )}
            {order.payment_status === 'deposit_paid' && <p className="text-[11px] text-slate-500">{t('adminCare.firstHalfPaid')}</p>}
            {owed && <p className="text-[11px] font-medium text-destructive">{t('adminCare.refundDue')}</p>}
            {order.open_claims_count > 0 && <p className="text-[11px] font-medium text-brand">{t('adminCare.openClaims', { count: order.open_claims_count })}</p>}
            {order.refunds.some((r) => r.status === 'failed') && <p className="text-[11px] text-destructive">{t('adminCare.refundHadFailure')}</p>}
            <RefundForm order={order} onDone={onChanged} />
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function ClaimRow({ claim, onChanged }: { claim: AdminClaim; onChanged: () => void }) {
    const { t } = useTranslation();
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const close = async (status: 'resolved' | 'rejected') => {
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await send(`/api/admin/claims/${claim.id}`, 'PATCH', { status, note: note.trim() || null });
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminCare.stepFailed'));
                return;
            }
            onChanged();
        } catch {
            setError(t('adminCare.stepFailed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-2 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">
                    {claim.type === 'return' ? t('orderCare.claimReturn') : t('orderCare.claimProblem')}
                    {claim.order && <span className="ml-2 font-mono text-xs text-slate-500">{claim.order.order_number}</span>}
                </p>
                <span className="text-xs text-slate-500">{t(`orderCare.claimStatus.${claim.status}`)} · {formatTimestampDay(claim.created_at, t)}</span>
            </div>
            {claim.customer && (
                <p className="text-xs text-slate-500">{[claim.customer.name, claim.customer.phone, claim.customer.email].filter(Boolean).join(' · ')}</p>
            )}
            {claim.message && <p className="whitespace-pre-line text-sm text-slate-700">{claim.message}</p>}
            <PhotoGrid photos={claim.photos} label={t('orderCare.problemPhotos')} />
            {claim.resolution_note && <p className="text-xs text-slate-600">{t('orderCare.claimAnswer')}: {claim.resolution_note}</p>}
            {claim.status === 'open' && (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={note}
                        maxLength={1000}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('adminCare.claimNote')}
                        aria-label={t('adminCare.claimNote')}
                        className="w-full max-w-md border border-slate-200 px-3 py-1.5 text-sm"
                    />
                    <div className="flex flex-wrap gap-3">
                        <Button size="sm" disabled={busy} onClick={() => void close('resolved')} className="h-7 px-3 text-xs">
                            {t('adminCare.claimResolve')}
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => void close('rejected')} className="h-7 px-0 text-xs">
                            {t('adminCare.claimReject')}
                        </Button>
                    </div>
                    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
                </div>
            )}
        </div>
    );
}

export function ClaimsTab({ onChanged }: { onChanged: () => void }) {
    const { t } = useTranslation();
    const [claims, setClaims] = useState<AdminClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    const load = useCallback(async () => {
        setFailed(false);
        try {
            const res = await fetch('/api/admin/claims', { headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' } });
            if (!res.ok) throw new Error();
            setClaims((await res.json()).claims ?? []);
        } catch {
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-900">{t('adminCare.claimsTitle')}</h2>
                <p className="mt-1 text-xs text-slate-500">{t('adminCare.claimsHint')}</p>
            </div>
            {loading ? (
                <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.loading')}</div>
            ) : failed ? (
                <div className="px-6 py-14 text-center text-sm text-destructive">{t('adminCare.claimsFailed')}</div>
            ) : claims.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminCare.claimsEmpty')}</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {claims.map((claim) => (
                        <ClaimRow
                            key={claim.id}
                            claim={claim}
                            onChanged={() => {
                                void load();
                                onChanged();
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
