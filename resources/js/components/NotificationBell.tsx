import { useState, useEffect, useRef } from 'react';
import { Bell, X, Trash2, Package, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAuthToken } from '../hooks/useAuth';

interface Notification {
    id: number;
    type: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
    data?: Record<string, unknown>;
}

export function NotificationBell() {
    const [open, setOpen]                   = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const ref                               = useRef<HTMLDivElement>(null);

    const token = getAuthToken();

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const id = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Click-away close
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const clearAll = async () => {
        if (!token) return;
        await fetch('/api/notifications', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        setNotifications([]);
        setUnreadCount(0);
    };

    const handleOpen = () => {
        setOpen(v => !v);
    };

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        const now  = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (diff < 1)  return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return date.toLocaleDateString();
    };

    if (!token) return null;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                            <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`px-4 py-3 border-b border-slate-50 last:border-0 ${!n.is_read ? 'bg-slate-50' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                n.type === 'new_order' ? 'bg-slate-900' : 'bg-slate-100'
                                            }`}>
                                                {n.type === 'new_order'
                                                    ? <Scissors className="w-4 h-4 text-white" />
                                                    : <Package className="w-4 h-4 text-slate-600" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 leading-tight">{n.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                                                <p className="text-xs text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                                            </div>
                                            {!n.is_read && (
                                                <div className="w-2 h-2 bg-slate-900 rounded-full mt-1.5 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="px-4 py-3 border-t border-slate-100">
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
