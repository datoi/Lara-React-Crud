import type { TFunction } from 'i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { formatCalendarDay } from '../../lib/dates';

/**
 * The admin workspace's data, as `/api/admin/*` sends it, and the helpers its
 * three sections share. Statuses are read in plain words ("Needs a tailor",
 * "With courier") rather than the raw `orders.status`.
 */

export interface TailorScoreValue {
    average: number;
    count: number;
}

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

export interface AdminNote {
    id: number;
    body: string;
    author: string | null;
    created_at: string;
}

export type CourierStep = 'pickup' | 'ship' | 'deliver';

export interface AdminOrder {
    id: number;
    order_number: string;
    order_type: 'marketplace' | 'custom' | 'remodel';
    status: string;
    subtotal: number;
    shipping: number;
    total: number;
    expected_price: number | null;
    needed_by: string | null;
    created_at: string;
    offer_sent_at: string | null;
    paid_at: string | null;
    deposit_paid_at: string | null;
    customer: { id: number; name: string; email: string | null; phone: string | null } | null;
    return_address: { name: string; phone: string | null; address: string; city: string; zip: string | null } | null;
    custom_design_data: Record<string, unknown> | null;
    customer_note: string | null;
    tailor: { id: number; name: string } | null;
    items: { id: number; product_name: string; quantity: number; price: number }[];
    message_count: number;
    delivered_at: string | null;
    payment_status: string;
    paid_remodel: boolean;
    deposit_amount: number | null;
    paid_total: number;
    refunded_total: number;
    due_date: string | null;
    picked_up_at: string | null;
    received_at: string | null;
    shipped_at: string | null;
    cancelled_at: string | null;
    open_claims_count: number;
    next_courier_step: CourierStep | null;
    refunds: { amount: number; status: string; note: string | null; created_at: string }[];
    estimates: AdminEstimate[];
    offer: AdminOffer | null;
    review: { rating: number; status: ReviewStatus } | null;
    admin_notes: AdminNote[];
}

export interface AdminUser {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    role: 'customer' | 'tailor' | 'admin';
    is_suspended: boolean;
    approval_status: 'pending' | 'approved' | 'rejected' | null;
    /** A 16-17 year old whose guardian has not confirmed; they cannot order. */
    guardian_consent_pending?: boolean;
    score: TailorScoreValue | null;
    created_at: string;
}

export interface PendingTailor {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    business_type: string | null;
    does_remodeling: boolean | null;
    workspace_address: string | null;
    years_experience: number | null;
    legal_status: string | null;
}

export interface AdminClaim {
    id: number;
    type: 'return' | 'problem';
    status: 'open' | 'resolved' | 'rejected';
    message: string | null;
    photos: string[];
    resolution_note: string | null;
    created_at: string;
    order: { id: number; order_number: string } | null;
}

export type ReviewStatus = 'pending' | 'published' | 'hidden';

export interface AdminReview {
    id: number;
    rating: number;
    comment: string;
    status: ReviewStatus;
    created_at: string;
    order: { id: number; order_number: string; kind: 'marketplace' | 'custom' | 'remodel' | null; product_name: string | null } | null;
    customer: { name: string; email: string | null } | null;
    tailor: { id: number; name: string } | null;
}

// ─── Statuses ────────────────────────────────────────────────────────────────

export type DeskStatus = 'needs' | 'offered' | 'unpaid' | 'waiting' | 'making' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

export const DESK_STATUSES: DeskStatus[] = ['needs', 'offered', 'unpaid', 'waiting', 'making', 'ready', 'shipped', 'delivered', 'cancelled'];

export const STATUS_DOT: Record<DeskStatus, string> = {
    needs: '#C98A2B',
    offered: '#DDB872',
    unpaid: '#CDBB9E',
    waiting: '#B1A596',
    making: '#A2505B',
    ready: '#6E9A78',
    shipped: '#2F5D44',
    delivered: '#1F3A2B',
    cancelled: '#D3CABE',
};

export function deskStatus(order: AdminOrder): DeskStatus {
    switch (order.status) {
        case 'pending_assignment':
            return order.offer ? 'offered' : 'needs';
        case 'pending':
            return order.payment_status === 'unpaid' ? 'unpaid' : 'waiting';
        case 'processing':
            return 'making';
        case 'finished':
            // A paid remodel waits for its second half before it can ship.
            return order.payment_status === 'deposit_paid' || order.payment_status === 'unpaid' ? 'unpaid' : 'ready';
        case 'shipped':
            return 'shipped';
        case 'delivered':
            return 'delivered';
        default:
            return 'cancelled';
    }
}

export type OrderView = 'all' | 'needs' | 'active' | 'completed';

export function inView(order: AdminOrder, view: OrderView): boolean {
    const status = deskStatus(order);
    if (view === 'needs') return status === 'needs' || status === 'offered';
    if (view === 'active') return ['unpaid', 'waiting', 'making', 'ready', 'shipped'].includes(status);
    if (view === 'completed') return status === 'delivered';
    return true;
}

