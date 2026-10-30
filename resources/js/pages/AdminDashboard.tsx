import { Banknote, Clock, LogOut, MessageCircle, Scissors, ShieldCheck, Star, TriangleAlert, Truck, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { OrderPanel, type OrderTab } from '../components/admin/OrderPanel';
import { OrdersSection, type Attention, type OrderPreset } from '../components/admin/OrdersSection';
import { ApplicationPanel, PeopleSection, PersonPanel } from '../components/admin/PeopleSection';
import { ReviewPanel, ReviewsSection } from '../components/admin/ReviewsSection';
import { DeskProvider } from '../components/admin/WorkspaceUi';
import {
    api,
    daysSince,
    markRead,
    money,
    refundDue,
    todayLine,
    unreadCounts,
    type AdminClaim,
    type AdminOrder,
    type AdminReview,
    type AdminUser,
    type PendingTailor,
} from '../components/admin/workspace';
import { NotificationBell } from '../components/NotificationBell';
import { clearAuth, getAuthToken, getAuthUser } from '../hooks/useAuth';
import { formatTimestampDay } from '../lib/dates';

/**
 * Kere's admin workspace: orders (with what needs attention first), people
 * (customers, tailors and applications) and reviews. Each record opens in a
 * side panel where its actions live.
 */

type Section = 'orders' | 'people' | 'reviews';

type Panel = { kind: 'order'; id: number; tab: OrderTab } | { kind: 'person' | 'app' | 'review'; id: number };

interface Loaded<T> {
    items: T[];
    loading: boolean;
    failed: boolean;
}

const fresh = <T,>(): Loaded<T> => ({ items: [], loading: true, failed: false });

function useAdminList<T>(url: string, key: string) {
    const [state, setState] = useState<Loaded<T>>(fresh<T>());

    const load = useCallback(async () => {
        try {
            const { ok, data } = await api<Record<string, T[]>>(url);
            if (!ok) throw new Error();
            setState({ items: (data[key] as T[] | undefined) ?? [], loading: false, failed: false });
        } catch {
            setState((s) => ({ ...s, loading: false, failed: true }));
        }
    }, [url, key]);

    const retry = useCallback(() => {
        setState((s) => ({ ...s, loading: true, failed: false }));
        void load();
    }, [load]);

    return { ...state, load, retry, setItems: (update: (items: T[]) => T[]) => setState((s) => ({ ...s, items: update(s.items) })) };
}

export default function AdminDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = getAuthUser();
    const token = getAuthToken();
    const isAdmin = !!token && user?.role === 'admin';

    const orders = useAdminList<AdminOrder>('/api/admin/orders', 'orders');
    const users = useAdminList<AdminUser>('/api/admin/users', 'users');
    const pending = useAdminList<PendingTailor>('/api/admin/tailors/pending', 'tailors');
    const claims = useAdminList<AdminClaim>('/api/admin/claims', 'claims');
    const reviews = useAdminList<AdminReview>('/api/admin/reviews', 'reviews');

    const [section, setSection] = useState<Section>('orders');
    const [panel, setPanel] = useState<Panel | null>(null);
    const [preset, setPreset] = useState<OrderPreset | null>(null);
    const [unread, setUnread] = useState<Record<number, number>>({});

    useEffect(() => {
        if (!isAdmin) navigate('/admin/login', { replace: true });
    }, [isAdmin, navigate]);

    const { load: loadOrders } = orders;
    const { load: loadUsers } = users;
    const { load: loadPending } = pending;
    const { load: loadClaims } = claims;
    const { load: loadReviews } = reviews;

    useEffect(() => {
        if (!isAdmin) return;
        void loadOrders();
        void loadUsers();
        void loadPending();
        void loadClaims();
        void loadReviews();
    }, [isAdmin, loadOrders, loadUsers, loadPending, loadClaims, loadReviews]);

    useEffect(() => {
        if (!orders.loading && !orders.failed) setUnread(unreadCounts(orders.items));
    }, [orders.items, orders.loading, orders.failed]);

    const orderList = orders.items;
    const openOrder = useCallback((id: number, tab: OrderTab = 'details') => setPanel({ kind: 'order', id, tab }), []);
    const showOrders = useCallback((next: Omit<OrderPreset, 'nonce'>) => {
        setPanel(null);
        setSection('orders');
        setPreset({ ...next, nonce: Date.now() });
    }, []);

    const panelOrder = panel?.kind === 'order' ? orderList.find((o) => o.id === panel.id) ?? null : null;
    const onRead = useCallback(() => {
        if (!panelOrder) return;
        markRead(panelOrder);
        setUnread(unreadCounts(orderList));
    }, [panelOrder, orderList]);

    const tailors = useMemo(() => users.items.filter((u) => u.role === 'tailor' && u.approval_status !== 'pending' && u.approval_status !== 'rejected'), [users.items]);
    const openClaims = useMemo(() => claims.items.filter((c) => c.status === 'open' && c.order), [claims.items]);
    const problemOrderIds = useMemo(() => new Set(openClaims.map((c) => c.order?.id ?? 0)), [openClaims]);
    const waitingReviews = reviews.items.filter((r) => r.status === 'pending').length;

    // ─── What needs attention, most pressing first ───────────────────────────
    const attention = useMemo<Attention[]>(() => {
        const items: Attention[] = [];
        const byId = new Map(orderList.map((o) => [o.id, o]));
        const who = (o?: AdminOrder | null) => o?.customer?.name ?? '';

        openClaims.forEach((c) => {
            const o = byId.get(c.order?.id ?? 0);
            items.push({
                key: `claim-${c.id}`,
                icon: TriangleAlert,
                tone: 'red',
                title: t('adminDesk.att.claim', { kind: t(c.type === 'return' ? 'orderCare.claimReturn' : 'orderCare.claimProblem'), order: c.order?.order_number }),
                meta: [who(o), t('adminDesk.openedOn', { date: formatTimestampDay(c.created_at, t) })].filter(Boolean).join(' · '),
                action: t('adminDesk.review'),
                onGo: () => openOrder(c.order?.id ?? 0),
            });
        });

        orderList.filter(refundDue).forEach((o) =>
            items.push({
                key: `refund-${o.id}`,
                icon: Banknote,
                tone: 'red',
                title: t('adminDesk.att.refund', { order: o.order_number }),
                meta: [who(o), t('adminDesk.att.refundMeta', { amount: money(o.paid_total - o.refunded_total) })].filter(Boolean).join(' · '),
                action: t('adminDesk.att.refundAction'),
                onGo: () => openOrder(o.id),
            }),
        );

        const waiting = orderList
            .filter((o) => o.status === 'pending_assignment' && !o.offer && (o.order_type === 'marketplace' || o.estimates.some((e) => e.status === 'pending')))
            .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
        waiting.slice(0, 3).forEach((o) => {
            const estimates = o.estimates.filter((e) => e.status === 'pending').length;
            items.push({
                key: `assign-${o.id}`,
                icon: Clock,
                tone: 'amber',
                title: o.order_type === 'marketplace' ? t('adminDesk.att.needsTailor', { order: o.order_number }) : t('adminDesk.att.estimatesIn', { order: o.order_number, count: estimates }),
                meta: [who(o), daysSince(o.created_at) ? t('adminDesk.att.waitingDays', { count: daysSince(o.created_at) }) : t('adminDesk.att.placedToday')].filter(Boolean).join(' · '),
                action: o.order_type === 'marketplace' ? t('adminDesk.att.assign') : t('adminDesk.att.makeOffer'),
                onGo: () => openOrder(o.id),
            });
        });
        if (waiting.length > 3) {
            items.push({
                key: 'assign-more',
                icon: Clock,
                tone: 'amber',
                title: t('adminDesk.att.moreWaiting', { count: waiting.length - 3 }),
                meta: t('adminDesk.att.oldestFirst'),
                action: t('adminDesk.view'),
                onGo: () => showOrders({ view: 'needs' }),
            });
        }

        orderList
            .filter((o) => o.next_courier_step)
            .forEach((o) =>
                items.push({
                    key: `courier-${o.id}`,
                    icon: Truck,
                    tone: 'amber',
                    title: t(`adminDesk.att.courier.${o.next_courier_step}`, { order: o.order_number }),
                    meta: [who(o), o.tailor?.name].filter(Boolean).join(' · '),
                    action: t('adminDesk.open'),
                    onGo: () => openOrder(o.id),
                }),
            );

        const unreadIds = Object.keys(unread).map(Number);
        const unreadTotal = unreadIds.reduce((n, id) => n + unread[id], 0);
        if (unreadTotal) {
            items.push({
                key: 'unread',
                icon: MessageCircle,
                tone: 'sand',
                title: t('adminDesk.att.unread', { count: unreadTotal }),
                meta: unreadIds.map((id) => byId.get(id)?.order_number).filter(Boolean).join(' · '),
                action: t('adminDesk.read'),
                onGo: () => (unreadIds.length === 1 ? openOrder(unreadIds[0], 'messages') : showOrders({ unread: true })),
            });
        }

        if (pending.items.length) {
            items.push({
                key: 'applications',
                icon: Users,
                tone: 'slate',
                title: t('adminDesk.att.applications', { count: pending.items.length }),
                meta: pending.items.map((a) => a.name).join(' · '),
                action: t('adminDesk.review'),
                onGo: () => { setPanel(null); setSection('people'); },
            });
        }

        if (waitingReviews) {
            items.push({
                key: 'reviews',
                icon: Star,
                tone: 'sand',
                title: t('adminDesk.att.reviews', { count: waitingReviews }),
                meta: t('adminDesk.att.reviewsMeta'),
                action: t('adminDesk.review'),
                onGo: () => { setPanel(null); setSection('reviews'); },
            });
        }

        return items;
    }, [orderList, openClaims, unread, pending.items, waitingReviews, openOrder, showOrders, t]);

    // ─── Summary line under the section names ────────────────────────────────
    const customersCount = users.items.filter((u) => u.role === 'customer').length;
    const tailorsCount = users.items.filter((u) => u.role === 'tailor' && u.approval_status !== 'pending').length;
    const ratings = reviews.items.map((r) => r.rating);
    const summary =
        section === 'orders'
            ? `${todayLine(t)} — ${attention.length ? t('adminDesk.summaryOrders', { count: attention.length }) : t('adminDesk.summaryClear')}`
            : section === 'people'
              ? [t('adminDesk.summaryPeople', { customers: t('adminDesk.customersCount', { count: customersCount }), tailors: t('adminDesk.tailorsCount', { count: tailorsCount }) }), pending.items.length ? t('adminDesk.appsWaiting', { count: pending.items.length }) : '']
                    .filter(Boolean)
                    .join(' · ') + '.'
              : ratings.length
                ? [
                      t('adminDesk.reviewsCount', { count: ratings.length }),
                      t('adminDesk.average', { average: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) }),
                      ratings.filter((r) => r <= 2).length ? t('adminDesk.lowRatings', { count: ratings.filter((r) => r <= 2).length }) : '',
                      waitingReviews ? t('adminDesk.reviewsWaiting', { count: waitingReviews }) : '',
                  ]
                      .filter(Boolean)
                      .join(' · ') + '.'
                : t('adminDesk.noReviewsYet');

    const dots: Record<Section, boolean> = {
        orders: attention.some((a) => a.key !== 'applications' && a.key !== 'reviews'),
        people: pending.items.length > 0,
        reviews: waitingReviews > 0,
    };

    if (!isAdmin) return null;

    const reloadOrderData = () => {
        void loadOrders();
        void loadClaims();
    };

    const panelPerson = panel?.kind === 'person' ? users.items.find((u) => u.id === panel.id) ?? null : null;
    const panelApp = panel?.kind === 'app' ? pending.items.find((a) => a.id === panel.id) ?? null : null;
    const panelReview = panel?.kind === 'review' ? reviews.items.find((r) => r.id === panel.id) ?? null : null;

    return (
        <DeskProvider>
            <div className="ka-scope ka-page">
                <Helmet>
                    <title>{t('adminDashboard.pageTitle')}</title>
                    <meta name="robots" content="noindex" />
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif&display=swap" />
                </Helmet>

                <header className="ka-header">
                    <div className="ka-wrap ka-header-bar">
                        <Link to="/" aria-label={t('adminDesk.homeLabel')} className="ka-brand">
                            <b>Kere</b>
                            <span>{t('adminDashboard.adminBadge').toUpperCase()}</span>
                        </Link>
                        <nav aria-label={t('adminDesk.accountNav')} className="ka-nav">
                            <Link to="/admin/customizer" className="ka-nav-a" aria-label={t('adminDashboard.designStudio')}>
                                <Scissors size={16} aria-hidden="true" />
                                <span className="ka-hide-sm">{t('adminDashboard.designStudio')}</span>
                            </Link>
                            <NotificationBell />
                            <span className="ka-nav-a ka-tip" tabIndex={0} style={{ color: '#90A1B9', cursor: 'default' }} data-tip={t('adminDesk.signedInAs', { name: user?.name ?? '' })} aria-label={t('adminDesk.signedInAs', { name: user?.name ?? '' })}>
                                <ShieldCheck size={16} aria-hidden="true" />
                            </span>
                            <button
                                type="button"
                                className="ka-nav-a"
                                onClick={() => {
                                    clearAuth();
                                    navigate('/');
                                }}
                            >
                                <LogOut size={16} aria-hidden="true" />
                                <span className="ka-hide-sm">{t('adminDashboard.signOut')}</span>
                            </button>
                        </nav>
                    </div>
                </header>

                <main className="ka-main">
                    <div className="ka-wrap">
                        <div role="tablist" aria-label={t('adminDesk.sectionsLabel')} className="ka-sections">
                            {(['orders', 'people', 'reviews'] as const).map((s) => (
                                <button key={s} type="button" role="tab" className="ka-sec" aria-selected={section === s} onClick={() => { setSection(s); setPanel(null); }}>
                                    {t(`adminDesk.sections.${s}`)}
                                    {dots[s] && section !== s && (
                                        <>
                                            <span className="ka-sr">{t('adminDesk.needsAttentionSr')}</span>
                                            <span aria-hidden="true" className="ka-sec-dot" />
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="ka-summary">{summary}</p>

                        {section === 'orders' && (
                            <OrdersSection
                                orders={orderList}
                                loading={orders.loading}
                                failed={orders.failed}
                                onRetry={orders.retry}
                                attention={attention}
                                unread={unread}
                                problemOrderIds={problemOrderIds}
                                tailors={tailors}
                                openOrderId={panelOrder?.id ?? null}
                                onOpenOrder={(id) => openOrder(id)}
                                preset={preset}
                            />
                        )}
                        {section === 'people' && (
                            <PeopleSection
                                users={users.items}
                                pending={pending.items}
                                orders={orderList}
                                loading={users.loading}
                                failed={users.failed}
                                onRetry={users.retry}
                                openId={panelPerson?.id ?? null}
                                onOpenPerson={(id) => setPanel({ kind: 'person', id })}
                                onOpenApplication={(id) => setPanel({ kind: 'app', id })}
                            />
                        )}
                        {section === 'reviews' && (
                            <ReviewsSection
                                reviews={reviews.items}
                                loading={reviews.loading}
                                failed={reviews.failed}
                                onRetry={reviews.retry}
                                openId={panelReview?.id ?? null}
                                onOpen={(id) => setPanel({ kind: 'review', id })}
                            />
                        )}
                    </div>
                </main>

                {panelOrder && panel?.kind === 'order' && (
                    <OrderPanel
                        key={panelOrder.id}
                        order={panelOrder}
                        claims={claims.items.filter((c) => c.order?.id === panelOrder.id)}
                        orders={orderList}
                        tailors={tailors}
                        me={user?.id ?? 0}
                        unread={unread[panelOrder.id] ?? 0}
                        initialTab={panel.tab}
                        onClose={() => setPanel(null)}
                        onChanged={reloadOrderData}
                        onRead={onRead}
                        onCustomerOrders={(customerId) => showOrders({ customerId })}
                        onOpenPerson={(id) => {
                            setSection('people');
                            setPanel({ kind: 'person', id });
                        }}
                    />
                )}
                {panelPerson && (
                    <PersonPanel
                        key={panelPerson.id}
                        user={panelPerson}
                        orders={orderList}
                        onClose={() => setPanel(null)}
                        onChanged={(updated) => users.setItems((list) => list.map((u) => (u.id === updated.id ? updated : u)))}
                        onOpenOrder={(id) => openOrder(id)}
                        onShowOrders={showOrders}
                    />
                )}
                {panelApp && (
                    <ApplicationPanel
                        key={panelApp.id}
                        application={panelApp}
                        onClose={() => setPanel(null)}
                        onDecided={() => {
                            setPanel(null);
                            void loadPending();
                            void loadUsers();
                        }}
                    />
                )}
                {panelReview && (
                    <ReviewPanel
                        key={panelReview.id}
                        review={panelReview}
                        problemOpen={!!panelReview.order && problemOrderIds.has(panelReview.order.id)}
                        onClose={() => setPanel(null)}
                        onChanged={(updated) => reviews.setItems((list) => list.map((r) => (r.id === updated.id ? updated : r)))}
                        onOpenOrder={(id) => openOrder(id)}
                    />
                )}
            </div>
        </DeskProvider>
    );
}
