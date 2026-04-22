export interface AuthUser {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone: string;
    role: 'customer' | 'tailor';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const USER_KEY  = 'kere_user';
const TOKEN_KEY = 'kere_token';

export function getAuthUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

export function getAuthToken(): string | null {
    // Critical #1: token in sessionStorage — cleared on tab close, not accessible cross-tab
    return sessionStorage.getItem(TOKEN_KEY);
}

export function saveAuth(user: AuthUser, token: string): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}

// ─── Return-to (post-login redirect) ─────────────────────────────────────────

const RETURN_TO_KEY = 'kere_return_to';

export function saveReturnTo(path: string): void {
    localStorage.setItem(RETURN_TO_KEY, path);
}

export function getReturnTo(): string | null {
    return localStorage.getItem(RETURN_TO_KEY);
}

export function clearReturnTo(): void {
    localStorage.removeItem(RETURN_TO_KEY);
}

// ─── Pending order (state persistence across login) ───────────────────────────

const PENDING_ORDER_KEY = 'kere_pending_order';

export interface PendingMarketplaceOrder {
    type: 'marketplace';
    productId: number;
    color: string;
    size: string;
    quantity: number;
    measurements: Record<string, string>;
}

export interface PendingCustomOrder {
    type: 'custom';
    design: Record<string, unknown>;
}

export type PendingOrder = PendingMarketplaceOrder | PendingCustomOrder;

export function savePendingOrder(data: PendingOrder): void {
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(data));
}

export function getPendingOrder(): PendingOrder | null {
    try {
        const raw = localStorage.getItem(PENDING_ORDER_KEY);
        return raw ? (JSON.parse(raw) as PendingOrder) : null;
    } catch {
        return null;
    }
}

export function clearPendingOrder(): void {
    localStorage.removeItem(PENDING_ORDER_KEY);
}
