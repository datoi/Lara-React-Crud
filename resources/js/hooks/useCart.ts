// Shopping cart for marketplace products.
//
// Guests can fill a cart without an account, so it lives in localStorage under
// `kere_cart` alongside kere_lang / kere_section. Login is only required at
// checkout, which reuses the existing pendingOrder redirect.
//
// Prices here are a display snapshot taken when the item was added. The order
// endpoint recomputes every price from the product row, so a stale or edited
// cart cannot change what a customer is charged.

import { useSyncExternalStore } from 'react';

const KEY = 'kere_cart';
const MAX_QUANTITY = 99;

export interface CartItem {
    productId: number;
    name: string;
    price: number;
    image: string | null;
    size: string | null;
    color: string | null;
    quantity: number;
    tailorId: number | null;
    tailorName: string | null;
}

/** Same product in a different size or colour is a separate line, as everywhere else. */
function sameLine(a: CartItem, b: Pick<CartItem, 'productId' | 'size' | 'color'>): boolean {
    return a.productId === b.productId && a.size === b.size && a.color === b.color;
}

export function lineKey(item: Pick<CartItem, 'productId' | 'size' | 'color'>): string {
    return `${item.productId}|${item.size ?? ''}|${item.color ?? ''}`;
}

function read(): CartItem[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // Drop anything malformed rather than letting one bad entry break the cart.
        return parsed.filter(
            (i): i is CartItem =>
                !!i && typeof i === 'object' && typeof (i as CartItem).productId === 'number' && typeof (i as CartItem).quantity === 'number'
        );
    } catch {
        return [];
    }
}

let items: CartItem[] = typeof window === 'undefined' ? [] : read();
const listeners = new Set<() => void>();

function commit(next: CartItem[]): void {
    items = next;
    try {
        localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
        // Private mode or a full quota — keep the in-memory cart working.
    }
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
    return items;
}

const EMPTY: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
    return EMPTY;
}

if (typeof window !== 'undefined') {
    // Keep tabs in step — adding in one tab should update the badge in another.
    window.addEventListener('storage', (e) => {
        if (e.key !== KEY) return;
        items = read();
        listeners.forEach((l) => l());
    });
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
    const existing = items.find((i) => sameLine(i, item));
    if (existing) {
        commit(items.map((i) => (sameLine(i, item) ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QUANTITY) } : i)));
        return;
    }
    commit([...items, { ...item, quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY) }]);
}

/** Nudge a line's quantity; dropping to zero removes it, as a stepper is expected to. */
export function updateCartQuantity(target: Pick<CartItem, 'productId' | 'size' | 'color'>, change: number): void {
    const next: CartItem[] = [];
    for (const i of items) {
        if (!sameLine(i, target)) {
            next.push(i);
            continue;
        }
        const quantity = Math.min(i.quantity + change, MAX_QUANTITY);
        if (quantity > 0) next.push({ ...i, quantity });
    }
    commit(next);
}

export function removeCartItem(target: Pick<CartItem, 'productId' | 'size' | 'color'>): void {
    commit(items.filter((i) => !sameLine(i, target)));
}

export function clearCart(): void {
    commit([]);
}

export function useCart(): CartItem[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Drawer visibility is global too: the nav, the product grid and the product page
// all open the same panel, so it cannot live in any one page's state.
let open = false;
const openListeners = new Set<() => void>();

function subscribeOpen(listener: () => void): () => void {
    openListeners.add(listener);
    return () => openListeners.delete(listener);
}

function getOpen(): boolean {
    return open;
}

function getServerOpen(): boolean {
    return false;
}

function setOpen(next: boolean): void {
    if (open === next) return;
    open = next;
    openListeners.forEach((l) => l());
}

export function openCart(): void {
    setOpen(true);
}

export function closeCart(): void {
    setOpen(false);
}

export function useCartOpen(): boolean {
    return useSyncExternalStore(subscribeOpen, getOpen, getServerOpen);
}

export function cartCount(list: CartItem[]): number {
    return list.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(list: CartItem[]): number {
    return list.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

/** Checkout creates one order per tailor, so the cart is grouped before it is sent. */
export function groupByTailor(list: CartItem[]): { tailorId: number | null; tailorName: string | null; items: CartItem[] }[] {
    const groups = new Map<string, { tailorId: number | null; tailorName: string | null; items: CartItem[] }>();
    for (const i of list) {
        const key = String(i.tailorId ?? 'unassigned');
        const group = groups.get(key);
        if (group) group.items.push(i);
        else groups.set(key, { tailorId: i.tailorId, tailorName: i.tailorName, items: [i] });
    }
    return [...groups.values()];
}
