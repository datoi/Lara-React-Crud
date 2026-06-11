import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Loader2, Phone, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { OrderChat } from '../OrderChat';
import { getAuthUser, getAuthToken } from '../../hooks/useAuth';

// ─── Module-level status label map (shared by both components) ────────────────

const STATUS_LABEL_KEYS: Record<string, string> = {
    pending:    'tailorComponents.statusPending',
    processing: 'tailorComponents.statusInProgress',
    shipped:    'tailorComponents.statusShipped',
    finished:   'tailorComponents.statusFinished',
    delivered:  'tailorComponents.statusDelivered',
    cancelled:  'tailorComponents.statusCancelled',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
    id: number;
    product_name: string;
    color: string | null;
    size: string | null;
    quantity: number;
    price: number;
    cm_measurements: Record<string, string> | null;
}

// Supports both old shape and new DesignConfig shape (garmentType/style/accentColor/components/details/notes)
interface CustomDesign {
    // new shape
    garmentType?: string | null;
    style?: string;
    accentColor?: string;
    components?: { neckline?: string; sleeves?: string; length?: string };
    details?: string[];
    notes?: string;
    height?: string;
    // old shape (backward-compat)
    clothingType?: string | null;
    subcategory?: string | null;
    length?: string;
    sleeves?: string;
    neckline?: string;
    fabric?: string;
    baseColor?: string;
    lighterShade?: string;
    darkerShade?: string;
    additionalColor?: string;
    textureMaterial?: string;
    sizeStandard?: string;
    sizeCm?: Record<string, string>;
    designElements?: { cuts?: string[]; height?: string; customNotes?: string };
}

export interface TailorOrder {
    id: number;
    order_number: string;
    order_type: 'marketplace' | 'custom';
    status: 'pending' | 'processing' | 'shipped' | 'finished' | 'delivered' | 'cancelled';
    subtotal: number;
    shipping: number;
    total: number;
    created_at: string;
    customer: { name: string; email: string; phone: string };
    items: OrderItem[];
    custom_design_data: CustomDesign | null;
}

interface OrdersListProps {
    orders: TailorOrder[];
    onStatusChange?: (orderId: number, status: string) => Promise<void>;
}

// ─── Status config (classes only — labels come from t()) ──────────────────────

const STATUS_CLASSES: Record<string, string> = {
    pending:    'bg-slate-100 text-slate-600 border-slate-200',
    processing: 'bg-slate-100 text-slate-700 border-slate-200',
    shipped:    'bg-slate-50 text-slate-600 border-slate-200',
    finished:   'bg-slate-50 text-slate-900 border-slate-200',
    delivered:  'bg-slate-50 text-slate-900 border-slate-200',
    cancelled:  'bg-slate-100 text-slate-600 border-slate-200',
};

