import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, FileText, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { getAuthToken } from '../../hooks/useAuth';

interface OpenOrderDesign {
    garment_type?: string;
    clothingType?: string;
    design_file_url?: string | null;
    tailor_notes?: string;
    customization_request?: string;
    measurements?: Record<string, number | string>;
}

interface OpenOrder {
    id: number;
    order_number: string;
    created_at: string;
    custom_design_data: OpenOrderDesign | null;
    customer: { name: string };
    requests_count: number;
    my_request_status: 'pending' | 'accepted' | 'declined' | null;
}

const GARMENT_KEYS: Record<string, string> = {
    'shirt':      'orderReview.garment_shirt',
    'womens-top': 'orderReview.garment_womensTop',
    'dress':      'orderReview.garment_dress',
    'trousers':   'orderReview.garment_trousers',
    'jacket':     'orderReview.garment_jacket',
    'skirt':      'orderReview.garment_skirt',
    'coat':       'orderReview.garment_coat',
};

function OpenOrderCard({ order, onRequested }: { order: OpenOrder; onRequested: (orderId: number) => void }) {
    const { t, i18n } = useTranslation();
    const token = getAuthToken();

    const [expanded,   setExpanded]   = useState(false);
    const [message,    setMessage]    = useState('');
    const [sending,    setSending]    = useState(false);
    const [sendError,  setSendError]  = useState<string | null>(null);

    const design      = order.custom_design_data;
    const garmentKey  = design?.garment_type ?? design?.clothingType ?? '';
    const garmentName = GARMENT_KEYS[garmentKey] ? t(GARMENT_KEYS[garmentKey]) : garmentKey;
    const fileUrl     = design?.design_file_url;
    const isImage     = !!fileUrl?.match(/\.(jpg|jpeg|png|svg)$/i);
    const measurements = Object.entries(design?.measurements ?? {}).filter(([, v]) => v !== '' && v !== null);
    const alreadyRequested = order.my_request_status === 'pending';
    const dateLabel = new Date(order.created_at).toLocaleDateString(i18n.language === 'ka' ? 'ka-GE' : 'en-GB');

    const handleSend = async () => {
        if (!token || sending) return;
        setSending(true);
        setSendError(null);
        try {
            const res = await fetch(`/api/tailor/orders/${order.id}/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({ message: message.trim() || null }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error((data as { message?: string }).message ?? t('tailorComponents.offerFailed'));
            onRequested(order.id);
            setExpanded(false);
        } catch (err: unknown) {
            setSendError(err instanceof Error ? err.message : t('tailorComponents.offerFailed'));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-4 sm:p-5">
            <div className="flex gap-4">
                {/* Design preview */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {fileUrl && isImage ? (
                        <img src={fileUrl} alt={garmentName} className="w-full h-full object-cover" loading="lazy" />
                    ) : fileUrl ? (
                        <FileText className="w-6 h-6 text-slate-400" />
                    ) : (
                        <Sparkles className="w-6 h-6 text-slate-400" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm capitalize truncate">{garmentName || t('tailorComponents.customDesignBadge')}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {order.customer.name} · {dateLabel} · <span className="font-mono">{order.order_number}</span>
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                            {t('tailorComponents.offersSoFar', { count: order.requests_count })}
                        </span>
                    </div>

                    {measurements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {measurements.map(([k, v]) => (
                                <span key={k} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                    <span className="capitalize">{t(`orderReview.size_${k}`, k)}</span>: {v} {t('tailorComponents.cmUnit')}
                                </span>
                            ))}
                        </div>
                    )}

                    {design?.customization_request && (
                        <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                            <span className="font-semibold text-slate-500">{t('tailorComponents.customizationRequest')}:</span> {design.customization_request}
                        </p>
                    )}

                    {design?.tailor_notes && (
                        <p className="mt-2 text-xs text-slate-500">
                            <span className="font-semibold">{t('tailorComponents.customNotesSection')}:</span> {design.tailor_notes}
                        </p>
                    )}

                    <div className="mt-3">
                        {alreadyRequested ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full">
                                <Check className="w-3 h-3" />
                                {t('tailorComponents.offerSentBadge')}
                            </span>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setExpanded(v => !v)} className="text-xs">
                                {t('tailorComponents.offerBtn')}
                                {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                            </Button>
                        )}
                    </div>

                    <AnimatePresence>
                        {expanded && !alreadyRequested && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="mt-3 space-y-2"
                            >
                                <label className="block text-xs font-medium text-slate-600">
                                    {t('tailorComponents.offerMessageLabel')}
                                </label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value.slice(0, 500))}
                                    placeholder={t('tailorComponents.offerMessagePlaceholder')}
                                    rows={2}
                                    maxLength={500}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                />
                                {sendError && <p className="text-xs text-destructive">{sendError}</p>}
                                <Button variant="default" size="sm" onClick={handleSend} disabled={sending} className="text-xs">
                                    {sending
                                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{t('tailorComponents.offerSending')}</>
                                        : t('tailorComponents.offerSendBtn')}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export function AvailableDesigns() {
    const { t } = useTranslation();
    const token = getAuthToken();
    const [orders,    setOrders]    = useState<OpenOrder[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [loadError, setLoadError] = useState(false);

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

    const handleRequested = (orderId: number) => {
        setOrders(prev => prev.map(o => o.id === orderId
            ? { ...o, my_request_status: 'pending', requests_count: o.requests_count + 1 }
            : o
        ));
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">{t('tailorComponents.availableDesignsTitle')}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('tailorComponents.availableDesignsDesc')}</p>
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
                <div className="divide-y divide-slate-100">
                    {orders.map((order, i) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        >
                            <OpenOrderCard order={order} onRequested={handleRequested} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
