import { useState, useEffect, useCallback, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Users, Package, ShieldAlert, LogOut, CheckCircle, Scissors, Clock, X, MessageCircle } from 'lucide-react';
import { getAuthUser, getAuthToken, clearAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { OrderChat } from '../components/OrderChat';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOrder {
    id: number;
    order_number: string;
    order_type: 'marketplace' | 'custom';
    status: string;
    total: number;
    created_at: string;
    tailor_assignment_mode: string;
    customer: { id: number; name: string; email: string } | null;
    tailor:   { id: number; name: string } | null;
    items:    { id: number; product_name: string; quantity: number; price: number }[];
    message_count: number;
}

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
    is_suspended: boolean;
    created_at: string;
}

interface AssignSlot {
    tailorId: string;
    saving:   boolean;
    saved:    boolean;
}

interface PendingTailor {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
    pending:    'bg-slate-100 text-slate-600 border-slate-200',
    processing: 'bg-slate-100 text-slate-700 border-slate-200',
    shipped:    'bg-slate-50 text-slate-700 border-slate-200',
    finished:   'bg-slate-900 text-white border-slate-900',
    delivered:  'bg-slate-900 text-white border-slate-900',
    cancelled:  'bg-slate-200 text-slate-600 border-slate-300',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
    pending:    'adminDashboard.statusPending',
    processing: 'adminDashboard.statusProcessing',
    shipped:    'adminDashboard.statusShipped',
    finished:   'adminDashboard.statusFinished',
    delivered:  'adminDashboard.statusDelivered',
    cancelled:  'adminDashboard.statusCancelled',
};

