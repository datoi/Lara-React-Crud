import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { getAuthToken } from '../../hooks/useAuth';
import { readProductName } from '../DesignSpecList';
import { OpenDesignDialog } from './OpenDesignDialog';
import { OpenDesignPicture } from './OpenDesignPicture';
import { GARMENT_KEYS, readStudioChoices, type OpenOrder, type StudioProduct } from './openOrders';

export function AvailableDesigns() {
    const { t, i18n } = useTranslation();
    const token = getAuthToken();
    const [orders,    setOrders]    = useState<OpenOrder[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [loadError, setLoadError] = useState(false);
    // Studio products by slug, fetched once each however many requests share
    // one; null when a product can no longer be loaded, so it is not retried.
    const [products,  setProducts]  = useState<Record<string, StudioProduct | null>>({});
    const [openId,    setOpenId]    = useState<number | null>(null);
    const openedFrom = useRef<HTMLButtonElement | null>(null);

    const fetchOpenOrders = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        setLoading(true);
        setLoadError(false);
        try {
            const res = await fetch('/api/tailor/open-orders', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setOrders((await res.json()).orders ?? []);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchOpenOrders(); }, [fetchOpenOrders]);

    useEffect(() => {
        const missing = [...new Set(orders
            .map(o => readStudioChoices(o.custom_design_data?.customization)?.product_slug)
            .filter((slug): slug is string => !!slug && !(slug in products)))];
        if (missing.length === 0) return;

        const controller = new AbortController();
        Promise.all(missing.map(slug =>
            fetch(`/api/customizer/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
                .then(res => (res.ok ? res.json() : null))
                .then(data => [slug, data ? { layer_categories: data.layer_categories ?? [], fabrics: data.fabrics ?? [] } as StudioProduct : null] as const)
                .catch(() => [slug, null] as const),
        )).then(entries => {
            if (!controller.signal.aborted) setProducts(prev => ({ ...prev, ...Object.fromEntries(entries) }));
        });

        return () => controller.abort();
    }, [orders, products]);

    const handleRequested = (orderId: number) => {
        setOrders(prev => prev.map(o => o.id === orderId
            ? { ...o, my_request_status: 'pending', requests_count: o.requests_count + 1 }
            : o
        ));
    };

    const titleOf = (order: OpenOrder) => {
        if (order.order_type === 'remodel') return t('tailorComponents.remodelBadge');
        const design = order.custom_design_data;
        const garmentKey = design?.garment_type ?? design?.clothingType ?? '';
        return readProductName(design?.customization)
            ?? ((GARMENT_KEYS[garmentKey] ? t(GARMENT_KEYS[garmentKey]) : garmentKey) || t('tailorComponents.customDesignBadge'));
    };
    const dateOf = (order: OpenOrder) =>
        new Date(order.created_at).toLocaleDateString(i18n.language === 'ka' ? 'ka-GE' : 'en-GB');
    const productOf = (order: OpenOrder) => {
        const slug = readStudioChoices(order.custom_design_data?.customization)?.product_slug;
        return slug ? products[slug] ?? null : null;
    };

    const openOrder = orders.find(o => o.id === openId) ?? null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">{t('tailorComponents.availableDesignsTitle')}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{t('tailorComponents.availableDesignsDesc')}</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
            ) : loadError ? (
                <div className="px-6 py-10 text-center">
                    <p className="text-destructive text-sm">{t('tailorComponents.openDesignsLoadFailed')}</p>
                    <Button variant="outline" size="sm" onClick={fetchOpenOrders} className="mt-3 text-xs">
                        {t('tailorComponents.openDesignsRetry')}
                    </Button>
                </div>
            ) : orders.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <p className="text-slate-400 text-sm">{t('tailorComponents.noOpenDesigns')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-6">
                    {orders.map((order, i) => {
                        const title = titleOf(order);
                        const sent = order.my_request_status === 'pending';
                        return (
                            <motion.button
                                key={order.id}
                                type="button"
                                onClick={event => {
                                    openedFrom.current = event.currentTarget;
                                    setOpenId(order.id);
                                }}
                                aria-label={`${title} · ${t('tailorComponents.viewBtn')}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.1 }}
                                className="group flex min-w-0 flex-col border border-slate-200 bg-white text-left transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                            >
                                <div className="relative aspect-square w-full overflow-hidden border-b border-slate-200">
                                    <OpenDesignPicture order={order} product={productOf(order)} label={title} />
                                    {order.order_type === 'remodel' && (
                                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                            <Scissors className="h-3 w-3" aria-hidden="true" /> {t('tailorComponents.remodelBadge')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col gap-1 p-3">
                                    <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                                    <p className="truncate text-xs text-slate-500">{order.customer.name} · {dateOf(order)}</p>
                                    <p className="mt-auto pt-1 text-xs text-slate-500">
                                        {sent
                                            ? <span className="inline-flex items-center gap-1 font-medium text-slate-700"><Check className="h-3 w-3" aria-hidden="true" />{t('tailorComponents.offerSentShort')}</span>
                                            : order.order_type === 'remodel' && order.expected_price != null
                                                ? `₾${order.expected_price}`
                                                : t('tailorComponents.offersSoFar', { count: order.requests_count })}
                                    </p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            <OpenDesignDialog
                order={openOrder}
                product={openOrder ? productOf(openOrder) : null}
                title={openOrder ? titleOf(openOrder) : ''}
                dateLabel={openOrder ? dateOf(openOrder) : ''}
                onClose={() => setOpenId(null)}
                onRequested={handleRequested}
                returnFocusTo={openedFrom.current}
            />
        </div>
    );
}
