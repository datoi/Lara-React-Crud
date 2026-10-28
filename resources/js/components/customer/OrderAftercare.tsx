import { Check, Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { formatCalendarDay, formatTimestampDay } from '../../lib/dates';
import { translateServerMessage } from '../../lib/serverMessage';
import { PhotoGrid, PhotoPicker } from '../PhotoPicker';
import { Button } from '../ui/button';

/**
 * What a customer can do with an order after placing it, as the terms set it
 * out: follow a paid remodel through its steps (§8, §12, §13), answer a new
 * completion date (§17), cancel before work begins (§14), return a ready-made
 * item within 14 days (§15) and report a problem with photos (§16).
 */

export interface OrderClaimView {
    id: number;
    type: 'return' | 'problem';
    status: 'open' | 'resolved' | 'rejected';
    message: string | null;
    photos: string[];
    resolution_note: string | null;
    created_at: string;
    resolved_at: string | null;
}

export interface PaymentDue {
    stage: 'full' | 'deposit' | 'balance';
    amount: number;
}

export interface AftercareOrder {
    id: number;
    order_type: 'marketplace' | 'custom' | 'remodel';
    status: string;
    payment_status?: string;
    deposit_amount?: number | null;
    payment_due?: PaymentDue | null;
    paid_total?: number;
    refunded_total?: number;
    due_date?: string | null;
    proposed_due_date?: string | null;
    deposit_paid_at?: string | null;
    paid_at?: string | null;
    picked_up_at?: string | null;
    received_at?: string | null;
    intake_photos?: string[];
    intake_notes?: string | null;
    finished_photos?: string[];
    shipped_at?: string | null;
    delivered_at?: string | null;
    cancellable?: boolean;
    returnable_until?: string | null;
    reportable?: boolean;
    claims?: OrderClaimView[];
}

const money = (amount: number) => `₾${Number(amount).toFixed(2)}`;

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: { code?: unknown } }> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
}

/** A remodel paid online is a paid remodel unless it predates online payment. */
export function isPaidRemodel(order: AftercareOrder): boolean {
    return order.order_type === 'remodel' && !!order.payment_status && order.payment_status !== 'not_required';
}

function PayButton({ due, paying, onPay }: { due: PaymentDue; paying: boolean; onPay: () => void }) {
    const { t } = useTranslation();

    return (
        <Button size="sm" disabled={paying} onClick={onPay} className="mt-2 h-8 px-3 text-xs">
            {paying ? t('customerDashboard.payStarting') : t('orderCare.payAmount', { amount: money(due.amount) })}
        </Button>
    );
}

