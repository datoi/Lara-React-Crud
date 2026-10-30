import type { TFunction } from 'i18next';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderPreset } from './OrdersSection';
import { DeskStatusLabel, Facts, SidePanel, useDesk } from './WorkspaceUi';
import { ago, api, daysSince, deskStatus, initials, isActive, itemsText, longDay, scoreText, shortDay, type AdminOrder, type AdminUser, type PendingTailor } from './workspace';

/** Customers and tailors, and the tailors waiting for approval. */

type PeopleView = 'customers' | 'tailors';

const EXPERIENCE_BAND: Record<number, string> = { 0: 'under_1', 1: '1_3', 3: '3_5', 5: '5_10', 10: 'over_10' };

const lastOrderDay = (orders: AdminOrder[]) => orders.reduce((latest, o) => (o.created_at > latest ? o.created_at : latest), '');

export function PeopleSection({
    users,
    pending,
    orders,
    loading,
    failed,
    onRetry,
    openId,
    onOpenPerson,
    onOpenApplication,
}: {
    users: AdminUser[];
    pending: PendingTailor[];
    orders: AdminOrder[];
    loading: boolean;
    failed: boolean;
    onRetry: () => void;
    openId: number | null;
    onOpenPerson: (id: number) => void;
    onOpenApplication: (id: number) => void;
}) {
    const { t } = useTranslation();
    const [view, setView] = useState<PeopleView>('customers');
    const [q, setQ] = useState('');

    const inView = (u: AdminUser, v: PeopleView) => (v === 'customers' ? u.role === 'customer' : u.role === 'tailor' && u.approval_status !== 'pending');
    const needle = q.trim().toLowerCase();
    const list = users.filter((u) => inView(u, view) && (!needle || [u.name, u.email, u.phone].join(' ').toLowerCase().includes(needle)));
    const applications = [...pending].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

    return (
        <div className="ka-stack">
            {applications.length > 0 && (
                <section aria-labelledby="ka-apps-h" className="ka-block">
                    <h2 id="ka-apps-h">{t('adminDesk.waitingApproval')}</h2>
                    <div className="ka-card">
                        {applications.map((a) => (
                            <button key={a.id} type="button" className="ka-att" onClick={() => onOpenApplication(a.id)}>
                                <span className="ka-av" style={{ width: 34, height: 34 }}>{initials(a.name)}</span>
                                <span className="ka-att-text">
                                    <b>{t('adminDesk.wantsToJoin', { name: a.name })}</b>
                                    <span>{[a.workspace_address, experience(a, t), t('adminDesk.applied', { ago: ago(a.created_at, t) })].filter(Boolean).join(' · ')}</span>
                                </span>
                                <span className="ka-go">
                                    <span className="ka-go-label">{t('adminDesk.review')}</span>
                                    <ChevronRight size={15} aria-hidden="true" />
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <section aria-label={t('adminDesk.sections.people')} className="ka-list">
                <div className="ka-toolbar">
                    <div role="group" aria-label={t('adminDesk.show')} className="ka-views">
                        {(['customers', 'tailors'] as const).map((v) => (
                            <button key={v} type="button" className="ka-view" aria-pressed={view === v} onClick={() => setView(v)}>
                                {t(`adminDesk.people.${v}`)}
                                <span className="ka-n">{users.filter((u) => inView(u, v)).length}</span>
                            </button>
                        ))}
                    </div>
                    <div className="ka-search" style={{ flex: '0 1 300px', minWidth: 220 }}>
                        <label htmlFor="ka-pq" className="ka-sr">{t('adminDesk.searchPeople')}</label>
                        <Search size={16} aria-hidden="true" />
                        <input id="ka-pq" type="search" className="ka-field" placeholder={t('adminDesk.searchPeople')} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                </div>
                <div className="ka-card" style={{ ['--cols' as string]: 'minmax(170px, 1.3fr) minmax(190px, 1.6fr) minmax(130px, 1fr) 100px 16px' }}>
                    {failed ? (
                        <div className="ka-empty">
                            <b>{t('adminDesk.peopleFailed')}</b>
                            <button type="button" className="ka-btn ka-btn-sm" onClick={onRetry}>{t('adminDesk.retry')}</button>
                        </div>
                    ) : (
                        <>
                            <div className="ka-th">
                                <span>{t('adminDesk.colName')}</span>
                                <span>{t(view === 'customers' ? 'adminDesk.colEmail' : 'adminDesk.colPhone')}</span>
                                <span>{t('adminDesk.colOrders')}</span>
                                <span>{t('adminDesk.colLastOrder')}</span>
                                <span />
                            </div>
                            <div role="list" aria-label={t(`adminDesk.people.${view}`)} aria-busy={loading}>
                                {loading
                                    ? [1, 2, 3].map((k) => (
                                          <div key={k} role="listitem" className="ka-row" style={{ cursor: 'default' }}>
                                              <span className="ka-skel ka-ca" style={{ width: 120 }} />
                                              <span className="ka-skel ka-cc" style={{ width: 160 }} />
                                              <span className="ka-skel ka-cb" style={{ width: 70 }} />
                                              <span className="ka-skel ka-cd" style={{ width: 48 }} />
                                              <span />
                                          </div>
                                      ))
                                    : list.map((u) => {
                                          const theirs = orders.filter((o) => (u.role === 'customer' ? o.customer?.id === u.id : o.tailor?.id === u.id));
                                          const active = theirs.filter((o) => isActive(o) && o.status !== 'pending_assignment').length;
                                          const last = lastOrderDay(theirs);
                                          return (
                                              <div key={u.id} role="listitem">
                                                  <button type="button" className={`ka-row${openId === u.id ? ' is-open' : ''}`} onClick={() => onOpenPerson(u.id)}>
                                                      <span className="ka-ca" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                          <span className="ka-av ka-hide-sm">{initials(u.name)}</span>
                                                          <span className="ka-cut" style={{ fontWeight: 500, color: 'var(--ka-ink)' }}>{u.name}</span>
                                                          {u.is_suspended && <span className="ka-tag ka-tag-warn">{t('adminDesk.suspended')}</span>}
                                                          {u.approval_status === 'rejected' && <span className="ka-tag">{t('adminDesk.rejected')}</span>}
                                                          {u.guardian_consent_pending && <span className="ka-tag">{t('adminDashboard.awaitingGuardian')}</span>}
                                                      </span>
                                                      <span className="ka-cc ka-cut" style={{ color: 'var(--ka-text-2)' }}>{(view === 'customers' ? u.email ?? u.phone : u.phone ?? u.email) ?? '—'}</span>
                                                      <span className="ka-cb ka-cut">
                                                          {u.role === 'customer'
                                                              ? t('adminDesk.ordersCount', { count: theirs.length })
                                                              : `${active ? t('adminDesk.activeOrders', { count: active }) : t('adminDesk.noActiveOrders')} · ${scoreText(u.score, t)}`}
                                                      </span>
                                                      <span className="ka-cd" style={{ color: 'var(--ka-text-2)', whiteSpace: 'nowrap' }}>{last ? shortDay(last, t) : '—'}</span>
                                                      <ChevronRight size={16} aria-hidden="true" className="ka-chev" />
                                                  </button>
                                              </div>
                                          );
                                      })}
                            </div>
                            {!loading && list.length === 0 && (
                                <div className="ka-empty">
                                    <span>{needle ? t('adminDesk.noOneMatches', { q: q.trim() }) : t(`adminDesk.people.empty.${view}`)}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

function experience(a: PendingTailor, t: TFunction): string {
    if (a.years_experience === null) return '';
    const band = EXPERIENCE_BAND[a.years_experience];
    return band ? t(`register.experience_band_${band}`) : t('adminDesk.years', { count: a.years_experience });
}

// ─── Panels ──────────────────────────────────────────────────────────────────

export function PersonPanel({
    user,
    orders,
    onClose,
    onChanged,
    onOpenOrder,
    onShowOrders,
}: {
    user: AdminUser;
    orders: AdminOrder[];
    onClose: () => void;
    onChanged: (user: AdminUser) => void;
    onOpenOrder: (id: number) => void;
    onShowOrders: (preset: Omit<OrderPreset, 'nonce'>) => void;
}) {
    const { t } = useTranslation();
    const { toast, confirm } = useDesk();
    const isCustomer = user.role === 'customer';
    const theirs = orders.filter((o) => (isCustomer ? o.customer?.id === user.id : o.tailor?.id === user.id)).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const active = theirs.filter((o) => isActive(o) && o.status !== 'pending_assignment').length;
    const delivered = theirs.filter((o) => o.status === 'delivered').length;

    const toggle = async (): Promise<string | null> => {
        const { ok, data } = await api<{ is_suspended?: boolean }>(`/api/admin/users/${user.id}/suspend`, 'PATCH');
        if (!ok) return t('adminDesk.saveFailed');
        onChanged({ ...user, is_suspended: !!data.is_suspended });
        return null;
    };

    const suspend = () =>
        confirm({
            title: t('adminDesk.suspendTitle', { name: user.name }),
            body: t(isCustomer ? 'adminDesk.suspendBodyCustomer' : 'adminDesk.suspendBodyTailor'),
            label: t('adminDesk.suspendButton'),
            danger: true,
            run: async () => {
                const failure = await toggle();
                if (!failure) toast(t('adminDesk.suspendedToast', { name: user.name }), { label: t('adminDesk.undo'), run: () => void toggleBack() });
                return failure;
            },
        });

    // Undo restores the account the toast was about, whatever the panel shows now.
    const toggleBack = async () => {
        try {
            const { ok, data } = await api<{ is_suspended?: boolean }>(`/api/admin/users/${user.id}/suspend`, 'PATCH');
            if (!ok) throw new Error();
            onChanged({ ...user, is_suspended: !!data.is_suspended });
            toast(t('adminDesk.reactivatedToast', { name: user.name }));
        } catch {
            toast(t('adminDesk.saveFailed'));
        }
    };

    const reactivate = async () => {
        try {
            const failure = await toggle();
            toast(failure ?? t('adminDesk.reactivatedToast', { name: user.name }));
        } catch {
            toast(t('adminDesk.networkError'));
        }
    };

    const facts: [string, string][] = [];
    if (user.email) facts.push([t('adminDesk.colEmail'), user.email]);
    if (user.phone) facts.push([t('adminDesk.colPhone'), user.phone]);
    facts.push([t('adminDesk.joined'), longDay(user.created_at, t)]);
    facts.push([
        t('adminDesk.colOrders'),
        isCustomer ? t('adminDesk.ordersCount', { count: theirs.length }) : `${t('adminDesk.activeOrders', { count: active })} · ${t('adminDesk.deliveredCount', { count: delivered })}`,
    ]);
    if (!isCustomer) facts.push([t('adminDesk.score'), scoreText(user.score, t)]);
    if (user.approval_status === 'rejected') facts.push([t('adminDesk.approval'), t('adminDesk.rejected')]);
    if (user.guardian_consent_pending) facts.push([t('adminDesk.guardian'), t('adminDashboard.awaitingGuardian')]);

    return (
        <SidePanel
            kicker={t(isCustomer ? 'adminDesk.customer' : 'adminDesk.tailor')}
            title={user.name}
            serif
            status={user.is_suspended ? { dot: '#8A2433', label: t('adminDesk.suspended') } : null}
            meta={<span>{(isCustomer ? user.email ?? user.phone : user.phone ?? user.email) ?? ''}</span>}
            menu={user.role === 'admin' ? [] : [user.is_suspended ? { label: t('adminDesk.reactivate'), onSelect: () => void reactivate() } : { label: t('adminDesk.suspendMenu'), danger: true, onSelect: suspend }]}
            onClose={onClose}
        >
            <div className="ka-col">
                <Facts rows={facts} />
                <section aria-label={t(isCustomer ? 'adminDesk.colOrders' : 'adminDesk.assignedOrders')} className="ka-section" style={{ gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <span className="ka-lbl">{t(isCustomer ? 'adminDesk.colOrders' : 'adminDesk.assignedOrders')}</span>
                        {theirs.length > 0 && (
                            <button type="button" className="ka-link" style={{ fontSize: 13 }} onClick={() => onShowOrders(isCustomer ? { customerId: user.id } : { tailorId: user.id })}>
                                {t('adminDesk.showInList')}
                            </button>
                        )}
                    </div>
                    {theirs.map((o) => (
                        <button key={o.id} type="button" className="ka-att" style={{ padding: '12px 0', borderTop: '1px solid var(--ka-line)' }} onClick={() => onOpenOrder(o.id)}>
                            <span className="ka-att-text">
                                <b style={{ fontSize: 14 }}>{o.order_number}</b>
                                <span>{shortDay(o.created_at, t)} · {itemsText(o, t)}</span>
                            </span>
                            <span style={{ fontSize: 13 }}><DeskStatusLabel status={deskStatus(o)} /></span>
                        </button>
                    ))}
                    {theirs.length === 0 && <span className="ka-muted">{t('adminDesk.noOrdersYet')}</span>}
                </section>
            </div>
        </SidePanel>
    );
}

export function ApplicationPanel({ application, onClose, onDecided }: { application: PendingTailor; onClose: () => void; onDecided: () => void }) {
    const { t } = useTranslation();
    const { toast, confirm } = useDesk();
    const a = application;

    const approve = () =>
        confirm({
            title: t('adminDesk.approveTitle', { name: a.name }),
            body: t('adminDesk.approveBody'),
            label: t('adminDesk.approveButton'),
            run: async () => {
                const { ok } = await api(`/api/admin/tailors/${a.id}/approve`, 'POST');
                if (!ok) return t('adminDesk.saveFailed');
                toast(t('adminDesk.approvedToast', { name: a.name }));
                onDecided();
                return null;
            },
        });

    const decline = () =>
        confirm({
            title: t('adminDesk.declineTitle', { name: a.name }),
            body: t('adminDesk.declineBody'),
            label: t('adminDesk.declineButton'),
            danger: true,
            reason: { label: t('adminDesk.declineReason'), minLength: 5 },
            run: async (reason) => {
                const { ok } = await api(`/api/admin/tailors/${a.id}/reject`, 'POST', { reason });
                if (!ok) return t('adminDesk.saveFailed');
                toast(t('adminDesk.declinedToast'));
                onDecided();
                return null;
            },
        });

    const facts: [string, string][] = [];
    if (a.phone) facts.push([t('adminDesk.colPhone'), a.phone]);
    if (a.email) facts.push([t('adminDesk.colEmail'), a.email]);
    if (a.business_type) facts.push([t('adminDesk.business'), t(`register.business_type_${a.business_type}`)]);
    if (a.workspace_address) facts.push([t('adminDesk.worksFrom'), a.workspace_address]);
    if (a.years_experience !== null) facts.push([t('adminDesk.experience'), experience(a, t)]);
    if (a.legal_status) facts.push([t('adminDesk.legalStatus'), t(`register.legal_status_${a.legal_status}`)]);
    if (a.does_remodeling !== null) facts.push([t('adminDesk.remodels'), t(a.does_remodeling ? 'adminDesk.yes' : 'adminDesk.no')]);

    return (
        <SidePanel
            kicker={t('adminDesk.application')}
            title={a.name}
            serif
            meta={<span>{t('adminDesk.appliedOn', { date: longDay(a.created_at, t), count: daysSince(a.created_at) })}</span>}
            footer={
                <>
                    <button type="button" className="ka-btn" onClick={decline}>{t('adminDesk.declineMenu')}</button>
                    <button type="button" className="ka-btn ka-btn-primary" onClick={approve}>{t('adminDesk.approveButton')}</button>
                </>
            }
            onClose={onClose}
        >
            <Facts rows={facts} />
        </SidePanel>
    );
}
