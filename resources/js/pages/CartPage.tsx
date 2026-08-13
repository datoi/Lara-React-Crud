import { CheckCircle2, ImageOff, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { isHex } from '../components/CartDrawer';
import { Navigation } from '../components/landing/Navigation';
import { Button } from '../components/ui/button';
import { getAuthToken, saveReturnTo } from '../hooks/useAuth';
import {
    cartSubtotal,
    clearCart,
    groupByTailor,
    lineKey,
    removeCartItem,
    updateCartQuantity,
    useCart,
    type CartItem,
} from '../hooks/useCart';

interface PlacedOrder {
    orderNumber: string;
    total: number;
    tailorName: string;
}

export default function CartPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const items = useCart();

    const [shipping, setShipping] = useState(15);
    const [stock, setStock] = useState<Record<number, number>>({});
    const [missing, setMissing] = useState<number[]>([]);
    const [checking, setChecking] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');
    const [placed, setPlaced] = useState<PlacedOrder[] | null>(null);

    // Cart prices are a snapshot from when the item was added, so re-check each
    // product on arrival: refresh stock and shipping, and surface anything that
    // has since sold out. The server recomputes prices regardless.
    useEffect(() => {
        if (placed) return;
        const ids = [...new Set(items.map((i) => i.productId))];
        if (ids.length === 0) {
            setChecking(false);
            return;
        }
        let active = true;
        setChecking(true);
        Promise.all(
            ids.map((id) =>
                fetch(`/api/products/${id}`)
                    .then(async (r) => ({ id, status: r.status, body: r.ok ? await r.json() : null }))
                    .catch(() => ({ id, status: 0, body: null }))
            )
        ).then((results) => {
            if (!active) return;
            const nextStock: Record<number, number> = {};
            const gone: number[] = [];
            for (const res of results) {
                // A 404 means the product was deleted while it sat in the bag. A
                // network failure (status 0) is not the customer's problem, so it
                // does not block checkout — the server still guards overselling.
                if (res.status === 404) {
                    gone.push(res.id);
                    continue;
                }
                if (!res.body?.product) continue;
                nextStock[res.body.product.id] = res.body.product.stock ?? 0;
                if (typeof res.body.shipping_cost === 'number') setShipping(res.body.shipping_cost);
            }
            setStock(nextStock);
            setMissing(gone);
            setChecking(false);
        });
        return () => {
            active = false;
        };
        // Re-runs when lines are added/removed; quantity edits alone don't need a refetch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length, placed]);

    const groups = groupByTailor(items);
    const subtotal = cartSubtotal(items);
    const shippingTotal = shipping * groups.length;
    const total = subtotal + shippingTotal;

    const isGone = (item: CartItem): boolean => missing.includes(item.productId);
    const outOfStock = (item: CartItem): boolean => {
        const available = stock[item.productId];
        return available !== undefined && available < item.quantity;
    };
    const hasBlockers = items.some((i) => outOfStock(i) || isGone(i));

    const checkout = async () => {
        const token = getAuthToken();
        if (!token) {
            saveReturnTo('/cart');
            navigate('/signin');
            return;
        }

        setPlacing(true);
        setError('');
        const results: PlacedOrder[] = [];

        try {
            // One order per tailor: each request carries only that tailor's lines.
            for (const group of groups) {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        order_type: 'marketplace',
                        tailor_id: group.tailorId,
                        items: group.items.map((i) => ({
                            product_id: i.productId,
                            color: i.color,
                            size: i.size,
                            quantity: i.quantity,
                        })),
                    }),
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    const reason =
                        res.status === 429 ? t('cart.errorThrottled') : (body.message ?? t('cart.errorGeneric'));
                    // Groups already ordered were removed as they succeeded, so the
                    // cart now holds only what still needs buying — pressing Place
                    // order again retries exactly that and cannot double-order.
                    setError(results.length > 0 ? t('cart.errorPartial', { count: results.length, message: reason }) : reason);
                    return;
                }

                const data = await res.json();
                // Reconcile immediately: this group is bought and must not be re-sent
                // if a later group fails.
                for (const item of group.items) removeCartItem(item);
                results.push({
                    orderNumber: data.order_number,
                    total: data.total,
                    tailorName: data.tailor_name ?? group.tailorName ?? '',
                });
            }

            clearCart();
            setPlaced(results);
        } catch {
            setError(t('cart.errorNetwork'));
        } finally {
            setPlacing(false);
        }
    };

    if (placed) {
        return (
            <div className="kere-info-page min-h-screen bg-[#F7F6F3]">
                <Helmet>
                    <title>{t('cart.orderPlacedTitle')} — Kere</title>
                </Helmet>
                <Navigation />
                <main className="mx-auto max-w-[720px] px-4 pt-28 pb-24 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="border border-[#111111]/12 bg-white p-8 text-center"
                    >
                        <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-brand)]" />
                        <h1 className="mt-4 font-serif text-2xl text-[#111111]">{t('cart.orderPlacedTitle')}</h1>
                        <p className="mt-2 text-sm text-[#6c625b]">
                            {placed.length === 1 ? t('cart.orderPlacedOne') : t('cart.orderPlacedMany', { n: placed.length })}
                        </p>

                        <ul className="mt-6 space-y-3 text-left">
                            {placed.map((order) => (
                                <li key={order.orderNumber} className="flex items-center justify-between border border-[#111111]/12 bg-[#F7F6F3] px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#111111]">{order.orderNumber}</p>
                                        {order.tailorName && <p className="truncate text-xs text-[#6c625b]">{order.tailorName}</p>}
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold text-[#111111]">₾{Number(order.total).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button onClick={() => navigate('/customer-dashboard')}>{t('cart.viewOrders')}</Button>
                            <Button variant="outline" onClick={() => navigate('/marketplace')}>
                                {t('cart.continueShopping')}
                            </Button>
                        </div>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="kere-info-page min-h-screen bg-[#F7F6F3]">
            <Helmet>
                <title>{t('cart.title')} — Kere</title>
            </Helmet>
            <Navigation />

            <main className="mx-auto max-w-[1180px] px-4 pt-28 pb-24 sm:px-6 lg:px-8">
                <h1 className="font-serif text-[clamp(1.8rem,3.5vw,2.75rem)] text-[#111111]">{t('cart.title')}</h1>

                {items.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center gap-4 border border-[#111111]/12 bg-white py-20 text-center">
                        <ShoppingBag className="h-12 w-12 stroke-1 text-[#6c625b]" />
                        <p className="text-[#6c625b]">{t('cart.empty')}</p>
                        <Button onClick={() => navigate('/marketplace')}>{t('cart.continueShopping')}</Button>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
                        <div className="space-y-8">
                            {groups.map((group) => (
                                <section key={group.tailorId ?? 'unassigned'} className="border border-[#111111]/12 bg-white">
                                    <header className="flex items-center justify-between border-b border-[#111111]/12 px-5 py-3">
                                        <p className="text-xs font-semibold tracking-[0.08em] text-[#6c625b] uppercase">
                                            {group.tailorName ? t('cart.soldBy', { tailor: group.tailorName }) : t('cart.tailorAssignedLater')}
                                        </p>
                                        <span className="text-xs text-[#6c625b]">{t('cart.shippingPerTailor', { amount: shipping })}</span>
                                    </header>

                                    <ul>
                                        {group.items.map((item) => (
                                            <li key={lineKey(item)} className="grid grid-cols-[88px_1fr] gap-4 border-b border-[#111111]/10 p-5 last:border-b-0 sm:grid-cols-[120px_1fr] sm:gap-6">
                                                <Link to={`/product/${item.productId}`} className="aspect-[3/4] overflow-hidden bg-[#E4E0D7]">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-contain p-2" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center">
                                                            <ImageOff className="h-6 w-6 opacity-25" />
                                                        </div>
                                                    )}
                                                </Link>

                                                <div className="flex min-w-0 flex-col">
                                                    <Link to={`/product/${item.productId}`} className="text-sm font-semibold text-[#111111] hover:opacity-60">
                                                        {item.name}
                                                    </Link>
                                                    <div className="mt-1 space-y-0.5 text-xs text-[#6c625b]">
                                                        {item.size && <p>{t('cart.sizeLabel')}: {item.size}</p>}
                                                        {item.color && (
                                                            <p className="flex items-center gap-1.5">
                                                                <span>{t('cart.colorLabel')}:</span>
                                                                {isHex(item.color) ? (
                                                                    <span
                                                                        className="inline-block h-3 w-3 rounded-full border border-black/20"
                                                                        style={{ background: item.color }}
                                                                    />
                                                                ) : (
                                                                    item.color
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {isGone(item) ? (
                                                        <p className="mt-2 text-xs font-semibold text-red-700">{t('cart.noLongerAvailable')}</p>
                                                    ) : (
                                                        outOfStock(item) && (
                                                            <p className="mt-2 text-xs font-semibold text-red-700">
                                                                {stock[item.productId] === 0
                                                                    ? t('cart.outOfStock')
                                                                    : t('cart.onlyLeft', { n: stock[item.productId] })}
                                                            </p>
                                                        )
                                                    )}

                                                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
                                                        <div className="flex h-9 items-center border border-[#111111]/15">
                                                            <button
                                                                type="button"
                                                                aria-label={t('cart.decrease')}
                                                                onClick={() => updateCartQuantity(item, -1)}
                                                                className="flex h-9 w-9 items-center justify-center hover:bg-[#111111]/5"
                                                            >
                                                                <Minus className="h-3.5 w-3.5" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                                            <button
                                                                type="button"
                                                                aria-label={t('cart.increase')}
                                                                onClick={() => updateCartQuantity(item, 1)}
                                                                className="flex h-9 w-9 items-center justify-center hover:bg-[#111111]/5"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm font-semibold text-[#111111]">₾{(item.price * item.quantity).toFixed(2)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCartItem(item)}
                                                                className="text-xs font-semibold text-[#6c625b] underline underline-offset-4 hover:text-[#111111]"
                                                            >
                                                                {t('cart.remove')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>

                        <aside className="border border-[#111111]/12 bg-white p-5 lg:sticky lg:top-24">
                            <h2 className="text-xs font-semibold tracking-[0.08em] text-[#6c625b] uppercase">{t('cart.summary')}</h2>

                            <dl className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-[#6c625b]">{t('cart.subtotal')}</dt>
                                    <dd className="text-[#111111]">₾{subtotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[#6c625b]">
                                        {t('cart.shipping')}
                                        {groups.length > 1 && <span className="ml-1 text-xs">({t('cart.shippingGroups', { n: groups.length })})</span>}
                                    </dt>
                                    <dd className="text-[#111111]">₾{shippingTotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-[#111111]/12 pt-3 text-base font-semibold">
                                    <dt>{t('cart.total')}</dt>
                                    <dd>₾{total.toFixed(2)}</dd>
                                </div>
                            </dl>

                            {groups.length > 1 && <p className="mt-3 text-xs leading-5 text-[#6c625b]">{t('cart.splitNotice', { n: groups.length })}</p>}

                            {error && (
                                <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                                    {error}
                                </p>
                            )}

                            <Button onClick={checkout} disabled={placing || checking || hasBlockers} className="mt-5 w-full">
                                {placing ? t('cart.placing') : t('cart.placeOrder')}
                            </Button>

                            {hasBlockers && <p className="mt-2 text-xs text-red-700">{t('cart.fixStockFirst')}</p>}

                            <button
                                type="button"
                                onClick={() => navigate('/marketplace')}
                                className="mt-4 w-full text-xs font-semibold text-[#6c625b] underline underline-offset-4 hover:text-[#111111]"
                            >
                                {t('cart.continueShopping')}
                            </button>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}
