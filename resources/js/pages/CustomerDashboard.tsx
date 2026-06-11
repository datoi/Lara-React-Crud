import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
    ShoppingBag, Package, Clock, CheckCircle, Truck, X,
    ChevronRight, User, Scissors, MessageCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAuthToken, getAuthUser, clearAuth } from '../hooks/useAuth';
import { NotificationBell } from '../components/NotificationBell';
import { ReviewModal } from '../components/ReviewModal';
import { OrderChat } from '../components/OrderChat';
import { OrderCardSkeleton } from '../components/skeletons/OrderCardSkeleton';

interface OrderItem {
    id: number;
    product_id: number | null;
    product_name: string;
    image: string | null;
    color: string | null;
    size: string | null;
    quantity: number;
    price: number;
    measurements: Record<string, string>;
}

// Supports both old shape (clothingType/subcategory) and new DesignConfig shape (garmentType/style)
interface DesignData {
    // new shape
    garmentType?: string;
    style?: string;
    accentColor?: string;
    components?: { neckline?: string; sleeves?: string; length?: string };
    details?: string[];
    notes?: string;
    // old shape (kept for backward-compat with existing orders)
    clothingType?: string;
    subcategory?: string;
    fabric?: string;
    sizeStandard?: string;
    baseColor?: string;
    lighterShade?: string;
    darkerShade?: string;
    additionalColor?: string;
    designElements?: { customNotes?: string };
}

interface CustomerOrder {
    id: number;
    order_type: 'marketplace' | 'custom';
    status: string;
    total: number;
    tailor_id: number | null;
    tailor_name: string | null;
    custom_design_data: DesignData | null;
    items: OrderItem[];
    created_at: string;
    has_review: boolean;
}

const STATUS_CONFIG: Record<string, { labelKey: string; color: string; icon: typeof Package }> = {
    pending:    { labelKey: 'customerDashboard.statusPending',    color: 'bg-slate-100 text-slate-600',  icon: Clock },
    processing: { labelKey: 'customerDashboard.statusInProgress', color: 'bg-slate-100 text-slate-700',  icon: Scissors },
    shipped:    { labelKey: 'customerDashboard.statusShipped',    color: 'bg-slate-100 text-slate-700',  icon: Truck },
    finished:   { labelKey: 'customerDashboard.statusFinished',   color: 'bg-slate-900 text-white',      icon: CheckCircle },
    delivered:  { labelKey: 'customerDashboard.statusDelivered',  color: 'bg-slate-900 text-white',      icon: CheckCircle },
    cancelled:  { labelKey: 'customerDashboard.statusCancelled',  color: 'bg-slate-200 text-slate-600',  icon: X },
};

function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslation();
    const cfg = STATUS_CONFIG[status] ?? { labelKey: status, color: 'bg-slate-100 text-slate-600', icon: Package };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {STATUS_CONFIG[status] ? t(cfg.labelKey) : status}
        </span>
    );
}

