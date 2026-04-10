import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string;                     // unique per cart item
    type: 'marketplace' | 'custom';
    productId?: number;
    productName: string;
    image?: string | null;
    color?: string;
    size?: string;
    quantity: number;
    price: number;                  // 0 for custom orders
    measurements?: Record<string, string>;
    customDesign?: Record<string, unknown>;
}

interface CartContextValue {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQty: (id: string, qty: number) => void;
    clear: () => void;
    total: number;
    count: number;
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'kere_cart';

function loadCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(loadCart);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = (item: Omit<CartItem, 'id'>) => {
        const id = `${item.type}-${item.productId ?? 'custom'}-${Date.now()}`;
        setItems(prev => [...prev, { ...item, id }]);
        setIsOpen(true);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQty = (id: string, qty: number) => {
        if (qty < 1) { removeItem(id); return; }
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
    };

    const clear = () => setItems([]);

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, addItem, removeItem, updateQty, clear,
            total, count,
            isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
