import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ChevronUp, Download, ListFilter, Search, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeskStatusLabel, Popover, useDesk } from './WorkspaceUi';
import {
    DESK_STATUSES,
    STATUS_DOT,
    deskStatus,
    inView,
    isActive,
    itemsText,
    ordersCsv,
    shortDay,
    type AdminOrder,
    type AdminUser,
    type DeskStatus,
    type OrderView,
} from './workspace';

/** Something waiting on Kere, shown above the order list. */
export interface Attention {
    key: string;
    icon: LucideIcon;
    tone: 'amber' | 'red' | 'sand' | 'slate';
    title: string;
    meta: string;
    action: string;
    onGo: () => void;
}

const TONES: Record<Attention['tone'], { background: string; color: string }> = {
    amber: { background: '#F7EBD5', color: '#8A5A12' },
    red: { background: '#F8E6E3', color: '#8A2433' },
    sand: { background: '#EFE6D6', color: '#5A4E40' },
    slate: { background: '#E8EDF2', color: '#44546A' },
};

/** Narrows the list from elsewhere, e.g. "See all of their orders" in a person's panel. */
export interface OrderPreset {
    nonce: number;
    customerId?: number;
    tailorId?: number;
    unread?: boolean;
    view?: OrderView;
}

type SortKey = 'number' | 'customer' | 'status' | 'tailor' | 'date';

const VIEWS: OrderView[] = ['all', 'needs', 'active', 'completed'];
const PAGE = 25;