function OrderDetailModal({ order, currentUserId, onClose, initialTab = 'details' }: { order: CustomerOrder; currentUserId: number; onClose: () => void; initialTab?: 'details' | 'messages' }) {
    const { t } = useTranslation();
    const isCustom = order.order_type === 'custom';
    const design = order.custom_design_data;
    const [activeTab, setActiveTab] = useState<'details' | 'messages'>(initialTab);
    const [unreadCount, setUnreadCount] = useState(0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                        <h3 className="font-semibold text-slate-900">{t('customerDashboard.orderHash', { id: order.id })}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
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
                    <div className="p-5 space-y-5">
                        <div className="flex items-center justify-between">
                            <StatusBadge status={order.status} />
                            {order.tailor_name && (
                                <span className="text-xs text-slate-500">{t('customerDashboard.by')} <span className="font-medium text-slate-700">{order.tailor_name}</span></span>
                            )}
                        </div>

                        {isCustom && design ? (
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('customerDashboard.customDesignLabel')}</p>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                        {(design.garmentType ?? design.clothingType) && (
                                            <><span className="text-slate-500">{t('customerDashboard.typeLabel')}</span><span className="font-medium text-slate-900 capitalize">{design.garmentType ?? design.clothingType}</span></>
                                        )}
                                        {(design.style ?? design.subcategory) && (
                                            <><span className="text-slate-500">{t('customerDashboard.styleLabel')}</span><span className="font-medium text-slate-900">{design.style ?? design.subcategory}</span></>
                                        )}
                                        {design.fabric && (
                                            <><span className="text-slate-500">{t('customerDashboard.fabricLabel')}</span><span className="font-medium text-slate-900">{design.fabric}</span></>
                                        )}
                                        {design.sizeStandard && (
                                            <><span className="text-slate-500">{t('customerDashboard.sizeLabel')}</span><span className="font-medium text-slate-900">{design.sizeStandard}</span></>
                                        )}
                                    </div>
                                </div>

                                {(design.baseColor || design.accentColor || design.lighterShade) && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('customerDashboard.colorPalette')}</p>
                                        <div className="flex gap-2">
                                            {[
                                                { label: t('customerDashboard.colorBase'),   color: design.baseColor },
                                                { label: t('customerDashboard.colorAccent'), color: design.accentColor ?? design.additionalColor },
                                                { label: t('customerDashboard.colorLight'),  color: design.lighterShade },
                                                { label: t('customerDashboard.colorDark'),   color: design.darkerShade },
                                            ].filter(c => c.color).map(c => (
                                                <div key={c.label} className="flex flex-col items-center gap-1">
                                                    <div className="w-10 h-10 rounded-lg border border-slate-200" style={{ backgroundColor: c.color }} />
                                                    <span className="text-xs text-slate-400">{c.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(design.notes ?? design.designElements?.customNotes) && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('customerDashboard.tailorNotes')}</p>
                                        <p className="text-sm text-slate-600">{design.notes ?? design.designElements?.customNotes}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex gap-3 bg-slate-50 rounded-xl p-3">
                                        <div className="w-14 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">👗</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 text-sm">{item.product_name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {[item.color && t('customerDashboard.colorLabel', { color: item.color }), item.size && t('customerDashboard.sizeShort', { size: item.size }), t('customerDashboard.qty', { qty: item.quantity })].filter(Boolean).join(' · ')}
                                            </p>
                                            {item.measurements && Object.keys(item.measurements).length > 0 && (
                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                    {Object.entries(item.measurements).map(([k, v]) => (
                                                        <span key={k} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                                            {k}: {v}cm
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-bold text-slate-900 text-sm">₾{item.price}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                            <span className="text-sm text-slate-500">{t('customerDashboard.totalLabel')}</span>
                            <span className="text-lg font-bold text-slate-900">
                                {order.total > 0 ? `₾${order.total}` : t('customerDashboard.quotedByTailor')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages tab — always mounted so polling keeps running */}
                <div className={activeTab === 'messages' ? 'block' : 'hidden'}>
                    <div className="p-5">
                        <OrderChat
                            orderId={order.id}
                            currentUserId={currentUserId}
                            isVisible={activeTab === 'messages'}
                            onUnreadCountChange={setUnreadCount}
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function CustomerDashboard() {
    const { t } = useTranslation();
    const navigate  = useNavigate();
    const user      = getAuthUser();
    const token     = getAuthToken();
    const [orders, setOrders]           = useState<CustomerOrder[]>([]);
    const [loading, setLoading]         = useState(true);
    const [fetchError, setFetchError]   = useState(false);
    const [retryKey, setRetryKey]       = useState(0);
    const [selectedOrder, setSelected]  = useState<CustomerOrder | null>(null);
    const [openTab, setOpenTab]         = useState<'details' | 'messages'>('details');
    const [reviewOrder, setReviewOrder] = useState<CustomerOrder | null>(null);
    const [msgCounts, setMsgCounts]     = useState<Record<number, number>>({});

    useEffect(() => {
        if (!token) { navigate('/login/customer'); return; }
        setLoading(true);
        setFetchError(false);
        fetch('/api/customer/orders', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
            .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
            .then(d => { setOrders(d.orders ?? []); setLoading(false); })
            .catch(() => { setFetchError(true); setLoading(false); });
    }, [token, navigate, retryKey]);

    useEffect(() => {
        if (!token) return;
        fetch('/api/messages/counts', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
            .then(r => r.json())
            .then(d => setMsgCounts(d.counts ?? {}))
            .catch(() => {});
    }, [token]);

    const hasUnread = (orderId: number) => {
        const total = msgCounts[orderId] ?? 0;
        const seen  = parseInt(localStorage.getItem(`kere_chat_others_seen_${orderId}`) ?? '0', 10);
        return total > seen;
    };

    const handleCloseOrder = () => {
        setSelected(null);
        setMsgCounts(c => ({ ...c }));
    };

    const handleSignOut = () => { clearAuth(); navigate('/'); };

    const stats = {
        total:      orders.length,
        pending:    orders.filter(o => o.status === 'pending').length,
        inProgress: orders.filter(o => o.status === 'processing').length,
        delivered:  orders.filter(o => ['shipped', 'finished', 'delivered'].includes(o.status)).length,
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>{t('customerDashboard.pageTitle')}</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-white border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <div className="flex items-center gap-2">
                        {user && (
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                                <span className="font-medium hidden sm:inline">{user.first_name} {user.last_name}</span>
                            </div>
                        )}
                        <NotificationBell />
                        <button
                            onClick={handleSignOut}
                            className="text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            {t('customerDashboard.signOut')}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-7">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {user?.first_name ? `${user.first_name} ${user.last_name ?? ''}` : t('customerDashboard.myDashboard')}
                            </h1>
                            <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {[
                        { label: t('customerDashboard.statTotalOrders'), value: stats.total,      icon: ShoppingBag },
                        { label: t('customerDashboard.statPending'),      value: stats.pending,    icon: Clock },
                        { label: t('customerDashboard.statInProgress'),   value: stats.inProgress, icon: Scissors },
                        { label: t('customerDashboard.statDelivered'),    value: stats.delivered,  icon: CheckCircle },
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500">{stat.label}</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Orders list */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50">
                        <h2 className="font-semibold text-slate-900">{t('customerDashboard.myOrders')}</h2>
                    </div>

                    {loading ? (
                        <div className="px-5 py-4 space-y-2">
                            {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
                        </div>
                    ) : fetchError ? (
                        <div className="py-12 text-center px-5">
                            <p className="text-slate-500 font-medium mb-2">{t('customerDashboard.failedToLoad')}</p>
                            <p className="text-slate-400 text-sm mb-4">{t('customerDashboard.failedToLoadHint')}</p>
                            <button
                                onClick={() => setRetryKey(k => k + 1)}
                                className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                {t('customerDashboard.retry')}
                            </button>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-16 text-center">
                            <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-600 font-medium mb-1">{t('customerDashboard.noOrdersYet')}</p>
                            <p className="text-slate-400 text-sm mb-4">{t('customerDashboard.noOrdersHint')}</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                <Link
                                    to="/marketplace"
                                    className="inline-flex items-center gap-1.5 text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    {t('customerDashboard.browseMarketplace')}
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    to="/design"
                                    className="inline-flex items-center gap-1.5 text-sm border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    {t('customerDashboard.designYourOwn')}
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {orders.map((order, i) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => { setOpenTab('details'); setSelected(order); }}
                                >
                                    {/* Icon */}
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {order.order_type === 'custom'
                                            ? <Scissors className="w-5 h-5 text-slate-600" />
                                            : <Package className="w-5 h-5 text-slate-600" />
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 text-sm truncate">
                                            {order.order_type === 'custom'
                                                ? `${t('customerDashboard.customPrefix')} ${String((order.custom_design_data as Record<string, unknown>)?.garmentType ?? (order.custom_design_data as Record<string, unknown>)?.clothingType ?? t('customerDashboard.customDesignLabel'))}`
                                                : order.items[0]?.product_name ?? t('customerDashboard.orderFallback')
                                            }
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {order.tailor_name && (
                                                <>
                                                    {' · '}
                                                    {order.tailor_id ? (
                                                        <Link
                                                            to={`/tailor/${order.tailor_id}`}
                                                            onClick={e => e.stopPropagation()}
                                                            className="hover:text-slate-700 hover:underline transition-colors"
                                                        >
                                                            {order.tailor_name}
                                                        </Link>
                                                    ) : order.tailor_name}
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* Message button */}
                                    <button
                                        onClick={e => { e.stopPropagation(); setOpenTab('messages'); setSelected(order); }}
                                        className={`relative flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                                            hasUnread(order.id)
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">{t('customerDashboard.messageBtn')}</span>
                                        {hasUnread(order.id) && (
                                            <span className="w-1.5 h-1.5 bg-white rounded-full sm:hidden" />
                                        )}
                                    </button>

                                    {/* Status + price + review */}
                                    <div className="flex flex-col items-end gap-1.5">
                                        <StatusBadge status={order.status} />
                                        <span className="text-sm font-bold text-slate-900">
                                            {order.total > 0 ? `₾${order.total}` : t('customerDashboard.tbd')}
                                        </span>
                                        {['finished', 'shipped'].includes(order.status) && !order.has_review && (
                                            <button
                                                onClick={e => { e.stopPropagation(); setReviewOrder(order); }}
                                                className="text-[10px] font-medium text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 hover:bg-slate-50 transition-colors"
                                            >
                                                {t('customerDashboard.review')}
                                            </button>
                                        )}
                                        {['finished', 'shipped'].includes(order.status) && order.has_review && (
                                            <span className="text-[10px] text-slate-500 font-medium">{t('customerDashboard.reviewed')}</span>
                                        )}
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick actions */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                        to="/marketplace"
                        className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 hover:bg-slate-50 hover:border-slate-200 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                            <ShoppingBag className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 text-sm">{t('customerDashboard.browseMarketplace')}</p>
                            <p className="text-xs text-slate-400">{t('customerDashboard.findDesigns')}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                    </Link>
                    <Link
                        to="/design"
                        className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 hover:bg-slate-50 hover:border-slate-200 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                            <Scissors className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 text-sm">{t('customerDashboard.createCustomDesign')}</p>
                            <p className="text-xs text-slate-400">{t('customerDashboard.designYourGarment')}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                    </Link>
                </div>
            </div>

            {/* Order detail modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        currentUserId={user?.id ?? 0}
                        initialTab={openTab}
                        onClose={handleCloseOrder}
                    />
                )}
            </AnimatePresence>

            {/* Review modal */}
            {reviewOrder && (
                <ReviewModal
                    open={true}
                    orderId={reviewOrder.id}
                    orderLabel={
                        reviewOrder.order_type === 'custom'
                            ? `${t('customerDashboard.customPrefix')} ${String((reviewOrder.custom_design_data as Record<string, unknown>)?.garmentType ?? (reviewOrder.custom_design_data as Record<string, unknown>)?.clothingType ?? t('customerDashboard.customDesignLabel'))}`
                            : reviewOrder.items[0]?.product_name ?? t('customerDashboard.orderFallback')
                    }
                    onClose={() => setReviewOrder(null)}
                    onSubmitted={() => setOrders(prev =>
                        prev.map(o => o.id === reviewOrder.id ? { ...o, has_review: true } : o)
                    )}
                />
            )}
        </div>
    );
}