// ─── Spec row ─────────────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
            <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
            <span className="text-xs font-medium text-slate-900 text-right">{value}</span>
        </div>
    );
}

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onStatusChange, currentUserId, initialTab = 'details' }: {
    order: TailorOrder;
    onClose: () => void;
    onStatusChange?: (id: number, status: string) => Promise<void>;
    currentUserId: number;
    initialTab?: 'details' | 'messages';
}) {
    const { t } = useTranslation();

    const STATUS_OPTIONS = [
        { value: 'pending',    labelKey: 'tailorComponents.statusPending' },
        { value: 'processing', labelKey: 'tailorComponents.statusInProgress' },
        { value: 'shipped',    labelKey: 'tailorComponents.statusShipped' },
        { value: 'finished',   labelKey: 'tailorComponents.statusFinished' },
        { value: 'cancelled',  labelKey: 'tailorComponents.statusCancelled' },
    ];

    const statusClasses = STATUS_CLASSES[order.status] ?? STATUS_CLASSES.pending;
    const statusLabel   = t(STATUS_LABEL_KEYS[order.status] ?? STATUS_LABEL_KEYS.pending);
    const isCustom = order.order_type === 'custom';
    const cd = order.custom_design_data;

    const [localStatus, setLocalStatus] = useState(order.status);
    const [saving,    setSaving]    = useState(false);
    const [saved,     setSaved]     = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'messages'>(initialTab);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleSave = async () => {
        if (!onStatusChange || saving) return;
        setSaving(true);
        setSaveError(false);
        try {
            await onStatusChange(order.id, localStatus);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setSaveError(true);
            setTimeout(() => setSaveError(false), 4000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-500">{order.order_number}</span>
                            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${statusClasses}`}>
                                {statusLabel}
                            </span>
                            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                                isCustom
                                    ? 'bg-slate-800 text-white border-slate-700'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                                {isCustom ? t('tailorComponents.customDesignBadge') : t('tailorComponents.marketplaceBadge')}
                            </span>
                        </div>
                        <p className="font-bold text-slate-900">{order.customer.name}</p>
                        <p className="text-xs text-slate-500">{order.customer.email}</p>
                        {order.customer.phone && (
                            <a
                                href={`tel:${order.customer.phone}`}
                                className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium mt-0.5 hover:text-slate-900 transition-colors"
                            >
                                <Phone className="w-3 h-3" />
                                {order.customer.phone}
                            </a>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'details'
                                ? 'text-slate-900 border-b-2 border-slate-900'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {t('chat.tabDetails')}
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'messages'
                                ? 'text-slate-900 border-b-2 border-slate-900'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {t('chat.tabMessages')}
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-6 min-w-[18px] h-[18px] bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Details tab */}
                <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                    <div className="p-6 space-y-5">
                        {/* Marketplace order details */}
                        {!isCustom && order.items.map(item => (
                            <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                    {t('tailorComponents.productDetailsSection')}
                                </div>
                                <SpecRow label={t('tailorComponents.specProduct')}  value={item.product_name} />
                                <SpecRow label={t('tailorComponents.specQuantity')} value={String(item.quantity)} />
                                <SpecRow label={t('tailorComponents.specSize')}     value={item.size} />
                                {item.color && (
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-xs text-slate-500">{t('tailorComponents.specColor')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-mono text-slate-700">{item.color}</span>
                                        </div>
                                    </div>
                                )}
                                {item.cm_measurements && Object.keys(item.cm_measurements).length > 0 && (
                                    <>
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-2">
                                            {t('tailorComponents.measurementsCm')}
                                        </div>
                                        {Object.entries(item.cm_measurements).map(([k, v]) => (
                                            <SpecRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={`${v} cm`} />
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Custom design details */}
                        {isCustom && cd && (
                            <>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                        {t('tailorComponents.garmentSpecs')}
                                    </div>
                                    <SpecRow label={t('tailorComponents.specType')}     value={(cd.garmentType ?? cd.clothingType) ?? undefined} />
                                    <SpecRow label={t('tailorComponents.specStyle')}    value={(cd.style ?? cd.subcategory) ?? undefined} />
                                    <SpecRow label={t('tailorComponents.specFabric')}   value={cd.fabric} />
                                    <SpecRow label={t('tailorComponents.specNeckline')} value={cd.components?.neckline ?? cd.neckline} />
                                    <SpecRow label={t('tailorComponents.specSleeves')}  value={cd.components?.sleeves  ?? cd.sleeves} />
                                    <SpecRow label={t('tailorComponents.specLength')}   value={cd.components?.length   ?? cd.length} />
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                        {t('tailorComponents.colorsSection')}
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {[
                                            { labelKey: 'tailorComponents.colorBase',   color: cd.baseColor },
                                            { labelKey: 'tailorComponents.colorAccent', color: cd.accentColor ?? cd.additionalColor },
                                            { labelKey: 'tailorComponents.colorLight',  color: cd.lighterShade },
                                            { labelKey: 'tailorComponents.colorDark',   color: cd.darkerShade },
                                        ].filter(c => c.color).map(c => (
                                            <div key={c.labelKey} className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 rounded-xl border border-slate-200" style={{ backgroundColor: c.color }} />
                                                <span className="text-xs text-slate-400">{t(c.labelKey)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                        {t('tailorComponents.sizeAndMeasurements')}
                                    </div>
                                    <SpecRow label={t('tailorComponents.specStandardSize')} value={cd.sizeStandard} />
                                    {Object.entries(cd.sizeCm ?? {}).map(([k, v]) => v
                                        ? <SpecRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={`${v} cm`} />
                                        : null
                                    )}
                                    {(cd.height ?? cd.designElements?.height) && (
                                        <SpecRow label={t('tailorComponents.specHeight')} value={`${cd.height ?? cd.designElements?.height} cm`} />
                                    )}
                                </div>

                                {(cd.details ?? cd.designElements?.cuts ?? []).length > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                            {t('tailorComponents.designDetailsSection')}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(cd.details ?? cd.designElements?.cuts ?? []).map(d => (
                                                <span key={d} className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(cd.notes ?? cd.designElements?.customNotes) && (
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                            {t('tailorComponents.customNotesSection')}
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">{cd.notes ?? cd.designElements?.customNotes}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Pricing */}
                        <div className="bg-slate-900 rounded-xl p-4 text-white">
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>{t('tailorComponents.subtotal')}</span><span>₾{order.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>{t('tailorComponents.shipping')}</span><span>₾{order.shipping}</span>
                                </div>
                                <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-700">
                                    <span>{t('tailorComponents.total')}</span><span>₾{order.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status update */}
                        {onStatusChange && (
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                                    {t('tailorComponents.updateStatus')}
                                </label>
                                <select
                                    value={localStatus}
                                    onChange={e => {
                                        setLocalStatus(e.target.value as TailorOrder['status']);
                                        setSaved(false);
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                    {STATUS_OPTIONS.map(({ value, labelKey }) => (
                                        <option key={value} value={value}>{t(labelKey)}</option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={saving || localStatus === order.status}
                                        className="flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('tailorComponents.savingStatus')}</>
                                        ) : (
                                            t('tailorComponents.saveStatus')
                                        )}
                                    </Button>

                                    <AnimatePresence>
                                        {saved && (
                                            <motion.div
                                                key="saved"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-slate-900"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                {t('tailorComponents.statusSaved')}
                                            </motion.div>
                                        )}
                                        {saveError && (
                                            <motion.div
                                                key="error"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                {t('tailorComponents.saveFailed')}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Messages tab — always mounted so polling keeps running */}
                <div className={activeTab === 'messages' ? 'block' : 'hidden'}>
                    <div className="p-6">
                        <OrderChat
                            orderId={order.id}
                            currentUserId={currentUserId}
                            isVisible={activeTab === 'messages'}
                            onUnreadCountChange={setUnreadCount}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrdersList({ orders, onStatusChange }: OrdersListProps) {
    const { t, i18n } = useTranslation();
    const [viewing,  setViewing]  = useState<TailorOrder | null>(null);
    const [openTab,  setOpenTab]  = useState<'details' | 'messages'>('details');
    const [msgCounts, setMsgCounts] = useState<Record<number, number>>({});
    const currentUserId = getAuthUser()?.id ?? 0;
    const token = getAuthToken();

    // Fetch per-order message counts (from others) for unread badges on View buttons
    useEffect(() => {
        if (!token) return;
        fetch('/api/messages/counts', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
            .then(r => r.json())
            .then(d => setMsgCounts(d.counts ?? {}))
            .catch(() => {});
    }, [token]);

    // Re-read counts after modal closes (localStorage may have been updated)
    const handleClose = () => {
        setViewing(null);
        // Trigger re-render to pick up updated localStorage seen counts
        setMsgCounts(c => ({ ...c }));
    };

    const hasUnread = (orderId: number) => {
        const total = msgCounts[orderId] ?? 0;
        const seen  = parseInt(localStorage.getItem(`kere_chat_others_seen_${orderId}`) ?? '0', 10);
        return total > seen;
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900">{t('tailorComponents.ordersListTitle')}</h2>
                </div>

                {orders.length === 0 ? (
                    <div className="px-6 py-14 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-2xl">
                            📦
                        </div>
                        <p className="font-semibold text-slate-900 text-sm mb-1">{t('tailorComponents.noOrdersYet')}</p>
                        <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                            {t('tailorComponents.noOrdersDesc')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">{t('tailorComponents.orderCol')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 font-semibold hidden sm:table-cell">{t('tailorComponents.customerCol')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 font-semibold hidden md:table-cell">{t('tailorComponents.typeProductCol')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">{t('tailorComponents.statusCol')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">{t('tailorComponents.amountCol')}</th>
                                    <th className="text-left px-4 sm:px-6 py-3 font-semibold hidden lg:table-cell">{t('tailorComponents.dateCol')}</th>
                                    <th className="px-4 sm:px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, i) => {
                                    const statusClasses = STATUS_CLASSES[order.status] ?? STATUS_CLASSES.pending;
                                    const statusLabel   = t(STATUS_LABEL_KEYS[order.status] ?? STATUS_LABEL_KEYS.pending);
                                    const productLabel = order.order_type === 'custom'
                                        ? `${t('tailorComponents.customPrefix')}: ${order.custom_design_data?.garmentType ?? order.custom_design_data?.clothingType ?? '—'}`
                                        : (order.items[0]?.product_name ?? '—');
                                    const dateLabel = order.created_at
                                        ? new Date(order.created_at).toLocaleDateString(i18n.language === 'ka' ? 'ka-GE' : 'en-GB')
                                        : '—';

                                    return (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-4 sm:px-6 py-4 text-sm font-mono text-slate-500">{order.order_number}</td>
                                            <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-900 hidden sm:table-cell">{order.customer.name}</td>
                                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 max-w-[180px] truncate hidden md:table-cell">{productLabel}</td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${statusClasses}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900">₾{order.total}</td>
                                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">{dateLabel}</td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setOpenTab('details'); setViewing(order); }}
                                                        className="text-xs"
                                                    >
                                                        {t('tailorComponents.viewBtn')}
                                                    </Button>
                                                    <button
                                                        onClick={() => { setOpenTab('messages'); setViewing(order); }}
                                                        className={`relative flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                                                            hasUnread(order.id)
                                                                ? 'bg-slate-900 text-white border-slate-900'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewing && (
                    <OrderDetailModal
                        key={viewing.id}
                        order={viewing}
                        currentUserId={currentUserId}
                        initialTab={openTab}
                        onClose={handleClose}
                        onStatusChange={onStatusChange
                            ? async (id, status) => {
                                await onStatusChange(id, status);
                                setViewing(v => v ? { ...v, status: status as TailorOrder['status'] } : null);
                              }
                            : undefined
                        }
                    />
                )}
            </AnimatePresence>
        </>
    );
}
