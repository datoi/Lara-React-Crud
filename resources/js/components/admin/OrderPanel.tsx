import { ChevronDown, ChevronUp, Loader2, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTimestampDay } from '../../lib/dates';
import { translateServerMessage } from '../../lib/serverMessage';
import { readProductName, readSpec } from '../DesignSpecList';
import { Facts, Photos, SidePanel, useDesk } from './WorkspaceUi';
import {
    STATUS_DOT,
    ago,
    api,
    deskStatus,
    initials,
    isActive,
    longDay,
    money,
    refundDue,
    scoreText,
    type AdminClaim,
    type AdminEstimate,
    type AdminOrder,
    type AdminUser,
    type CourierStep,
} from './workspace';

/**
 * One order in the side panel. Kere's own steps live here: its offer from the
 * tailors' estimates (terms §8), a tailor for an order without one, each
 * courier hand-over (§13), refunds through Flitt and answers to returns and
 * problem reports (§15, §16), and both of the order's conversations (§18).
 */

export type OrderTab = 'details' | 'messages' | 'activity';

const COURIER_PATH: Record<CourierStep, string> = { pickup: 'picked-up', ship: 'ship', deliver: 'deliver' };
const COURIER_LABEL: Record<CourierStep, string> = { pickup: 'adminCare.stepPickup', ship: 'adminCare.stepShip', deliver: 'adminCare.stepDeliver' };

export function OrderPanel({
    order,
    claims,
    orders,
    tailors,
    me,
    unread,
    initialTab,
    onClose,
    onChanged,
    onRead,
    onCustomerOrders,
    onOpenPerson,
}: {
    order: AdminOrder;
    claims: AdminClaim[];
    orders: AdminOrder[];
    tailors: AdminUser[];
    me: number;
    unread: number;
    initialTab: OrderTab;
    onClose: () => void;
    onChanged: () => void;
    onRead: () => void;
    onCustomerOrders: (customerId: number) => void;
    onOpenPerson: (userId: number) => void;
}) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const [tab, setTab] = useState<OrderTab>(initialTab);
    const status = deskStatus(order);

    useEffect(() => {
        if (tab === 'messages') onRead();
    }, [tab, order.message_count, onRead]);

    const copy = () => {
        navigator.clipboard
            .writeText(order.order_number)
            .then(() => toast(t('adminDesk.copied', { what: order.order_number })))
            .catch(() => toast(t('adminDesk.copyFailed')));
    };

    return (
        <SidePanel<OrderTab>
            kicker={t(`adminDesk.kindOrder.${order.order_type}`)}
            title={order.order_number}
            status={{ dot: STATUS_DOT[status], label: t(`adminDesk.status.${status}`) }}
            meta={<span>{t('adminDesk.placedOn', { date: longDay(order.created_at, t), ago: ago(order.created_at, t) })}</span>}
            menu={[{ label: t('adminDesk.copyOrderNumber'), onSelect: copy }]}
            tabs={[
                { id: 'details', label: t('adminDesk.tabDetails') },
                { id: 'messages', label: t('adminDesk.tabMessages'), count: unread || order.message_count, hot: unread > 0 },
                { id: 'activity', label: t('adminDesk.tabActivity'), count: order.admin_notes.length },
            ]}
            tab={tab}
            onTab={setTab}
            onClose={onClose}
        >
            {tab === 'details' && (
                <div className="ka-col">
                    {claims.filter((c) => c.status === 'open').map((claim) => (
                        <ProblemBox key={claim.id} claim={claim} onChanged={onChanged} />
                    ))}
                    <NextStep order={order} orders={orders} tailors={tailors} onChanged={onChanged} />
                    <CustomerBlock order={order} orders={orders} onCustomerOrders={onCustomerOrders} onOpenPerson={onOpenPerson} />
                    <ItemsBlock order={order} />
                    <PaymentBlock order={order} onChanged={onChanged} />
                </div>
            )}
            {tab === 'messages' && <Conversation order={order} me={me} onSent={onChanged} />}
            {tab === 'activity' && <Activity order={order} claims={claims} onChanged={onChanged} />}
        </SidePanel>
    );
}

// ─── Open problems ───────────────────────────────────────────────────────────