export function OrdersSection({
    orders,
    loading,
    failed,
    onRetry,
    attention,
    unread,
    problemOrderIds,
    tailors,
    openOrderId,
    onOpenOrder,
    preset,
}: {
    orders: AdminOrder[];
    loading: boolean;
    failed: boolean;
    onRetry: () => void;
    attention: Attention[];
    unread: Record<number, number>;
    problemOrderIds: Set<number>;
    tailors: AdminUser[];
    openOrderId: number | null;
    onOpenOrder: (id: number) => void;
    preset: OrderPreset | null;
}) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const [attAll, setAttAll] = useState(false);
    const [q, setQ] = useState('');
    const [view, setView] = useState<OrderView>('all');
    const [fStatus, setFStatus] = useState<DeskStatus[]>([]);
    const [fTailor, setFTailor] = useState('all');
    const [fFrom, setFFrom] = useState('');
    const [fTo, setFTo] = useState('');
    const [fUnread, setFUnread] = useState(false);
    const [fProblem, setFProblem] = useState(false);
    const [fCustomer, setFCustomer] = useState<number | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [limit, setLimit] = useState(PAGE);

    useEffect(() => {
        if (!preset) return;
        setQ('');
        setFStatus([]);
        setFFrom('');
        setFTo('');
        setFProblem(false);
        setView(preset.view ?? 'all');
        setFCustomer(preset.customerId ?? null);
        setFTailor(preset.tailorId ? String(preset.tailorId) : 'all');
        setFUnread(!!preset.unread);
        setLimit(PAGE);
    }, [preset]);

    const reset = () => setLimit(PAGE);

    const clearFilters = () => {
        setFStatus([]);
        setFTailor('all');
        setFFrom('');
        setFTo('');
        setFUnread(false);
        setFProblem(false);
        setFCustomer(null);
        reset();
    };

    const badDates = !!(fFrom && fTo && fFrom > fTo);

    const matches = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return orders.filter((o) => {
            if (needle) {
                const hay = [o.order_number, o.customer?.name, o.customer?.email, o.customer?.phone, itemsText(o, t), o.tailor?.name].join(' ').toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            if (fStatus.length && !fStatus.includes(deskStatus(o))) return false;
            if (fTailor === 'none' ? !!o.tailor : fTailor !== 'all' && String(o.tailor?.id) !== fTailor) return false;
            if (!badDates && fFrom && o.created_at < fFrom) return false;
            if (!badDates && fTo && o.created_at > fTo) return false;
            if (fUnread && !unread[o.id]) return false;
            if (fProblem && !problemOrderIds.has(o.id)) return false;
            if (fCustomer && o.customer?.id !== fCustomer) return false;
            return true;
        });
    }, [orders, q, fStatus, fTailor, fFrom, fTo, badDates, fUnread, fProblem, fCustomer, unread, problemOrderIds, t]);

    const list = useMemo(() => {
        const rank = (o: AdminOrder) => DESK_STATUSES.indexOf(deskStatus(o));
        const key = (o: AdminOrder): string | number =>
            sortKey === 'number' ? o.order_number
            : sortKey === 'customer' ? (o.customer?.name ?? '')
            : sortKey === 'status' ? rank(o)
            : sortKey === 'tailor' ? (o.tailor?.name ?? '~')
            : o.created_at;
        const dir = sortDir === 'asc' ? 1 : -1;
        return matches
            .filter((o) => inView(o, view))
            .sort((a, b) => {
                const x = key(a);
                const y = key(b);
                const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
                return r === 0 ? b.id - a.id : r * dir;
            });
    }, [matches, view, sortKey, sortDir]);

    const shown = list.slice(0, limit);
    const customerName = fCustomer ? orders.find((o) => o.customer?.id === fCustomer)?.customer?.name ?? '—' : '';
    const tailorName = fTailor !== 'all' && fTailor !== 'none' ? tailors.find((u) => String(u.id) === fTailor)?.name ?? '—' : '';

    const chips: { label: string; clear: () => void }[] = [
        ...fStatus.map((s) => ({ label: t(`adminDesk.status.${s}`), clear: () => setFStatus((all) => all.filter((x) => x !== s)) })),
        ...(fTailor === 'none' ? [{ label: t('adminDesk.noTailorYet'), clear: () => setFTailor('all') }] : []),
        ...(tailorName ? [{ label: t('adminDesk.chipTailor', { name: tailorName }), clear: () => setFTailor('all') }] : []),
        ...(fFrom || fTo
            ? [{ label: `${fFrom ? shortDay(fFrom, t) : t('adminDesk.anyDate')} – ${fTo ? shortDay(fTo, t) : t('adminDesk.today')}`, clear: () => { setFFrom(''); setFTo(''); } }]
            : []),
        ...(fUnread ? [{ label: t('adminDesk.chipUnread'), clear: () => setFUnread(false) }] : []),
        ...(fProblem ? [{ label: t('adminDesk.chipProblem'), clear: () => setFProblem(false) }] : []),
        ...(fCustomer ? [{ label: t('adminDesk.chipCustomer', { name: customerName }), clear: () => setFCustomer(null) }] : []),
    ];
    const popCount = fStatus.length + (fTailor !== 'all' ? 1 : 0) + (fFrom || fTo ? 1 : 0) + (fUnread ? 1 : 0) + (fProblem ? 1 : 0);
    const searching = !!q.trim() || chips.length > 0;

    const sortBy = (k: SortKey) => {
        setSortDir((dir) => (sortKey === k ? (dir === 'asc' ? 'desc' : 'asc') : k === 'date' ? 'desc' : 'asc'));
        setSortKey(k);
    };

    const exportCsv = () => {
        const name = `kere-orders-${new Date().toISOString().slice(0, 10)}.csv`;
        try {
            const url = URL.createObjectURL(new Blob(['﻿' + ordersCsv(list, t)], { type: 'text/csv;charset=utf-8' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 5000);
            toast(t('adminDesk.downloading', { name }));
        } catch {
            toast(t('adminDesk.exportFailed'));
        }
    };

    const shownAttention = attAll ? attention : attention.slice(0, 3);

    const sortButton = (k: SortKey, label: string) => (
        <button type="button" className="ka-sort" onClick={() => sortBy(k)}>
            {label}
            {sortKey === k && (
                <>
                    {sortDir === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />}
                    <span className="ka-sr">{t(sortDir === 'asc' ? 'adminDesk.sortedAsc' : 'adminDesk.sortedDesc')}</span>
                </>
            )}
        </button>
    );

    const emptyKey = searching ? 'match' : view;

    return (
        <div className="ka-stack">
            {attention.length > 0 && (
                <section aria-labelledby="ka-att-h" className="ka-block">
                    <h2 id="ka-att-h">{t('adminDesk.attentionTitle')}</h2>
                    <div className="ka-card">
                        {shownAttention.map((item) => (
                            <button key={item.key} type="button" className="ka-att" onClick={item.onGo}>
                                <span aria-hidden="true" className="ka-att-icon" style={TONES[item.tone]}>
                                    <item.icon size={16} />
                                </span>
                                <span className="ka-att-text">
                                    <b>{item.title}</b>
                                    <span>{item.meta}</span>
                                </span>
                                <span className="ka-go">
                                    <span className="ka-go-label">{item.action}</span>
                                    <ChevronRight size={15} aria-hidden="true" />
                                </span>
                            </button>
                        ))}
                        {attention.length > 3 && (
                            <button type="button" className="ka-att ka-att-more" aria-expanded={attAll} onClick={() => setAttAll((v) => !v)}>
                                {attAll ? t('adminDesk.showLess') : t('adminDesk.showMore', { count: attention.length - 3 })}
                                {attAll ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                            </button>
                        )}
                    </div>
                </section>
            )}

            <section aria-label={t('adminDesk.allOrders')} className="ka-list">
                <div className="ka-toolbar">
                    <div role="group" aria-label={t('adminDesk.show')} className="ka-views">
                        {VIEWS.map((v) => (
                            <button key={v} type="button" className="ka-view" aria-pressed={view === v} onClick={() => { setView(v); reset(); }}>
                                {t(`adminDesk.views.${v}`)}
                                <span className="ka-n">{matches.filter((o) => inView(o, v)).length}</span>
                            </button>
                        ))}
                    </div>
                    <div className="ka-tools">
                        <div className="ka-search">
                            <label htmlFor="ka-q" className="ka-sr">{t('adminDesk.searchOrders')}</label>
                            <Search size={16} aria-hidden="true" />
                            <input
                                id="ka-q"
                                type="search"
                                className="ka-field"
                                placeholder={t('adminDesk.searchOrders')}
                                autoComplete="off"
                                value={q}
                                onChange={(e) => { setQ(e.target.value); reset(); }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape' && q) {
                                        e.preventDefault();
                                        setQ('');
                                    }
                                }}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button type="button" className="ka-btn ka-btn-sm" style={{ height: 38 }} aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen((o) => !o)}>
                                <ListFilter size={15} aria-hidden="true" />
                                {t('adminDesk.filter')}
                                {popCount > 0 && <span className="ka-badge">{popCount}</span>}
                            </button>
                            <Popover open={filterOpen} onClose={() => setFilterOpen(false)} label={t('adminDesk.filterOrders')} className="ka-filter">
                                <fieldset>
                                    <legend className="ka-lbl">{t('adminDesk.statusLabel')}</legend>
                                    {DESK_STATUSES.map((s) => (
                                        <label key={s} className="ka-check">
                                            <input
                                                type="checkbox"
                                                checked={fStatus.includes(s)}
                                                onChange={() => { setFStatus((all) => (all.includes(s) ? all.filter((x) => x !== s) : [...all, s])); reset(); }}
                                            />
                                            <span aria-hidden="true" className="ka-dot" style={{ background: STATUS_DOT[s] }} />
                                            {t(`adminDesk.status.${s}`)}
                                        </label>
                                    ))}
                                </fieldset>
                                <div className="ka-section" style={{ gap: 6 }}>
                                    <label htmlFor="ka-ft" className="ka-lbl">{t('adminDesk.tailorLabel')}</label>
                                    <div className="ka-sel-wrap">
                                        <select id="ka-ft" className="ka-field ka-sel" value={fTailor} onChange={(e) => { setFTailor(e.target.value); reset(); }}>
                                            <option value="all">{t('adminDesk.anyTailor')}</option>
                                            <option value="none">{t('adminDesk.noTailorYet')}</option>
                                            {tailors.map((u) => (
                                                <option key={u.id} value={String(u.id)}>{u.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} aria-hidden="true" />
                                    </div>
                                </div>
                                <div role="group" aria-labelledby="ka-fd" className="ka-section" style={{ gap: 6 }}>
                                    <span id="ka-fd" className="ka-lbl">{t('adminDesk.placedBetween')}</span>
                                    <div className="ka-dates">
                                        <input type="date" className="ka-field" aria-label={t('adminDesk.from')} max={fTo || undefined} value={fFrom} onChange={(e) => { setFFrom(e.target.value); reset(); }} />
                                        <span aria-hidden="true" style={{ color: 'var(--ka-text-3)' }}>–</span>
                                        <input type="date" className="ka-field" aria-label={t('adminDesk.to')} min={fFrom || undefined} value={fTo} onChange={(e) => { setFTo(e.target.value); reset(); }} />
                                    </div>
                                    {badDates && <p role="alert" className="ka-err">{t('adminDesk.datesBackwards')}</p>}
                                </div>
                                <div className="ka-section" style={{ gap: 2 }}>
                                    <label className="ka-check">
                                        <input type="checkbox" checked={fUnread} onChange={() => { setFUnread((v) => !v); reset(); }} />
                                        {t('adminDesk.hasUnread')}
                                    </label>
                                    <label className="ka-check">
                                        <input type="checkbox" checked={fProblem} onChange={() => { setFProblem((v) => !v); reset(); }} />
                                        {t('adminDesk.hasProblem')}
                                    </label>
                                </div>
                                <div className="ka-filter-foot">
                                    <button type="button" className="ka-link" onClick={clearFilters}>{t('adminDesk.clearAll')}</button>
                                    <button type="button" className="ka-btn ka-btn-sm ka-btn-primary" onClick={() => setFilterOpen(false)}>
                                        {t('adminDesk.showOrders', { count: list.length })}
                                    </button>
                                </div>
                            </Popover>
                        </div>
                    </div>
                </div>

                {chips.length > 0 && (
                    <div className="ka-chips">
                        {chips.map((chip) => (
                            <button key={chip.label} type="button" className="ka-tag ka-chip" aria-label={t('adminDesk.removeFilter', { label: chip.label })} onClick={() => { chip.clear(); reset(); }}>
                                {chip.label}
                                <X size={13} aria-hidden="true" />
                            </button>
                        ))}
                        <button type="button" className="ka-link" style={{ fontSize: 12.5, marginLeft: 4 }} onClick={clearFilters}>{t('adminDesk.clearFilters')}</button>
                    </div>
                )}

                <div className="ka-card" style={{ ['--cols' as string]: 'minmax(128px, 1fr) minmax(150px, 1.5fr) minmax(150px, 1.25fr) minmax(110px, 1fr) 84px 16px' }}>
                    {failed ? (
                        <div className="ka-empty">
                            <b>{t('adminDesk.ordersFailed')}</b>
                            <button type="button" className="ka-btn ka-btn-sm" onClick={onRetry}>{t('adminDesk.retry')}</button>
                        </div>
                    ) : (
                        <>
                            <div className="ka-th" role="group" aria-label={t('adminDesk.sortOrders')}>
                                {sortButton('number', t('adminDesk.colOrder'))}
                                {sortButton('customer', t('adminDesk.colCustomer'))}
                                {sortButton('status', t('adminDesk.colStatus'))}
                                {sortButton('tailor', t('adminDesk.colTailor'))}
                                {sortButton('date', t('adminDesk.colPlaced'))}
                                <span />
                            </div>
                            <div role="list" aria-label={t('adminDesk.allOrders')} aria-busy={loading}>
                                {loading
                                    ? [1, 2, 3, 4].map((k) => (
                                          <div key={k} role="listitem" className="ka-row" style={{ cursor: 'default' }}>
                                              <span className="ka-skel ka-ca" style={{ width: 104 }} />
                                              <span className="ka-skel ka-cc" style={{ width: 140 }} />
                                              <span className="ka-skel ka-cb" style={{ width: 110 }} />
                                              <span className="ka-skel ka-cx" style={{ width: 80 }} />
                                              <span className="ka-skel ka-cd" style={{ width: 48 }} />
                                              <span />
                                          </div>
                                      ))
                                    : shown.map((o) => (
                                          <div key={o.id} role="listitem">
                                              <button type="button" className={`ka-row${openOrderId === o.id ? ' is-open' : ''}`} onClick={() => onOpenOrder(o.id)}>
                                                  <span className="ka-ca" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0, fontWeight: 500, color: 'var(--ka-ink)', letterSpacing: '0.01em' }}>
                                                      <span className="ka-cut">{o.order_number}</span>
                                                      {!!unread[o.id] && (
                                                          <>
                                                              <span className="ka-sr">{t('adminDesk.newMessagesSr')}</span>
                                                              <span aria-hidden="true" className="ka-unread" />
                                                          </>
                                                      )}
                                                      {problemOrderIds.has(o.id) && (
                                                          <>
                                                              <span className="ka-sr">{t('adminDesk.openProblemSr')}</span>
                                                              <TriangleAlert size={14} aria-hidden="true" style={{ color: '#8A2433', flex: 'none' }} />
                                                          </>
                                                      )}
                                                  </span>
                                                  <span className="ka-cc ka-cut">{o.customer?.name ?? '—'}</span>
                                                  <span className="ka-cb" style={{ minWidth: 0 }}>
                                                      <DeskStatusLabel status={deskStatus(o)} />
                                                  </span>
                                                  <span
                                                      className="ka-cx ka-cut"
                                                      style={o.tailor ? undefined : { color: isActive(o) ? '#8A5A12' : 'var(--ka-text-3)' }}
                                                  >
                                                      {o.tailor?.name ?? (isActive(o) ? t('adminDesk.notAssigned') : '—')}
                                                  </span>
                                                  <span className="ka-cd" style={{ color: 'var(--ka-text-2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                                      {shortDay(o.created_at, t)}
                                                  </span>
                                                  <ChevronRight size={16} aria-hidden="true" className="ka-chev" />
                                              </button>
                                          </div>
                                      ))}
                            </div>
                            {!loading && list.length === 0 && (
                                <div className="ka-empty">
                                    <b>{t(`adminDesk.empty.${emptyKey}.title`)}</b>
                                    <span>{t(`adminDesk.empty.${emptyKey}.text`)}</span>
                                    {chips.length > 0 && (
                                        <button type="button" className="ka-btn ka-btn-sm" style={{ marginTop: 8 }} onClick={clearFilters}>{t('adminDesk.clearFilters')}</button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="ka-foot">
                    <span aria-live="polite">
                        {list.length === 0 ? '' : shown.length < list.length ? t('adminDesk.showingOf', { shown: shown.length, count: list.length }) : t('adminDesk.ordersCount', { count: list.length })}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        {shown.length < list.length && (
                            <button type="button" className="ka-link" style={{ fontSize: 13 }} onClick={() => setLimit((n) => n + PAGE)}>{t('adminDesk.showMoreRows')}</button>
                        )}
                        {list.length > 0 && (
                            <button type="button" className="ka-link" style={{ fontSize: 13 }} onClick={exportCsv}>
                                <Download size={14} aria-hidden="true" />
                                {t('adminDesk.exportCsv')}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
