import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Users, Package, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';
import { getAuthUser, getAuthToken, clearAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOrder {
    id: number;
    order_number: string;
    order_type: 'marketplace' | 'custom';
    status: string;
    total: number;
    created_at: string;
    customer: { id: number; name: string; email: string } | null;
    tailor:   { id: number; name: string } | null;
    items:    { id: number; product_name: string; quantity: number; price: number }[];
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

// ─── Status badge (matches existing palette) ─────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
    pending:    'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped:    'bg-slate-50 text-slate-700 border-slate-200',
    finished:   'bg-green-50 text-green-700 border-green-200',
    delivered:  'bg-green-50 text-green-700 border-green-200',
    cancelled:  'bg-red-50 text-red-700 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
    const cls = STATUS_CLASSES[status] ?? 'bg-slate-50 text-slate-600 border-slate-200';
    return (
        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user     = getAuthUser();
    const token    = getAuthToken();

    const [tab,     setTab]     = useState<'orders' | 'users'>('orders');
    const [orders,  setOrders]  = useState<AdminOrder[]>([]);
    const [users,   setUsers]   = useState<AdminUser[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingUsers,  setLoadingUsers]  = useState(true);

    // Per-row tailor assignment state
    const [assignMap, setAssignMap] = useState<Record<number, AssignSlot>>({});
    // The user ID currently being suspended/reinstated
    const [suspendingId, setSuspendingId] = useState<number | null>(null);

    const tailors = users.filter(u => u.role === 'tailor');

    // ── Auth guard ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token || user?.role !== 'admin') navigate('/');
    }, [token, user, navigate]);

    // ── Fetch orders ─────────────────────────────────────────────────────────
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
            // Seed the assign map once from server state
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

    // ── Fetch users ──────────────────────────────────────────────────────────
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

    useEffect(() => {
        fetchOrders();
        fetchUsers();
    }, [fetchOrders, fetchUsers]);

    // ── Assign tailor ────────────────────────────────────────────────────────
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
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tailor: data.tailor } : o));
            setAssignMap(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: false, saved: true } }));
            setTimeout(() => {
                setAssignMap(prev => ({ ...prev, [orderId]: { ...prev[orderId], saved: false } }));
            }, 3000);
        } catch {
            setAssignMap(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: false } }));
        }
    };

    // ── Suspend / reinstate ──────────────────────────────────────────────────
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

    const stats = [
        { label: 'Total Orders', value: orders.length,                         icon: Package },
        { label: 'Total Users',  value: users.length,                          icon: Users },
        { label: 'Tailors',      value: tailors.length,                        icon: Users },
        { label: 'Suspended',    value: users.filter(u => u.is_suspended).length, icon: ShieldAlert },
    ];

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>Admin Dashboard | Kere</title>
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
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
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
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Platform Control</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage orders, users, and tailor assignments.</p>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {stats.map(stat => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-slate-100 p-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500">{stat.label}</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-2">
                    {(['orders', 'users'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                                tab === t
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {t}
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
                            <h2 className="font-bold text-slate-900">All Orders</h2>
                            <span className="text-xs text-slate-400">{orders.length} total</span>
                        </div>

                        {loadingOrders ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">Loading…</div>
                        ) : orders.length === 0 ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">No orders yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                            <th className="text-left px-6 py-3 font-semibold">Order #</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Customer</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Items</th>
                                            <th className="text-left px-6 py-3 font-semibold">Status</th>
                                            <th className="text-left px-6 py-3 font-semibold">Assign Tailor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, i) => {
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
                                                            {order.items.length > 0
                                                                ? order.items.map(it => `${it.product_name} ×${it.quantity}`).join(', ')
                                                                : order.order_type === 'custom' ? 'Custom design' : '—'
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
                                                                <option value="">— Select tailor —</option>
                                                                {tailors.map(t => (
                                                                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                                                                ))}
                                                            </select>

                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleAssign(order.id)}
                                                                disabled={!changed || !slot.tailorId || slot.saving}
                                                                className="h-7 px-3 text-xs"
                                                            >
                                                                {slot.saving ? 'Saving…' : 'Assign'}
                                                            </Button>

                                                            {slot.saved && (
                                                                <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    Saved
                                                                </span>
                                                            )}
                                                        </div>
                                                        {order.tailor && (
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                Current: {order.tailor.name}
                                                            </p>
                                                        )}
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

                {/* ── Users table ── */}
                {tab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">All Users</h2>
                            <span className="text-xs text-slate-400">{users.length} total</span>
                        </div>

                        {loadingUsers ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">Loading…</div>
                        ) : users.length === 0 ? (
                            <div className="px-6 py-14 text-center text-sm text-slate-400">No users yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                            <th className="text-left px-6 py-3 font-semibold">Name</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Email</th>
                                            <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Joined</th>
                                            <th className="text-left px-6 py-3 font-semibold">Role</th>
                                            <th className="text-left px-6 py-3 font-semibold">Status</th>
                                            <th className="text-left px-6 py-3 font-semibold">Action</th>
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
                                                        u.role === 'tailor'  ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                                        u.role === 'admin'   ? 'bg-slate-900 text-white border-slate-900' :
                                                                               'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.is_suspended ? (
                                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                                                            Suspended
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
                                                            Active
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
                                                                ? '…'
                                                                : u.is_suspended ? 'Reinstate' : 'Suspend'}
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