function ProblemBox({ claim, onChanged }: { claim: AdminClaim; onChanged: () => void }) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const close = async (status: 'resolved' | 'rejected') => {
        if (note.trim().length < 10) {
            setError(t('adminDesk.answerTooShort'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api(`/api/admin/claims/${claim.id}`, 'PATCH', { status, note: note.trim() });
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminCare.stepFailed'));
                return;
            }
            toast(t(status === 'resolved' ? 'adminDesk.claimResolved' : 'adminDesk.claimDeclined'));
            onChanged();
        } catch {
            setError(t('adminDesk.networkError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <section aria-label={t('adminDesk.openProblem')} className="ka-box ka-box-warn">
            <b>
                <TriangleAlert size={15} aria-hidden="true" />
                {t(claim.type === 'return' ? 'orderCare.claimReturn' : 'orderCare.claimProblem')}
            </b>
            {claim.message && <p className="ka-pre">{claim.message}</p>}
            <Photos photos={claim.photos} label={t('orderCare.problemPhotos')} />
            <span className="ka-small" style={{ color: '#7A4B4F' }}>{t('adminDesk.openedOn', { date: formatTimestampDay(claim.created_at, t) })}</span>
            {!open ? (
                <div className="ka-row-btn" style={{ marginTop: 4 }}>
                    <button type="button" className="ka-btn ka-btn-sm ka-btn-primary" onClick={() => setOpen(true)}>
                        {t('adminDesk.answer')}
                    </button>
                </div>
            ) : (
                <div className="ka-form" style={{ marginTop: 4 }}>
                    <label htmlFor={`ka-claim-${claim.id}`} className="ka-sr">{t('adminDesk.answerLabel')}</label>
                    <textarea
                        id={`ka-claim-${claim.id}`}
                        className="ka-area"
                        rows={3}
                        maxLength={1000}
                        placeholder={t('adminDesk.answerLabel')}
                        aria-invalid={!!error || undefined}
                        value={note}
                        onChange={(e) => { setNote(e.target.value); setError(''); }}
                    />
                    <span className="ka-hint">{t('adminDesk.answerHint')}</span>
                    {error && <p role="alert" className="ka-err">{error}</p>}
                    <div className="ka-row-btn" style={{ gap: 8 }}>
                        <button type="button" className="ka-btn ka-btn-sm ka-btn-primary" disabled={busy} onClick={() => void close('resolved')}>
                            {t('adminCare.claimResolve')}
                        </button>
                        <button type="button" className="ka-btn ka-btn-sm" disabled={busy} onClick={() => void close('rejected')}>
                            {t('adminCare.claimReject')}
                        </button>
                        <button type="button" className="ka-btn ka-btn-sm ka-btn-quiet" disabled={busy} onClick={() => { setOpen(false); setError(''); }}>
                            {t('adminCare.cancel')}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

// ─── Next step ───────────────────────────────────────────────────────────────

function NextStep({ order, orders, tailors, onChanged }: { order: AdminOrder; orders: AdminOrder[]; tailors: AdminUser[]; onChanged: () => void }) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const [picking, setPicking] = useState(false);
    const [offerOpen, setOfferOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const status = deskStatus(order);
    const tailor = order.tailor?.name ?? t('adminDesk.theTailor');
    const viaOffer = order.status === 'pending_assignment' && order.order_type !== 'marketplace';
    const needsPicker = order.status === 'pending_assignment' && !viaOffer;
    const canChange = !!order.tailor && (order.status === 'pending' || order.status === 'processing');
    const step = order.next_courier_step;

    const courier = async () => {
        if (!step) return;
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api(`/api/admin/orders/${order.id}/${COURIER_PATH[step]}`, 'PATCH');
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminCare.stepFailed'));
                return;
            }
            toast(t('adminDesk.recorded', { step: t(COURIER_LABEL[step]) }));
            onChanged();
        } catch {
            setError(t('adminDesk.networkError'));
        } finally {
            setBusy(false);
        }
    };

    let title: string;
    let text = '';
    if (needsPicker || picking) {
        title = picking ? t('adminDesk.step.chooseNew') : t('adminDesk.step.choose');
        if (picking) text = t('adminDesk.step.chooseNewText', { tailor });
    } else if (viaOffer && order.offer && !offerOpen) {
        title = t('adminDesk.step.offerSent', { price: money(order.offer.price), days: order.offer.days ?? '—' });
        text = t('adminDesk.step.offerSentText');
    } else if (viaOffer) {
        const usable = order.estimates.filter((e) => e.status === 'pending').length;
        title = usable ? t('adminDesk.step.makeOffer') : t('adminDesk.step.waitEstimates');
        text = usable ? t('adminDesk.step.makeOfferText', { count: usable }) : t(`adminDesk.step.waitEstimatesText.${order.order_type}`);
    } else if (status === 'unpaid') {
        title = order.status === 'finished' ? t('adminDesk.step.waitFinal') : order.order_type === 'remodel' ? t('adminDesk.step.waitFirst') : t('adminDesk.step.waitPay');
        text = order.order_type === 'marketplace' ? t('adminDesk.step.waitPayText', { tailor }) : '';
    } else if (step === 'pickup') {
        title = t('adminDesk.step.collect');
        text = t('adminDesk.step.collectText');
    } else if (status === 'waiting' && order.paid_remodel && order.picked_up_at && !order.received_at) {
        title = t('adminDesk.step.onItsWay', { tailor });
        text = t('adminDesk.step.onItsWayText', { date: longDay(order.picked_up_at.slice(0, 10), t) });
    } else if (status === 'waiting') {
        title = t('adminDesk.step.waitStart', { tailor });
        text = order.received_at ? t('adminDesk.step.arrived', { date: longDay(order.received_at.slice(0, 10), t) }) : '';
    } else if (status === 'making') {
        title = t('adminDesk.step.making', { tailor });
        text = order.due_date ? t('adminDesk.step.due', { date: longDay(order.due_date, t) }) : '';
    } else if (status === 'ready') {
        title = t('adminDesk.step.ready');
        text = order.tailor ? t('adminDesk.step.madeBy', { tailor }) : '';
    } else if (status === 'shipped') {
        title = t('adminDesk.step.shipped');
        text = order.shipped_at ? t('adminDesk.step.handedOver', { date: longDay(order.shipped_at.slice(0, 10), t) }) : '';
    } else if (status === 'delivered') {
        title = t('adminDesk.step.delivered');
        text = order.delivered_at ? t('adminDesk.step.on', { date: longDay(order.delivered_at, t) }) : '';
    } else {
        title = t('adminDesk.step.cancelled');
        text = order.cancelled_at ? t('adminDesk.step.on', { date: longDay(order.cancelled_at.slice(0, 10), t) }) : '';
    }

    const showOfferForm = viaOffer && order.estimates.length > 0 && (!order.offer || offerOpen);
    const acting = needsPicker || picking || showOfferForm || !!step;

    return (
        <section aria-label={t('adminDesk.nextStep')} className="ka-box">
            <span className="ka-lbl">{acting ? t('adminDesk.nextStep') : t('adminDesk.statusLabel')}</span>
            <div className="ka-box-head">
                <span className="ka-box-title">{title}</span>
                {text && <span className="ka-muted">{text}</span>}
            </div>

            {(needsPicker || picking) && (
                <TailorPicker order={order} orders={orders} tailors={tailors} changing={picking} onDone={() => { setPicking(false); onChanged(); }} onCancel={() => setPicking(false)} />
            )}

            {showOfferForm && <OfferForm order={order} onSent={() => { setOfferOpen(false); onChanged(); }} onCancel={order.offer ? () => setOfferOpen(false) : undefined} />}

            {viaOffer && order.offer && !offerOpen && order.estimates.some((e) => e.status === 'pending') && (
                <button type="button" className="ka-link" onClick={() => setOfferOpen(true)}>{t('adminDesk.changeOffer')}</button>
            )}

            {step && !picking && (
                <div className="ka-row-btn">
                    <button type="button" className="ka-btn ka-btn-primary" disabled={busy} onClick={() => void courier()}>
                        {busy && <Loader2 size={15} className="ka-spin" aria-hidden="true" />}
                        {busy ? t('adminDesk.saving') : t(COURIER_LABEL[step])}
                    </button>
                </div>
            )}

            {canChange && !picking && (
                <button type="button" className="ka-link" onClick={() => setPicking(true)}>{t('adminDesk.changeTailor')}</button>
            )}

            {status === 'cancelled' && refundDue(order) && <p className="ka-note-warn">{t('adminCare.refundDue')}</p>}
            {error && <p role="alert" className="ka-err">{error}</p>}
        </section>
    );
}

function TailorPicker({
    order,
    orders,
    tailors,
    changing,
    onDone,
    onCancel,
}: {
    order: AdminOrder;
    orders: AdminOrder[];
    tailors: AdminUser[];
    changing: boolean;
    onDone: () => void;
    onCancel: () => void;
}) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const [pick, setPick] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = (id: number) => orders.filter((o) => o.tailor?.id === id && isActive(o) && o.status !== 'pending_assignment').length;
    const options = tailors.filter((u) => u.approval_status !== 'pending' && u.approval_status !== 'rejected');
    const free = options.filter((u) => !u.is_suspended && u.id !== order.tailor?.id);
    const lightest = free.length > 1 ? Math.min(...free.map((u) => load(u.id))) : null;
    const lightestIds = lightest === null ? [] : free.filter((u) => load(u.id) === lightest).map((u) => u.id);
    const choice = options.find((u) => u.id === pick);

    const assign = async () => {
        if (!choice) return;
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api(`/api/admin/orders/${order.id}/assign`, 'PATCH', { tailor_id: choice.id });
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminDashboard.assignFailed'));
                return;
            }
            toast(t(changing ? 'adminDesk.reassigned' : 'adminDesk.assigned', { name: choice.name }));
            onDone();
        } catch {
            setError(t('adminDesk.networkError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <legend className="ka-sr">{t('adminDesk.step.choose')}</legend>
                {options.map((u) => {
                    const current = u.id === order.tailor?.id;
                    const off = current || u.is_suspended || busy;
                    const n = load(u.id);
                    const tag = current ? t('adminDesk.current') : u.is_suspended ? t('adminDesk.suspended') : lightestIds.length === 1 && lightestIds[0] === u.id ? t('adminDesk.lightest') : '';
                    return (
                        <label key={u.id} className={`ka-opt${pick === u.id ? ' is-on' : off ? ' is-off' : ''}`}>
                            <input type="radio" name={`ka-pick-${order.id}`} checked={pick === u.id} disabled={off} onChange={() => { setPick(u.id); setError(''); }} />
                            <span className="ka-av">{initials(u.name)}</span>
                            <span className="ka-opt-text">
                                <b>{u.name}</b>
                                <span>
                                    {n ? t('adminDesk.activeOrders', { count: n }) : t('adminDesk.noActiveOrders')} · {scoreText(u.score, t)}
                                </span>
                            </span>
                            {tag && <span className="ka-tag">{tag}</span>}
                        </label>
                    );
                })}
                {options.length === 0 && <p className="ka-muted" style={{ margin: 0 }}>{t('adminDesk.noTailors')}</p>}
            </fieldset>
            {error && <p role="alert" className="ka-err">{error}</p>}
            <div className="ka-row-btn" style={{ gap: 8 }}>
                <button type="button" className="ka-btn ka-btn-primary" disabled={!choice || busy} onClick={() => void assign()}>
                    {busy && <Loader2 size={15} className="ka-spin" aria-hidden="true" />}
                    {busy ? t('adminDesk.saving') : choice ? t(changing ? 'adminDesk.reassignTo' : 'adminDesk.assignTo', { name: choice.name }) : t('adminDesk.assignTailor')}
                </button>
                {changing && (
                    <button type="button" className="ka-btn ka-btn-quiet" onClick={onCancel}>{t('adminCare.cancel')}</button>
                )}
            </div>
        </>
    );
}

function OfferForm({ order, onSent, onCancel }: { order: AdminOrder; onSent: () => void; onCancel?: () => void }) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const [requestId, setRequestId] = useState<number | null>(order.offer?.request_id ?? null);
    const [price, setPrice] = useState(order.offer ? String(order.offer.price) : '');
    const [days, setDays] = useState(order.offer?.days ? String(order.offer.days) : '');
    const [note, setNote] = useState(order.offer?.note ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const choose = (estimate: AdminEstimate) => {
        setRequestId(estimate.id);
        setPrice(estimate.price != null ? String(estimate.price) : '');
        setDays(estimate.days != null ? String(estimate.days) : '');
        setError('');
    };

    const valid = requestId !== null && Number(price) >= 1 && Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 120;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!valid) {
            setError(t('adminDesk.offerIncomplete'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api(`/api/admin/orders/${order.id}/offer`, 'POST', { request_id: requestId, price: Number(price), days: Number(days), note: note.trim() || null });
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminOffer.errorSend'));
                return;
            }
            toast(t('adminDesk.offerSentToast', { price: money(Number(price)) }));
            onSent();
        } catch {
            setError(t('adminDesk.networkError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="ka-form" onSubmit={(e) => void submit(e)}>
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <legend className="ka-lbl" style={{ padding: 0, marginBottom: 6 }}>{t('adminOffer.estimates')}</legend>
                {order.estimates.map((estimate) => {
                    const off = estimate.status !== 'pending' || busy;
                    const inOffer = order.offer?.request_id === estimate.id;
                    return (
                        <label key={estimate.id} className={`ka-opt${requestId === estimate.id ? ' is-on' : off ? ' is-off' : ''}`}>
                            <input type="radio" name={`ka-estimate-${order.id}`} checked={requestId === estimate.id} disabled={off} onChange={() => choose(estimate)} />
                            <span className="ka-av">{initials(estimate.tailor?.name ?? '?')}</span>
                            <span className="ka-opt-text">
                                <b>{estimate.tailor?.name ?? '—'}</b>
                                <span>
                                    {estimate.price != null ? money(estimate.price) : '—'}
                                    {estimate.days != null && ` · ${t('adminOffer.days', { count: estimate.days })}`}
                                    {estimate.tailor && ` · ${scoreText(estimate.tailor.score, t)}`}
                                </span>
                                {estimate.message && <span>“{estimate.message}”</span>}
                            </span>
                            {(inOffer || estimate.status !== 'pending') && (
                                <span className="ka-tag">{inOffer ? t('adminDesk.inOffer') : t(`adminDesk.estimate.${estimate.status}`)}</span>
                            )}
                        </label>
                    );
                })}
            </fieldset>
            <div className="ka-form-grid">
                <label>
                    <span className="ka-lbl">{t('adminOffer.price')}</span>
                    <input type="number" className="ka-field" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </label>
                <label>
                    <span className="ka-lbl">{t('adminOffer.daysLabel')}</span>
                    <input type="number" className="ka-field" min="1" max="120" step="1" value={days} onChange={(e) => setDays(e.target.value)} />
                </label>
            </div>
            <label className="ka-section" style={{ gap: 6 }}>
                <span className="ka-lbl">{t('adminOffer.note')}</span>
                <textarea className="ka-area" rows={2} maxLength={500} style={{ minHeight: 64 }} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            {error && <p role="alert" className="ka-err">{error}</p>}
            <div className="ka-row-btn" style={{ gap: 8 }}>
                <button type="submit" className="ka-btn ka-btn-primary" disabled={busy}>
                    {busy && <Loader2 size={15} className="ka-spin" aria-hidden="true" />}
                    {busy ? t('adminDesk.saving') : order.offer ? t('adminOffer.resend') : t('adminOffer.send')}
                </button>
                {onCancel && <button type="button" className="ka-btn ka-btn-quiet" onClick={onCancel}>{t('adminCare.cancel')}</button>}
            </div>
        </form>
    );
}

// ─── Customer, items, payment ────────────────────────────────────────────────

function CustomerBlock({
    order,
    orders,
    onCustomerOrders,
    onOpenPerson,
}: {
    order: AdminOrder;
    orders: AdminOrder[];
    onCustomerOrders: (customerId: number) => void;
    onOpenPerson: (userId: number) => void;
}) {
    const { t } = useTranslation();
    const customer = order.customer;
    if (!customer) return null;
    const count = orders.filter((o) => o.customer?.id === customer.id).length;

    return (
        <section aria-label={t('adminDesk.customer')} className="ka-section">
            <span className="ka-lbl">{t('adminDesk.customer')}</span>
            <b>{customer.name}</b>
            {customer.email && <a href={`mailto:${customer.email}`} className="ka-muted" style={{ textDecoration: 'none', overflowWrap: 'anywhere' }}>{customer.email}</a>}
            {customer.phone && <a href={`tel:${customer.phone}`} className="ka-muted" style={{ textDecoration: 'none' }}>{customer.phone}</a>}
            <button type="button" className="ka-link" style={{ marginTop: 2 }} onClick={() => (count > 1 ? onCustomerOrders(customer.id) : onOpenPerson(customer.id))}>
                {count > 1 ? t('adminDesk.allTheirOrders', { count }) : t('adminDesk.viewCustomer')}
            </button>
        </section>
    );
}

function ItemsBlock({ order }: { order: AdminOrder }) {
    const { t } = useTranslation();
    const data = order.custom_design_data ?? {};
    const text = (key: string) => (typeof data[key] === 'string' && (data[key] as string).trim() ? (data[key] as string) : null);
    const photos = Array.isArray(data.remodel_images) ? (data.remodel_images as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    const spec = order.order_type === 'custom' ? readSpec(data.customization) : [];
    const garment = order.order_type === 'custom' ? readProductName(data.customization) ?? text('garment_type') : null;
    const note = order.customer_note && order.customer_note !== 'N/A' ? order.customer_note : null;

    return (
        <section aria-label={t('adminDesk.items')} className="ka-section">
            <span className="ka-lbl">{order.order_type === 'remodel' ? t('adminDesk.request') : t('adminDesk.items')}</span>
            {order.items.map((item) => (
                <div key={item.id} className="ka-item">
                    <span>
                        <b>{item.product_name}</b>
                        <span>{money(item.price)}</span>
                    </span>
                    <span>×{item.quantity}</span>
                </div>
            ))}
            {garment && <div className="ka-item"><span><b>{garment}</b><span>{t('adminDesk.kind.custom')}</span></span></div>}
            {spec.length > 0 && <span className="ka-small">{spec.map((line) => `${line.attribute}: ${line.option}`).join(' · ')}</span>}
            {text('change_request') && <p className="ka-pre">{text('change_request')}</p>}
            {text('customization_request') && <p className="ka-pre">{text('customization_request')}</p>}
            {text('tailor_notes') && <p className="ka-pre ka-muted">{text('tailor_notes')}</p>}
            {text('design_file_url') && (
                <a href={text('design_file_url') ?? undefined} target="_blank" rel="noreferrer" className="ka-link">{t('adminDesk.designFile')}</a>
            )}
            <Photos photos={photos} label={t('adminDesk.garmentPhotos')} />
            {note && <span className="ka-small">{t('adminDesk.customerNote', { note })}</span>}
            {order.items.length === 0 && !garment && !text('change_request') && <span className="ka-muted">{t('adminDesk.noItems')}</span>}
        </section>
    );
}

function PaymentBlock({ order, onChanged }: { order: AdminOrder; onChanged: () => void }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const address = order.return_address;

    const rows: [string, string][] = [
        [t('adminDesk.payment.label'), t(`adminDesk.payment.${order.payment_status}`, { defaultValue: order.payment_status })],
        [t('adminDesk.totalLabel'), order.shipping > 0 ? t('adminDesk.totalWithDelivery', { total: money(order.total), delivery: money(order.shipping) }) : money(order.total)],
    ];
    if (order.paid_remodel && order.deposit_amount) rows.push([t('adminDesk.firstPayment'), money(order.deposit_amount)]);
    if (order.paid_total > 0) rows.push([t('adminDesk.paidLabel'), money(order.paid_total)]);
    if (order.refunded_total > 0) rows.push([t('adminDesk.refundedLabel'), money(order.refunded_total)]);
    if (order.expected_price) rows.push([t('adminDesk.budget'), money(order.expected_price)]);
    if (order.needed_by) rows.push([t('adminDesk.neededBy'), longDay(order.needed_by, t)]);
    if (order.due_date) rows.push([t('adminDesk.dueDate'), longDay(order.due_date, t)]);
    if (address) rows.push([t('adminDesk.returnAddress'), [address.name, address.phone, address.address, [address.city, address.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')]);
    rows.push([t('adminDesk.delivery'), t(`adminDesk.deliveryState.${order.delivered_at ? 'delivered' : order.shipped_at ? 'shipped' : order.status === 'cancelled' ? 'none' : 'notYet'}`)]);

    return (
        <section aria-label={t('adminDesk.deliveryPayment')} className="ka-section" style={{ gap: 12 }}>
            {refundDue(order) && <p className="ka-note-warn">{t('adminCare.refundDue')}</p>}
            {order.refunds.some((r) => r.status === 'failed') && <p className="ka-note-warn">{t('adminCare.refundHadFailure')}</p>}
            {!open ? (
                <button type="button" className="ka-link" aria-expanded="false" onClick={() => setOpen(true)}>
                    {t('adminDesk.showDeliveryPayment')}
                    <ChevronDown size={14} aria-hidden="true" />
                </button>
            ) : (
                <>
                    <span className="ka-lbl">{t('adminDesk.deliveryPayment')}</span>
                    <Facts rows={rows} />
                    <RefundForm order={order} onDone={onChanged} />
                    <button type="button" className="ka-link" aria-expanded="true" onClick={() => setOpen(false)}>
                        {t('adminDesk.hideDetails')}
                        <ChevronUp size={14} aria-hidden="true" />
                    </button>
                </>
            )}
        </section>
    );
}

function RefundForm({ order, onDone }: { order: AdminOrder; onDone: () => void }) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const refundable = Math.round((order.paid_total - order.refunded_total) * 100) / 100;
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(String(refundable));
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    if (refundable <= 0) return null;
    if (!open) {
        return (
            <button type="button" className="ka-link" onClick={() => { setAmount(String(refundable)); setOpen(true); }}>
                {t('adminCare.refundOpen')}
            </button>
        );
    }

    const value = Number(amount);
    const valid = value > 0 && value <= refundable;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!valid) {
            setError(t('adminCare.refundAmount', { max: money(refundable) }));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api<{ refunded?: number }>(`/api/admin/orders/${order.id}/refund`, 'POST', { amount: value, note: note.trim() || null });
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
            toast(t('adminDesk.refundedToast', { amount: money(value) }));
            onDone();
        } catch {
            setError(t('adminDesk.networkError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="ka-form" onSubmit={(e) => void submit(e)}>
            <label className="ka-section" style={{ gap: 6 }}>
                <span className="ka-lbl">{t('adminCare.refundAmount', { max: money(refundable) })}</span>
                <input type="number" className="ka-field" min="0.01" step="0.01" max={refundable} value={amount} aria-invalid={!!error && !valid ? true : undefined} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="ka-section" style={{ gap: 6 }}>
                <span className="ka-lbl">{t('adminCare.refundNote')}</span>
                <input type="text" className="ka-field" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            {error && <p role="alert" className="ka-err">{error}</p>}
            <div className="ka-row-btn" style={{ gap: 8 }}>
                <button type="submit" className="ka-btn ka-btn-sm ka-btn-primary" disabled={busy}>
                    {busy && <Loader2 size={15} className="ka-spin" aria-hidden="true" />}
                    {t('adminCare.refundSubmit')}
                </button>
                <button type="button" className="ka-btn ka-btn-sm ka-btn-quiet" disabled={busy} onClick={() => { setOpen(false); setError(''); }}>
                    {t('adminCare.cancel')}
                </button>
            </div>
        </form>
    );
}

// ─── Messages ────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: number;
    sender_id: number;
    sender_name: string;
    message: string;
    created_at: string;
}

const POLL_MS = 6000;
const MAX_MESSAGE = 2000;

function Conversation({ order, me, onSent }: { order: AdminOrder; me: number; onSent: () => void }) {
    const { t } = useTranslation();
    const [channel, setChannel] = useState<'customer' | 'tailor'>('customer');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const end = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        try {
            const { ok, data } = await api<{ messages?: ChatMessage[] }>(`/api/admin/orders/${order.id}/messages?channel=${channel}`);
            if (!ok) throw new Error();
            setMessages(data.messages ?? []);
            setFailed(false);
        } catch {
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, [order.id, channel]);

    useEffect(() => {
        setLoading(true);
        setMessages([]);
        void load();
        const timer = window.setInterval(() => void load(), POLL_MS);
        return () => window.clearInterval(timer);
    }, [load]);

    useEffect(() => {
        end.current?.scrollIntoView({ block: 'nearest' });
    }, [messages.length]);

    const who = (m: ChatMessage) =>
        m.sender_id === me ? t('adminDesk.you')
        : m.sender_id === order.customer?.id ? m.sender_name
        : m.sender_id === order.tailor?.id ? t('adminDesk.tailorWho', { name: m.sender_name })
        : 'Kere';
    const side = (m: ChatMessage) => (m.sender_id === order.customer?.id ? 'is-theirs' : m.sender_id === order.tailor?.id ? 'is-theirs is-tailor' : 'is-mine');
    const time = (iso: string) => {
        const d = new Date(iso);
        return `${formatTimestampDay(iso, t)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const send = async (event: FormEvent) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text) {
            setError(t('adminDesk.writeFirst'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api(`/api/admin/orders/${order.id}/messages`, 'POST', { channel, message: text });
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminDesk.notSent'));
                return;
            }
            setDraft('');
            await load();
            onSent();
        } catch {
            setError(t('adminDesk.notSent'));
        } finally {
            setBusy(false);
        }
    };

    const party = channel === 'customer' ? order.customer?.name ?? t('adminDesk.customer') : order.tailor?.name ?? t('adminDesk.theTailor');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%' }}>
            <div role="group" aria-label={t('adminDesk.conversation')} className="ka-views">
                {(['customer', 'tailor'] as const).map((c) => (
                    <button key={c} type="button" className="ka-view" aria-pressed={channel === c} disabled={c === 'tailor' && !order.tailor} onClick={() => setChannel(c)}>
                        {t(c === 'customer' ? 'adminDesk.withCustomer' : 'adminDesk.withTailor')}
                    </button>
                ))}
            </div>
            <span className="ka-muted" style={{ fontSize: 13 }}>{t('adminDesk.conversationWith', { name: party })}</span>
            <div role="log" aria-label={t('adminDesk.tabMessages')} aria-busy={loading} className="ka-msgs">
                {failed && <p role="alert" className="ka-err">{t('adminDesk.messagesFailed')}</p>}
                {messages.map((m) => (
                    <div key={m.id} className={`ka-msg ${side(m)}`}>
                        <span className="ka-msg-who"><b>{who(m)}</b> · {time(m.created_at)}</span>
                        <div className="ka-bubble">{m.message}</div>
                    </div>
                ))}
                {!loading && !failed && messages.length === 0 && (
                    <p className="ka-muted" style={{ margin: 0, padding: '32px 0', textAlign: 'center' }}>{t('adminDesk.noMessages')}</p>
                )}
                <div ref={end} />
            </div>
            <form className="ka-reply" onSubmit={(e) => void send(e)}>
                <label htmlFor="ka-msg" className="ka-sr">{t('adminDesk.replyTo', { name: party })}</label>
                <textarea
                    id="ka-msg"
                    className="ka-area"
                    rows={3}
                    maxLength={MAX_MESSAGE}
                    placeholder={t('adminDesk.writeReply')}
                    aria-describedby="ka-msg-hint"
                    aria-invalid={!!error || undefined}
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); setError(''); }}
                />
                <div className="ka-form-foot">
                    <span id="ka-msg-hint" className={error ? 'ka-err' : 'ka-hint'}>
                        {error || (draft.length ? `${draft.length} / ${MAX_MESSAGE}` : t(channel === 'customer' ? 'adminDesk.replyHintCustomer' : 'adminDesk.replyHintTailor'))}
                    </span>
                    <button type="submit" className="ka-btn ka-btn-sm ka-btn-primary" disabled={busy}>
                        {busy ? t('adminDesk.sending') : t('adminDesk.send')}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ─── Activity ────────────────────────────────────────────────────────────────

interface FeedEntry {
    day: string;
    seq: number;
    label?: string;
    note?: string;
    by?: string | null;
}

function Activity({ order, claims, onChanged }: { order: AdminOrder; claims: AdminClaim[]; onChanged: () => void }) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const entries: FeedEntry[] = [];
    let seq = 0;
    const add = (day: string | null | undefined, label: string, by?: string | null) => {
        if (day) entries.push({ day: day.slice(0, 10), seq: seq++, label, by });
    };
    add(order.created_at, t('adminDesk.event.placed'), order.customer?.name);
    if (order.offer) add(order.offer_sent_at, t('adminDesk.event.offer', { price: money(order.offer.price) }), 'Kere');
    add(order.deposit_paid_at, t('adminDesk.event.firstHalf'), order.customer?.name);
    add(order.paid_at, t('adminDesk.event.paid'), order.customer?.name);
    add(order.picked_up_at, t('adminDesk.event.pickedUp'), 'Kere');
    add(order.received_at, t('adminDesk.event.received', { tailor: order.tailor?.name ?? t('adminDesk.theTailor') }), order.tailor?.name);
    add(order.shipped_at, t('adminDesk.event.shipped'), 'Kere');
    add(order.delivered_at, t('adminDesk.event.delivered'), 'Kere');
    add(order.cancelled_at, t('adminDesk.event.cancelled'));
    order.refunds.forEach((r) => add(r.created_at, t(`adminDesk.event.refund.${r.status === 'failed' ? 'failed' : r.status === 'pending' ? 'pending' : 'done'}`, { amount: money(r.amount) }), 'Kere'));
    claims.forEach((c) => add(c.created_at, t(c.type === 'return' ? 'adminDesk.event.returnOpened' : 'adminDesk.event.problemOpened'), order.customer?.name));
    order.admin_notes.forEach((n) => entries.push({ day: n.created_at, seq: seq++, note: n.body, by: n.author }));
    entries.sort((a, b) => (a.day === b.day ? b.seq - a.seq : a.day < b.day ? 1 : -1));

    const addNote = async (event: FormEvent) => {
        event.preventDefault();
        const text = draft.trim();
        if (text.length < 3) {
            setError(t('adminDesk.noteTooShort'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api(`/api/admin/orders/${order.id}/notes`, 'POST', { body: text });
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminDesk.noteFailed'));
                return;
            }
            setDraft('');
            onChanged();
        } catch {
            setError(t('adminDesk.noteFailed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <form className="ka-form" style={{ gap: 8 }} onSubmit={(e) => void addNote(e)}>
                <label htmlFor="ka-note" className="ka-lbl">{t('adminDesk.addNote')}</label>
                <textarea
                    id="ka-note"
                    className="ka-area"
                    rows={2}
                    maxLength={500}
                    placeholder={t('adminDesk.notePlaceholder')}
                    aria-describedby="ka-note-hint"
                    aria-invalid={!!error || undefined}
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); setError(''); }}
                />
                <div className="ka-form-foot">
                    <span id="ka-note-hint" className={error ? 'ka-err' : 'ka-hint'}>
                        {error || (draft.length ? `${draft.length} / 500` : t('adminDesk.notesInternal'))}
                    </span>
                    <button type="submit" className="ka-btn ka-btn-sm" disabled={busy}>
                        {busy ? t('adminDesk.saving') : t('adminDesk.addNoteButton')}
                    </button>
                </div>
            </form>
            <ol className="ka-feed">
                {entries.map((entry) => (
                    <li key={`${entry.seq}`}>
                        <span aria-hidden="true" className="ka-feed-rail">
                            <i className={entry.note ? 'is-note' : undefined} />
                            <u />
                        </span>
                        <div className="ka-feed-body">
                            {entry.note ? <div className="ka-feed-note">{entry.note}</div> : <b>{entry.label}</b>}
                            <span className="ka-hint">{[entry.by, longDay(entry.day, t)].filter(Boolean).join(' · ')}</span>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}