/** Neither delivered nor cancelled. */
export const isActive = (order: AdminOrder) => order.status !== 'delivered' && order.status !== 'cancelled';

/** Money paid that has not been returned on a cancelled order. */
export const refundDue = (order: AdminOrder) => order.status === 'cancelled' && order.paid_total > order.refunded_total;

// ─── Requests ────────────────────────────────────────────────────────────────

export interface ApiResult<T> {
    ok: boolean;
    status: number;
    data: T & { code?: unknown; message?: unknown };
}

/** A JSON request with the admin's token. Network failures throw; HTTP errors come back with `ok: false`. */
export async function api<T = Record<string, unknown>>(url: string, method = 'GET', body?: unknown): Promise<ApiResult<T>> {
    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            Accept: 'application/json',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export const money = (amount: number) => `₾${Number(amount).toFixed(2)}`;

export function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase();
}

function todayDay(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole days from a calendar day (`YYYY-MM-DD`) to today, never negative. */
export function daysSince(day: string): number {
    const [y, m, d] = day.split('-').map(Number);
    const [ty, tm, td] = todayDay().split('-').map(Number);
    return Math.max(0, Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000));
}

/** "26 Aug", with the year only when it is not this year. */
export function shortDay(day: string, t: TFunction): string {
    const [y, m, d] = day.split('-').map(Number);
    const month = t(`adminDesk.monthsShort.${m}`);
    return y === new Date().getFullYear() ? t('adminDesk.shortDay', { day: d, month }) : t('adminDesk.shortDayYear', { day: d, month, year: y });
}

export const longDay = (day: string, t: TFunction) => formatCalendarDay(day, t);

/** "today", "yesterday" or "12 days ago". */
export function ago(day: string, t: TFunction): string {
    const n = daysSince(day);
    return n === 0 ? t('adminDesk.today') : n === 1 ? t('adminDesk.yesterday') : t('adminDesk.daysAgo', { count: n });
}

/** "Monday, 30 October" for the summary line. */
export function todayLine(t: TFunction): string {
    const now = new Date();
    return t('adminDesk.dateLine', {
        weekday: t(`adminDesk.weekdays.${now.getDay()}`),
        day: now.getDate(),
        month: t(`calendar.months.${now.getMonth() + 1}`),
    });
}

export const scoreText = (score: TailorScoreValue | null | undefined, t: TFunction) =>
    score ? t('adminReviews.score', { average: score.average.toFixed(1), count: score.count }) : t('adminReviews.noScore');

export function itemsText(order: AdminOrder, t: TFunction): string {
    if (order.items.length > 0) return order.items.map((i) => (i.quantity > 1 ? `${i.product_name} ×${i.quantity}` : i.product_name)).join(', ');
    return t(`adminDesk.kind.${order.order_type}`);
}

// ─── Unread messages ─────────────────────────────────────────────────────────

/**
 * The API counts an order's messages but keeps no read state for Kere, so
 * this browser remembers how many each order had when an admin last read it.
 * The first visit takes everything already there as read.
 */
const SEEN_KEY = 'kere_admin_chat_seen';

function readSeen(): Record<string, number> | null {
    try {
        const raw = localStorage.getItem(SEEN_KEY);
        return raw ? (JSON.parse(raw) as Record<string, number>) : null;
    } catch {
        return null;
    }
}

function writeSeen(seen: Record<string, number>) {
    try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch {
        /* unread markers simply reset next visit */
    }
}

/** Unread counts per order id. Starts a baseline on first use. */
export function unreadCounts(orders: AdminOrder[]): Record<number, number> {
    let seen = readSeen();
    if (!seen) {
        seen = Object.fromEntries(orders.map((o) => [o.id, o.message_count]));
        writeSeen(seen);
    }
    const out: Record<number, number> = {};
    for (const o of orders) {
        const n = o.message_count - (seen[o.id] ?? 0);
        if (n > 0) out[o.id] = n;
    }
    return out;
}

export function markRead(order: AdminOrder) {
    const seen = readSeen() ?? {};
    if (seen[order.id] === order.message_count) return;
    writeSeen({ ...seen, [order.id]: order.message_count });
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function ordersCsv(orders: AdminOrder[], t: TFunction): string {
    const esc = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [[t('adminDesk.csv.order'), t('adminDesk.csv.placed'), t('adminDesk.csv.customer'), t('adminDesk.csv.email'), t('adminDesk.csv.items'), t('adminDesk.csv.status'), t('adminDesk.csv.tailor'), t('adminDesk.csv.total')]];
    for (const o of orders) {
        rows.push([o.order_number, o.created_at, o.customer?.name ?? '', o.customer?.email ?? '', itemsText(o, t), t(`adminDesk.status.${deskStatus(o)}`), o.tailor?.name ?? '', Number(o.total).toFixed(2)]);
    }
    return rows.map((r) => r.map(esc).join(',')).join('\n');
}