export function RemodelProgress({ order, paying, onPay }: { order: AftercareOrder; paying: boolean; onPay: () => void }) {
    const { t } = useTranslation();
    const due = order.payment_due;
    const finished = ['finished', 'shipped', 'delivered'].includes(order.status);

    const steps: { key: string; done: boolean; when?: string | null; body?: ReactNode }[] = [
        {
            key: 'firstPayment',
            done: !!order.deposit_paid_at,
            when: order.deposit_paid_at,
            body: due?.stage === 'deposit'
                ? <><p>{t('orderCare.firstPaymentDue', { amount: money(due.amount) })}</p><PayButton due={due} paying={paying} onPay={onPay} /></>
                : order.deposit_amount ? <p>{money(order.deposit_amount)}</p> : null,
        },
        { key: 'pickup', done: !!order.picked_up_at, when: order.picked_up_at },
        {
            key: 'atTailor',
            done: !!order.received_at,
            when: order.received_at,
            body: order.received_at ? (
                <div className="space-y-2">
                    <PhotoGrid photos={order.intake_photos ?? []} label={t('orderCare.intakePhoto')} />
                    {order.intake_notes && <p className="whitespace-pre-line"><span className="font-medium text-slate-700">{t('orderCare.intakeNotes')}:</span> {order.intake_notes}</p>}
                    {order.due_date && <p>{t('orderCare.dueDate', { date: formatCalendarDay(order.due_date, t) })}</p>}
                </div>
            ) : null,
        },
        {
            key: 'finished',
            done: finished,
            body: finished ? <PhotoGrid photos={order.finished_photos ?? []} label={t('orderCare.finishedPhoto')} /> : null,
        },
        {
            key: 'finalPayment',
            done: order.payment_status === 'paid',
            when: order.payment_status === 'paid' ? order.paid_at : null,
            body: due?.stage === 'balance'
                ? <><p>{t('orderCare.finalPaymentDue', { amount: money(due.amount) })}</p><PayButton due={due} paying={paying} onPay={onPay} /></>
                : null,
        },
        { key: 'withCourier', done: !!order.shipped_at, when: order.shipped_at },
        { key: 'delivered', done: order.status === 'delivered', when: order.delivered_at },
    ];

    return (
        <div className="bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('orderCare.progressTitle')}</p>
            <ol className="space-y-3">
                {steps.map((step) => (
                    <li key={step.key} className="flex gap-3">
                        <span
                            aria-hidden="true"
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${step.done ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white'}`}
                        >
                            {step.done && <Check className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 flex-1 text-xs text-slate-500">
                            <p className={`text-sm ${step.done ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                                {t(`orderCare.step.${step.key}`)}
                                <span className="sr-only">{step.done ? ` — ${t('orderCare.stepDone')}` : ''}</span>
                            </p>
                            {step.when && <p>{formatTimestampDay(step.when, t)}</p>}
                            {step.body && <div className="mt-1.5">{step.body}</div>}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export function DueDateProposal({ order, onAnswered }: { order: AftercareOrder; onAnswered: () => void }) {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!order.proposed_due_date) return null;

    const answer = async (accept: boolean) => {
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await postJson(`/api/customer/orders/${order.id}/due-date`, { accept });
            if (!ok) {
                setError(translateServerMessage(data, t, 'orderCare.errorGeneric'));
                return;
            }
            onAnswered();
        } catch {
            setError(t('orderCare.errorNetwork'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="border border-brand/30 bg-brand/5 p-4">
            <p className="text-sm font-medium text-slate-900">{t('orderCare.newDateTitle')}</p>
            <p className="mt-1 text-sm text-slate-600">
                {t('orderCare.newDateBody', {
                    date: formatCalendarDay(order.proposed_due_date, t),
                    current: order.due_date ? formatCalendarDay(order.due_date, t) : '—',
                })}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
                <Button size="sm" disabled={busy} onClick={() => void answer(true)} className="h-8 px-3 text-xs">
                    {t('orderCare.newDateAccept')}
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void answer(false)} className="h-8 px-3 text-xs">
                    {t('orderCare.newDateDecline')}
                </Button>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function CancelOrder({ order, onCancelled }: { order: AftercareOrder; onCancelled: () => void }) {
    const { t } = useTranslation();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!order.cancellable) return null;

    const cancel = async () => {
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await postJson(`/api/customer/orders/${order.id}/cancel`, {});
            if (!ok) {
                setError(translateServerMessage(data, t, 'orderCare.errorGeneric'));
                return;
            }
            onCancelled();
        } catch {
            setError(t('orderCare.errorNetwork'));
        } finally {
            setBusy(false);
        }
    };

    const paid = (order.paid_total ?? 0) > 0;

    return (
        <div className="border-t border-slate-100 pt-4">
            {confirming ? (
                <div className="space-y-3">
                    <p className="text-sm text-slate-700">{paid ? t('orderCare.cancelConfirmPaid') : t('orderCare.cancelConfirm')}</p>
                    <div className="flex flex-wrap gap-3">
                        <Button size="sm" disabled={busy} onClick={() => void cancel()} className="h-8 px-3 text-xs">
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('orderCare.cancelYes')}
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirming(false)} className="h-8 px-3 text-xs">
                            {t('orderCare.cancelNo')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirming(true)} className="h-8 px-0 text-xs">
                    {t('orderCare.cancelOrder')}
                </Button>
            )}
            {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function ClaimForm({ order, type, onDone, onCancel }: { order: AftercareOrder; type: 'return' | 'problem'; onDone: () => void; onCancel: () => void }) {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isProblem = type === 'problem';
    const ready = !uploading && !busy && (!isProblem || (message.trim().length > 0 && photos.length > 0));

    const submit = async () => {
        if (!ready) return;
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await postJson(`/api/customer/orders/${order.id}/claims`, {
                type,
                message: message.trim() || null,
                photos,
            });
            if (!ok) {
                setError(translateServerMessage(data, t, 'orderCare.errorGeneric'));
                return;
            }
            onDone();
        } catch {
            setError(t('orderCare.errorNetwork'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-3 border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-900">{isProblem ? t('orderCare.problemTitle') : t('orderCare.returnTitle')}</p>
            <p className="text-xs leading-relaxed text-slate-500">{isProblem ? t('orderCare.problemHint') : t('orderCare.returnHint')}</p>
            <label className="block">
                <span className="text-xs font-medium text-slate-600">{isProblem ? t('orderCare.problemMessage') : t('orderCare.returnMessage')}</span>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="mt-1 w-full border border-slate-200 px-3 py-2 text-sm"
                />
            </label>
            {isProblem && (
                <div>
                    <p className="mb-1 text-xs font-medium text-slate-600">{t('orderCare.problemPhotos')}</p>
                    <PhotoPicker photos={photos} onChange={setPhotos} onUploadingChange={setUploading} />
                </div>
            )}
            <div className="flex flex-wrap gap-3">
                <Button size="sm" disabled={!ready} onClick={() => void submit()} className="h-8 px-3 text-xs">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isProblem ? t('orderCare.problemSend') : t('orderCare.returnSend')}
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={onCancel} className="h-8 px-3 text-xs">
                    {t('orderCare.formCancel')}
                </Button>
            </div>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function ClaimsPanel({ order, onChanged }: { order: AftercareOrder; onChanged: () => void }) {
    const { t } = useTranslation();
    const [form, setForm] = useState<'return' | 'problem' | null>(null);
    const claims = order.claims ?? [];

    if (!order.returnable_until && !order.reportable && claims.length === 0) return null;

    return (
        <div className="space-y-3 border-t border-slate-100 pt-4">
            {claims.map((claim) => (
                <div key={claim.id} className="bg-slate-50 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">{claim.type === 'return' ? t('orderCare.claimReturn') : t('orderCare.claimProblem')}</span>
                        <span className="text-xs text-slate-500">{t(`orderCare.claimStatus.${claim.status}`)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{formatTimestampDay(claim.created_at, t)}</p>
                    {claim.message && <p className="mt-1.5 whitespace-pre-line text-xs text-slate-600">{claim.message}</p>}
                    {claim.photos.length > 0 && <div className="mt-2"><PhotoGrid photos={claim.photos} label={t('orderCare.problemPhotos')} /></div>}
                    {claim.resolution_note && <p className="mt-2 text-xs text-slate-700"><span className="font-medium">{t('orderCare.claimAnswer')}:</span> {claim.resolution_note}</p>}
                </div>
            ))}

            {form ? (
                <ClaimForm
                    order={order}
                    type={form}
                    onCancel={() => setForm(null)}
                    onDone={() => {
                        setForm(null);
                        onChanged();
                    }}
                />
            ) : (
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {order.returnable_until && (
                        <Button size="sm" variant="outline" onClick={() => setForm('return')} className="h-8 px-0 text-xs">
                            {t('orderCare.returnOpen', { date: formatCalendarDay(order.returnable_until, t) })}
                        </Button>
                    )}
                    {order.reportable && (
                        <Button size="sm" variant="outline" onClick={() => setForm('problem')} className="h-8 px-0 text-xs">
                            {t('orderCare.problemOpen')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
