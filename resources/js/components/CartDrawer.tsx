import { ImageOff, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
    cartSubtotal,
    closeCart,
    lineKey,
    removeCartItem,
    updateCartQuantity,
    useCart,
    useCartOpen,
    type CartItem,
} from '../hooks/useCart';

/** Product colours are stored as hex, so show a swatch rather than "#1E293B". */
export function isHex(value: string): boolean {
    return /^#[0-9a-f]{3,8}$/i.test(value);
}

interface Recommendation {
    id: number;
    name: string;
    price: number;
    description: string;
    images: string[];
}

export function CartDrawer() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const items = useCart();
    const open = useCartOpen();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

    // Close on Escape and lock the page behind the panel, as a modal dialog should.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeCart();
        };
        window.addEventListener('keydown', onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = previous;
        };
    }, [open]);

    useEffect(() => {
        if (!open || recommendations.length > 0) return;
        let active = true;
        fetch('/api/products?per_page=8')
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
            .then((d) => {
                if (active) setRecommendations(d.data ?? []);
            })
            // Recommendations are decorative — a failure just hides the strip.
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, [open, recommendations.length]);

    const subtotal = cartSubtotal(items);
    const inCart = new Set(items.map((i) => i.productId));
    const suggestions = recommendations.filter((p) => !inCart.has(p.id)).slice(0, 6);

    const goToCart = () => {
        closeCart();
        navigate('/cart');
    };

    const openProduct = (item: CartItem) => {
        closeCart();
        navigate(`/product/${item.productId}`);
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label={t('cart.close')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 z-[110] cursor-default bg-black/35"
                    />
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('cart.title')}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
                        className="kere-cart-drawer fixed top-0 right-0 z-[120] flex h-dvh w-full max-w-[460px] flex-col border-l border-[#e5dfd8] bg-[var(--store-paper)] text-[#111111] shadow-[-8px_0_32px_rgba(17,17,17,0.08)]"
                    >
                        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5dfd8] px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-5 w-5" />
                                <h2 className="text-base font-medium">{t('cart.title')}</h2>
                                <span className="text-sm text-[#6c625b]">({items.reduce((sum, i) => sum + i.quantity, 0)})</span>
                            </div>
                            <button type="button" onClick={closeCart} aria-label={t('cart.close')} className="p-2 hover:opacity-50">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
                            {items.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[#6c625b]">
                                    <ShoppingBag className="h-10 w-10 stroke-1" />
                                    <p>{t('cart.empty')}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeCart();
                                            navigate('/marketplace');
                                        }}
                                        className="mt-1 text-xs font-semibold text-[#111111] underline underline-offset-4 hover:opacity-60"
                                    >
                                        {t('cart.continueShopping')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {items.map((item) => (
                                        <div
                                            key={lineKey(item)}
                                            className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 border-b border-[#e5dfd8] py-4 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-4"
                                        >
                                            <button type="button" onClick={() => openProduct(item)} className="aspect-[3/4] overflow-hidden bg-[#eeeae3]">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="h-full w-full object-contain p-2" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <ImageOff className="h-7 w-7 opacity-25" />
                                                    </div>
                                                )}
                                            </button>
                                            <div className="flex min-w-0 flex-col">
                                                <h3 className="text-xs font-medium leading-relaxed">{item.name}</h3>
                                                {item.size && <p className="mt-2 text-[11px] text-[#756a61]">{t('cart.sizeLabel')}: {item.size}</p>}
                                                {item.color && (
                                                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#756a61]">
                                                        <span>{t('cart.colorLabel')}:</span>
                                                        {isHex(item.color) ? (
                                                            <span
                                                                className="inline-block h-3.5 w-3.5 rounded-full border border-black/20"
                                                                style={{ background: item.color }}
                                                            />
                                                        ) : (
                                                            item.color
                                                        )}
                                                    </p>
                                                )}
                                                <p className="mt-2 text-xs font-medium">₾{item.price}</p>
                                                <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
                                                    <div className="flex h-8 items-center border border-[#ded7cf]">
                                                        <button
                                                            type="button"
                                                            aria-label={t('cart.decrease')}
                                                            onClick={() => updateCartQuantity(item, -1)}
                                                            className="flex h-8 w-8 items-center justify-center hover:bg-[#111111]/8"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-6 text-center text-[11px]">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            aria-label={t('cart.increase')}
                                                            onClick={() => updateCartQuantity(item, 1)}
                                                            className="flex h-8 w-8 items-center justify-center hover:bg-[#111111]/8"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCartItem(item)}
                                                        className="text-[11px] font-normal underline underline-offset-4 hover:opacity-50"
                                                    >
                                                        {t('cart.remove')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {suggestions.length > 0 && (
                                        <section className="border-b border-[#e5dfd8] py-7">
                                            <h3 className="mb-4 text-sm font-medium">{t('cart.youMayAlsoLike')}</h3>
                                            <div className="flex snap-x gap-3 overflow-x-auto pb-3 sm:gap-4">
                                                {suggestions.map((product) => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => {
                                                            closeCart();
                                                            navigate(`/product/${product.id}`);
                                                        }}
                                                        className="group/recommendation w-[46%] min-w-[125px] shrink-0 snap-start text-left sm:w-[42%] sm:min-w-[150px]"
                                                    >
                                                        <div className="aspect-[3/4] overflow-hidden bg-[#eeeae3]">
                                                            {product.images?.[0] ? (
                                                                <img
                                                                    src={product.images[0]}
                                                                    alt={product.name}
                                                                    className="h-full w-full object-contain p-3"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full items-center justify-center">
                                                                    <ImageOff className="h-8 w-8 opacity-25" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h4 className="mt-2 text-[11px] font-medium leading-relaxed">{product.name}</h4>
                                                        <p className="mt-2 text-xs font-medium">₾{product.price}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="shrink-0 border-t border-[#e5dfd8] bg-[var(--store-paper)] px-4 py-4 sm:px-6">
                                <div className="mb-4 flex items-center justify-between text-sm font-medium">
                                    <span>{t('cart.subtotal')}</span>
                                    <span>₾{subtotal.toFixed(2)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={goToCart}
                                    className="cart-checkout w-full bg-brand px-5 py-3 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
                                >
                                    {t('cart.checkout')}
                                </button>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
