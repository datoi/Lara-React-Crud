import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { formatCalendarDay, formatTimestampDay, tomorrowCalendarDay } from '../../lib/dates';
import { translateServerMessage } from '../../lib/serverMessage';
import { PhotoGrid, PhotoPicker } from '../PhotoPicker';
import { Button } from '../ui/button';
import type { TailorOrder } from './OrdersList';

/**
 * A paid remodel from the tailor's side (terms §8, §12, §17): the money that is
 * in, the garment on its way, photographing it on arrival with any damage
 * already there, and asking the customer for a later date.
 */

const ORDER_PHOTO = { endpoint: '/api/upload/order-photo', field: 'image' };

async function post(url: string, body: unknown) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data: data as { order?: TailorOrder; code?: unknown } };
}

function ReceivedForm({ order, onUpdated }: { order: TailorOrder; onUpdated: (order: TailorOrder) => void }) {
    const { t } = useTranslation();
    const [photos, setPhotos] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await post(`/api/tailor/orders/${order.id}/received`, { photos, notes: notes.trim() || null });
            if (!ok || !data.order) {
                setError(translateServerMessage(data, t, 'tailorCare.errorGeneric'));
                return;
            }
            onUpdated(data.order);
        } catch {
            setError(t('tailorCare.errorGeneric'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-3">
            <p className="text-xs leading-relaxed text-slate-500">{t('tailorCare.receivedHint')}</p>
            <PhotoPicker photos={photos} onChange={setPhotos} onUploadingChange={setUploading} {...ORDER_PHOTO} />
            <label className="block">
                <span className="text-xs font-medium text-slate-600">{t('tailorCare.receivedNotes')}</span>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={2000}
                    rows={2}
                    placeholder={t('tailorCare.receivedNotesPlaceholder')}
                    className="mt-1 w-full border border-slate-200 px-3 py-2 text-sm"
                />
            </label>
            <Button size="sm" disabled={busy || uploading || photos.length === 0} onClick={() => void submit()} className="text-xs">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('tailorCare.receivedSubmit')}
            </Button>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function ProposeDateForm({ order, onUpdated }: { order: TailorOrder; onUpdated: (order: TailorOrder) => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) {
        return (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-8 px-0 text-xs">
                {t('tailorCare.proposeOpen')}
            </Button>
        );
    }

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            const { ok, data } = await post(`/api/tailor/orders/${order.id}/due-date`, { due_date: date, reason: reason.trim() || null });
            if (!ok || !data.order) {
                setError(translateServerMessage(data, t, 'tailorCare.errorGeneric'));
                return;
            }
            setOpen(false);
            onUpdated(data.order);
        } catch {
            setError(t('tailorCare.errorGeneric'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-2 border border-slate-200 p-3">
            <p className="text-xs leading-relaxed text-slate-500">{t('tailorCare.proposeHint')}</p>
            <input
                type="date"
                min={tomorrowCalendarDay()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label={t('tailorCare.proposeDate')}
                className="w-full max-w-[200px] border border-slate-200 px-3 py-2 text-sm"
            />
            <input
                type="text"
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('tailorCare.proposeReason')}
                aria-label={t('tailorCare.proposeReason')}
                className="w-full border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-3">
                <Button size="sm" disabled={busy || !date} onClick={() => void submit()} className="text-xs">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('tailorCare.proposeSubmit')}
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setOpen(false)} className="text-xs">
                    {t('tailorCare.cancel')}
                </Button>
            </div>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function RemodelSteps({ order, onUpdated }: { order: TailorOrder; onUpdated: (order: TailorOrder) => void }) {
    const { t } = useTranslation();
    const open = order.status === 'pending' || order.status === 'processing';

    const payment = order.payment_status === 'paid'
        ? t('tailorCare.paymentFull')
        : order.payment_status === 'deposit_paid'
            ? t('tailorCare.paymentFirstIn')
            : t('tailorCare.paymentAwaiting');

    return (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('tailorCare.title')}</p>
            <p>{payment}</p>

            {order.status === 'pending' && order.payment_status !== 'unpaid' && !order.picked_up_at && <p>{t('tailorCare.courierBooking')}</p>}

            {order.picked_up_at && !order.received_at && order.status === 'pending' && (
                <div className="space-y-2">
                    <p>{t('tailorCare.onItsWay', { date: formatTimestampDay(order.picked_up_at, t) })}</p>
                    <ReceivedForm order={order} onUpdated={onUpdated} />
                </div>
            )}

            {order.received_at && (
                <div className="space-y-2">
                    <p>{t('tailorCare.receivedOn', { date: formatTimestampDay(order.received_at, t) })}</p>
                    <PhotoGrid photos={order.intake_photos ?? []} label={t('tailorCare.intakePhoto')} />
                    {order.intake_notes && <p className="whitespace-pre-line text-xs">{order.intake_notes}</p>}
                </div>
            )}

            {order.due_date && <p>{t('tailorCare.dueDate', { date: formatCalendarDay(order.due_date, t) })}</p>}
            {order.proposed_due_date && <p className="text-xs text-slate-500">{t('tailorCare.proposedWaiting', { date: formatCalendarDay(order.proposed_due_date, t) })}</p>}
            {open && order.due_date && !order.proposed_due_date && <ProposeDateForm order={order} onUpdated={onUpdated} />}

            {(order.finished_photos ?? []).length > 0 && (
                <div className="space-y-2">
                    <p>{t('tailorCare.finishedPhotos')}</p>
                    <PhotoGrid photos={order.finished_photos ?? []} label={t('tailorCare.finishedPhoto')} />
                </div>
            )}
        </div>
    );
}

/** Finishing a paid remodel takes photos of the result (terms §12.4). */
export function FinishWithPhotos({ busy, onFinish }: { busy: boolean; onFinish: (photos: string[]) => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    if (!open) {
        return (
            <Button variant="default" size="sm" onClick={() => setOpen(true)} disabled={busy}>
                {t('tailorComponents.completeOrder')}
            </Button>
        );
    }

    return (
        <div className="w-full space-y-2">
            <p className="text-xs leading-relaxed text-slate-500">{t('tailorCare.finishHint')}</p>
            <PhotoPicker photos={photos} onChange={setPhotos} onUploadingChange={setUploading} {...ORDER_PHOTO} />
            <Button variant="default" size="sm" disabled={busy || uploading || photos.length === 0} onClick={() => onFinish(photos)}>
                {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('tailorComponents.completing')}</> : t('tailorCare.finishSubmit')}
            </Button>
        </div>
    );
}
