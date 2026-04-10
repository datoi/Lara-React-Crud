import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Package, Scissors, X } from 'lucide-react';
import { getAuthToken } from '../hooks/useAuth';

interface KereNotification {
    id: number;
    type: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
    data: Record<string, unknown> | null;
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function CustomerNotifications() {
    const token = getAuthToken();
    const [notifications, setNotifications] = useState<KereNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState<number | null>(null);

    useEffect(() => {
        if (!token) { setLoading(false); return; }
        fetch('/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        })
            .then(r => r.json())
            .then(data => setNotifications(data.notifications ?? []))
            .finally(() => setLoading(false));
    }, [token]);

    const clearOne = async (id: number) => {
        setClearing(id);
        await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        setNotifications(prev => prev.filter(n => n.id !== id));
        setClearing(null);
    };

    if (!token) return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <Bell className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-900">Notifications</h2>
                {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {notifications.filter(n => !n.is_read).length}
                    </span>
                )}
            </div>

            {/* Body */}
            {loading ? (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No notifications yet</p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-50">
                    <AnimatePresence initial={false}>
                        {notifications.map(n => {
                            const Icon = n.type === 'new_order' ? Scissors : Package;
                            return (
                                <motion.li
                                    key={n.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className={`flex items-start gap-3 px-6 py-4 ${!n.is_read ? 'bg-slate-50' : 'bg-white'}`}
                                >
                                    {/* Icon */}
                                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        !n.is_read ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium leading-snug ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>

                                    {/* Clear button */}
                                    <button
                                        onClick={() => clearOne(n.id)}
                                        disabled={clearing === n.id}
                                        className="flex-shrink-0 p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5"
                                        title="Clear notification"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
}