function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslation();
    const cls = STATUS_CLASSES[status] ?? 'bg-slate-50 text-slate-600 border-slate-200';
    const labelKey = STATUS_LABEL_KEYS[status];
    return (
        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>
            {labelKey ? t(labelKey) : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { t }  = useTranslation();
    const navigate = useNavigate();
    const user     = getAuthUser();
    const token    = getAuthToken();

    const [tab,     setTab]     = useState<'orders' | 'users' | 'unassigned' | 'pending_tailors'>('orders');
    const [orders,  setOrders]  = useState<AdminOrder[]>([]);
    const [users,   setUsers]   = useState<AdminUser[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingUsers,  setLoadingUsers]  = useState(true);

    const [assignMap, setAssignMap] = useState<Record<number, AssignSlot>>({});
    const [suspendingId, setSuspendingId] = useState<number | null>(null);
    const [openChatOrderId, setOpenChatOrderId] = useState<number | null>(null);

    const [pendingTailors,   setPendingTailors]   = useState<PendingTailor[]>([]);
    const [loadingPending,   setLoadingPending]   = useState(true);
    const [approvingId,      setApprovingId]      = useState<number | null>(null);
    const [rejectingId,      setRejectingId]      = useState<number | null>(null);
    const [rejectReasons,    setRejectReasons]    = useState<Record<number, string>>({});
    const [rejectOpen,       setRejectOpen]       = useState<number | null>(null);

    const tailors = users.filter(u => u.role === 'tailor');

    useEffect(() => {
        if (!token || user?.role !== 'admin') navigate('/admin/login', { replace: true });
    }, [token, user, navigate]);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/orders', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) return;
            const data = await res.json();
            const list: AdminOrder[] = data.orders ?? [];
            setOrders(list);
            setAssignMap(prev => {
                const next = { ...prev };
                list.forEach(o => {
                    if (!next[o.id]) {
                        next[o.id] = { tailorId: String(o.tailor?.id ?? ''), saving: false, saved: false };
                    }
                });
                return next;
            });
        } finally {
            setLoadingOrders(false);
        }
    }, [token]);

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (res.ok) setUsers((await res.json()).users ?? []);
        } finally {
            setLoadingUsers(false);
        }
    }, [token]);

    const fetchPendingTailors = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/admin/tailors/pending', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (res.ok) setPendingTailors((await res.json()).tailors ?? []);
        } finally {
            setLoadingPending(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
        fetchUsers();
        fetchPendingTailors();
    }, [fetchOrders, fetchUsers, fetchPendingTailors]);

    const handleApprove = async (id: number) => {
        if (!token) return;
        setApprovingId(id);
        try {
            const res = await fetch(`/api/admin/tailors/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (res.ok) setPendingTailors(prev => prev.filter(t => t.id !== id));
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!token) return;
        setRejectingId(id);
        try {
            const res = await fetch(`/api/admin/tailors/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({ reason: rejectReasons[id] ?? '' }),
            });
            if (res.ok) {
                setPendingTailors(prev => prev.filter(t => t.id !== id));
                setRejectOpen(null);
            }
        } finally {
            setRejectingId(null);
        }
    };

    const handleAssign = async (orderId: number) => {
        const slot = assignMap[orderId];
        if (!slot?.tailorId || !token) return;

        setAssignMap(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: true, saved: false } }));

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ tailor_id: Number(slot.tailorId) }),
            });
            if (!res.ok) return;
            const data = await res.json();
            setOrders(prev => prev.map(o => o.id === orderId ? {
                ...o,
                tailor:  data.tailor,
                status:  data.status ?? o.status,
            } : o));
            setAssignMap(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: false, saved: true } }));
            setTimeout(() => {
                setAssignMap(prev => ({ ...prev, [orderId]: { ...prev[orderId], saved: false } }));
            }, 3000);
        } catch {
            setAssignMap(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: false } }));
        }
    };

    const handleSuspend = async (userId: number) => {
        if (!token) return;
        setSuspendingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) return;
            const data = await res.json();
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: data.is_suspended } : u));
        } finally {
            setSuspendingId(null);
        }
    };

    const handleSignOut = () => { clearAuth(); navigate('/'); };

    const unassignedOrders = orders.filter(o => o.status === 'pending_assignment');

    const stats = [
        { labelKey: 'adminDashboard.statTotalOrders', value: orders.length,                            icon: Package },
        { labelKey: 'adminDashboard.statUnassigned',  value: unassignedOrders.length,                  icon: Package },
        { labelKey: 'adminDashboard.statTailors',     value: tailors.length,                           icon: Users },
        { labelKey: 'adminDashboard.statSuspended',   value: users.filter(u => u.is_suspended).length, icon: ShieldAlert },
    ];

    const tabs = (['orders', 'unassigned', 'pending_tailors', 'users'] as const);
    const tabLabels: Record<string, string> = {
        orders:          t('adminDashboard.tabOrders'),
        unassigned:      t('adminDashboard.tabUnassigned'),
        pending_tailors: t('adminDashboard.tabPendingTailors'),
        users:           t('adminDashboard.tabUsers'),
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>{t('adminDashboard.pageTitle')}</title>
                <meta name="robots" content="noindex" />
            </Helmet>

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-40 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                            Kere
                        </Link>
                        <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full tracking-wide uppercase">
                            {t('adminDashboard.adminBadge')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/admin/customizer"
                            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <Scissors className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('adminDashboard.designStudio')}</span>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <ShieldAlert className="w-4 h-4 text-slate-400" />
                            <span className="hidden sm:inline font-medium">
                                {user?.first_name} {user?.last_name}
                            </span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('adminDashboard.signOut')}</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('adminDashboard.platformControl')}</h1>
                    <p className="text-slate-500 mt-1 text-sm">{t('adminDashboard.manageDesc')}</p>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {stats.map(stat => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.labelKey}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-slate-100 p-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500">{t(stat.labelKey)}</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-2">
                    {tabs.map(tabKey => (
                        <button
                            key={tabKey}
                            onClick={() => setTab(tabKey)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                tab === tabKey
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {tabLabels[tabKey]}
                            {tabKey === 'unassigned' && unassignedOrders.length > 0 && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'unassigned' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-700'}`}>
                                    {unassignedOrders.length}
                                </span>
                            )}
                            {tabKey === 'pending_tailors' && pendingTailors.length > 0 && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'pending_tailors' ? 'bg-white text-slate-900' : 'bg-brand text-white'}`}>
                                    {pendingTailors.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Orders table ── */}
                {tab === 'orders' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">{t('adminDashboard.allOrders')}</h2>
                            <span className="text-xs text-slate-400">{t('adminDashboard.total', { n: orders.length })}</span>
                        </div>

                        {loadingOrders ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.loading')}</div>
                        ) : orders.length === 0 ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.noOrders')}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colOrderNum')}</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">{t('adminDashboard.colCustomer')}</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">{t('adminDashboard.colItems')}</th>
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colStatus')}</th>
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colAssignTailor')}</th>
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colChat')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, i) => {
                                            const slot    = assignMap[order.id] ?? { tailorId: '', saving: false, saved: false };
                                            const changed = slot.tailorId !== String(order.tailor?.id ?? '');
                                            const chatOpen = openChatOrderId === order.id;
                                            const canViewChat = !!order.tailor && order.message_count > 0;

                                            return (
                                                <Fragment key={order.id}>
                                                <motion.tr
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.025 }}
                                                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-mono text-slate-500">{order.order_number}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{order.created_at}</p>
                                                    </td>
                                                    <td className="px-6 py-4 hidden sm:table-cell">
                                                        <p className="text-sm font-medium text-slate-900">{order.customer?.name ?? '—'}</p>
                                                        <p className="text-xs text-slate-400">{order.customer?.email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell">
                                                        <p className="text-xs text-slate-600 max-w-[200px] truncate">
                                                            {order.items.length > 0
                                                                ? order.items.map(it => `${it.product_name} ×${it.quantity}`).join(', ')
                                                                : order.order_type === 'custom' ? t('adminDashboard.customDesign') : '—'
                                                            }
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={order.status} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <select
                                                                value={slot.tailorId}
                                                                onChange={e => setAssignMap(prev => ({
                                                                    ...prev,
                                                                    [order.id]: { ...prev[order.id], tailorId: e.target.value, saved: false },
                                                                }))}
                                                                disabled={slot.saving || tailors.length === 0}
                                                                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                                                            >
                                                                <option value="">{t('adminDashboard.selectTailor')}</option>
                                                                {tailors.map(tl => (
                                                                    <option key={tl.id} value={String(tl.id)}>{tl.name}</option>
                                                                ))}
                                                            </select>

                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleAssign(order.id)}
                                                                disabled={!changed || !slot.tailorId || slot.saving}
                                                                className="h-7 px-3 text-xs"
                                                            >
                                                                {slot.saving ? t('adminDashboard.saving') : t('adminDashboard.assign')}
                                                            </Button>

                                                            {slot.saved && (
                                                                <span className="flex items-center gap-1 text-xs text-slate-900 font-medium">
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    {t('adminDashboard.saved')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {order.tailor && (
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                {t('adminDashboard.current', { name: order.tailor.name })}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setOpenChatOrderId(chatOpen ? null : order.id)}
                                                            disabled={!canViewChat}
                                                            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            {order.message_count > 0 ? t('adminDashboard.viewChat', { n: order.message_count }) : t('adminDashboard.noChat')}
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                                {chatOpen && order.tailor && (
                                                    <tr className="border-b border-slate-50 bg-slate-50/60">
                                                        <td colSpan={6} className="px-6 py-4">
                                                            <OrderChat
                                                                orderId={order.id}
                                                                currentUserId={order.tailor.id}
                                                                endpoint={`/api/admin/orders/${order.id}/messages`}
                                                                readOnly
                                                                showSenderLabels
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Unassigned orders ── */}
                {tab === 'unassigned' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">{t('adminDashboard.unassignedOrders')}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{t('adminDashboard.unassignedDesc')}</p>
                            </div>
                            <span className="text-xs text-slate-400">{t('adminDashboard.total', { n: unassignedOrders.length })}</span>
                        </div>

                        {loadingOrders ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.loading')}</div>
                        ) : unassignedOrders.length === 0 ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.noUnassigned')}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colOrderNum')}</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">{t('adminDashboard.colCustomer')}</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">{t('adminDashboard.colDesign')}</th>
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colAssignTailor')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unassignedOrders.map((order, i) => {
                                            const slot    = assignMap[order.id] ?? { tailorId: '', saving: false, saved: false };
                                            const changed = slot.tailorId !== String(order.tailor?.id ?? '');

                                            return (
                                                <motion.tr
                                                    key={order.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.025 }}
                                                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-mono text-slate-500">{order.order_number}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{order.created_at}</p>
                                                    </td>
                                                    <td className="px-6 py-4 hidden sm:table-cell">
                                                        <p className="text-sm font-medium text-slate-900">{order.customer?.name ?? '—'}</p>
                                                        <p className="text-xs text-slate-400">{order.customer?.email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell">
                                                        <p className="text-xs text-slate-600 max-w-[200px] truncate">
                                                            {t('adminDashboard.customDesign')}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <select
                                                                value={slot.tailorId}
                                                                onChange={e => setAssignMap(prev => ({
                                                                    ...prev,
                                                                    [order.id]: { ...prev[order.id], tailorId: e.target.value, saved: false },
                                                                }))}
                                                                disabled={slot.saving || tailors.length === 0}
                                                                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                                                            >
                                                                <option value="">{t('adminDashboard.selectTailor')}</option>
                                                                {tailors.map(tl => (
                                                                    <option key={tl.id} value={String(tl.id)}>{tl.name}</option>
                                                                ))}
                                                            </select>

                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleAssign(order.id)}
                                                                disabled={!changed || !slot.tailorId || slot.saving}
                                                                className="h-7 px-3 text-xs"
                                                            >
                                                                {slot.saving ? t('adminDashboard.saving') : t('adminDashboard.assign')}
                                                            </Button>

                                                            {slot.saved && (
                                                                <span className="flex items-center gap-1 text-xs text-slate-900 font-medium">
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    {t('adminDashboard.saved')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Pending tailors ── */}
                {tab === 'pending_tailors' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">{t('adminDashboard.pendingTailors')}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{t('adminDashboard.pendingTailorsDesc')}</p>
                            </div>
                            <span className="text-xs text-slate-400">{t('adminDashboard.total', { n: pendingTailors.length })}</span>
                        </div>

                        {loadingPending ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.loading')}</div>
                        ) : pendingTailors.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-400">{t('adminDashboard.noPendingTailors')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {pendingTailors.map((tailor, i) => (
                                    <motion.div
                                        key={tailor.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="px-6 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{tailor.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{tailor.email}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{t('adminDashboard.colApplied')}: {tailor.created_at}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {rejectOpen !== tailor.id ? (
                                                    <>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => handleApprove(tailor.id)}
                                                            disabled={approvingId === tailor.id || rejectingId === tailor.id}
                                                            className="h-8 px-4 text-xs"
                                                        >
                                                            {approvingId === tailor.id ? t('adminDashboard.approving') : t('adminDashboard.approve')}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setRejectOpen(tailor.id)}
                                                            disabled={approvingId === tailor.id}
                                                            className="h-8 px-4 text-xs text-slate-600"
                                                        >
                                                            {t('adminDashboard.reject')}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setRejectOpen(null)}
                                                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {rejectOpen === tailor.id && (
                                            <div className="mt-3 space-y-2">
                                                <textarea
                                                    rows={2}
                                                    placeholder={t('adminDashboard.rejectReasonPlaceholder')}
                                                    value={rejectReasons[tailor.id] ?? ''}
                                                    onChange={e => setRejectReasons(prev => ({ ...prev, [tailor.id]: e.target.value }))}
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleReject(tailor.id)}
                                                    disabled={rejectingId === tailor.id}
                                                    className="h-8 px-4 text-xs"
                                                >
                                                    {rejectingId === tailor.id ? t('adminDashboard.rejecting') : t('adminDashboard.confirmReject')}
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Users table ── */}
                {tab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">{t('adminDashboard.allUsers')}</h2>
                            <span className="text-xs text-slate-400">{t('adminDashboard.total', { n: users.length })}</span>
                        </div>

                        {loadingUsers ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.loading')}</div>
                        ) : users.length === 0 ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.noUsers')}</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colName')}</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">{t('adminDashboard.colEmail')}</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">{t('adminDashboard.colJoined')}</th>
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colRole')}</th>
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colUserStatus')}</th>
                                            <th className="text-left px-6 py-3 font-semibold">{t('adminDashboard.colAction')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u, i) => (
                                            <motion.tr
                                                key={u.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.025 }}
                                                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">{u.name}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{u.email}</td>
                                                <td className="px-6 py-4 text-xs text-slate-400 hidden md:table-cell">{u.created_at}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${
                                                        u.role === 'tailor'  ? 'bg-slate-800 text-white border-slate-700' :
                                                        u.role === 'admin'   ? 'bg-slate-900 text-white border-slate-900' :
                                                                               'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {t(`adminDashboard.role${u.role.charAt(0).toUpperCase()}${u.role.slice(1)}`) || u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.is_suspended ? (
                                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-200 text-slate-700 border-slate-300">
                                                            {t('adminDashboard.suspended')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-50 text-slate-900 border-slate-200">
                                                            {t('adminDashboard.active')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.role !== 'admin' && (
                                                        <Button
                                                            variant={u.is_suspended ? 'outline' : 'destructive'}
                                                            size="sm"
                                                            onClick={() => handleSuspend(u.id)}
                                                            disabled={suspendingId === u.id}
                                                            className="text-xs h-7"
                                                        >
                                                            {suspendingId === u.id
                                                                ? t('adminDashboard.saving')
                                                                : u.is_suspended ? t('adminDashboard.reinstate') : t('adminDashboard.suspend')}
                                                        </Button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
