import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../hooks/useAuth';
import { Button } from './ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: number;
    sender_id: number;
    sender_name: string;
    message: string;
    created_at: string;
}

interface Props {
    orderId: number;
    currentUserId: number;
    isVisible?: boolean;
    onUnreadCountChange?: (count: number) => void;
    /** Overrides the messages fetch URL — e.g. the admin read-only endpoint. */
    endpoint?: string;
    /** Hides the input/send row — for viewers who aren't a participant in the chat. */
    readOnly?: boolean;
    /** Always show the sender's name on every bubble, instead of only on "other" messages. */
    showSenderLabels?: boolean;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getSeenCount(orderId: number): number {
    return parseInt(localStorage.getItem(`kere_chat_others_seen_${orderId}`) ?? '0', 10);
}

function saveSeenCount(orderId: number, n: number): void {
    localStorage.setItem(`kere_chat_others_seen_${orderId}`, String(n));
}

export function countOthersMessages(orderId: number, totalFromOthers: number): number {
    return Math.max(0, totalFromOthers - getSeenCount(orderId));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderChat({
    orderId, currentUserId, isVisible = true, onUnreadCountChange,
    endpoint, readOnly = false, showSenderLabels = false,
}: Props) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(false);
    const [text,     setText]     = useState('');
    const [sending,  setSending]  = useState(false);
    const bottomRef  = useRef<HTMLDivElement>(null);
    const prevLen    = useRef(0);
    const token      = getAuthToken();
    const messagesUrl = endpoint ?? `/api/orders/${orderId}/messages`;

    const notifyUnread = useCallback((msgs: ChatMessage[]) => {
        const fromOthers = msgs.filter(m => m.sender_id !== currentUserId).length;
        onUnreadCountChange?.(countOthersMessages(orderId, fromOthers));
    }, [orderId, currentUserId, onUnreadCountChange]);

    const fetchMessages = useCallback(async () => {
        if (!token) return;
        try {
            const r = await fetch(messagesUrl, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!r.ok) {
                setLoading(false);
                setError(true);
                return;
            }
            const data = await r.json();
            const incoming: ChatMessage[] = data.messages ?? [];
            setMessages(prev => {
                if (prev.length === incoming.length && prev.at(-1)?.id === incoming.at(-1)?.id) {
                    return prev;
                }
                return incoming;
            });
            setLoading(false);
            setError(false);
            notifyUnread(incoming);
        } catch {
            setLoading(false);
            setError(true);
        }
    }, [messagesUrl, token, notifyUnread]);

    // Initial fetch + 4-second poll (always active — tracks unread even when tab hidden)
    useEffect(() => {
        fetchMessages();
        const id = setInterval(fetchMessages, 4000);
        return () => clearInterval(id);
    }, [fetchMessages]);

    // Mark messages as seen when chat becomes visible
    useEffect(() => {
        if (!isVisible || readOnly) return;
        const fromOthers = messages.filter(m => m.sender_id !== currentUserId).length;
        saveSeenCount(orderId, fromOthers);
        onUnreadCountChange?.(0);
    }, [isVisible, readOnly, messages, orderId, currentUserId, onUnreadCountChange]);

    // Scroll to bottom on new messages (only when visible)
    useEffect(() => {
        if (isVisible && messages.length > prevLen.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevLen.current = messages.length;
    }, [isVisible, messages.length]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending || !token) return;
        setSending(true);
        try {
            const r = await fetch(`/api/orders/${orderId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ message: trimmed }),
            });
            if (r.ok) {
                const data = await r.json();
                setMessages(prev => [...prev, data.message]);
                setText('');
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden">
            {/* Messages list */}
            <div className="overflow-y-auto p-4 space-y-3 bg-slate-50" style={{ minHeight: '200px', maxHeight: '300px' }}>
                {loading ? (
                    <div className="flex items-center justify-center" style={{ height: '168px' }}>
                        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-2" style={{ height: '168px' }}>
                        <AlertCircle className="w-8 h-8 text-destructive/40" />
                        <p className="text-sm text-destructive">{t('chat.loadError')}</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2" style={{ height: '168px' }}>
                        <MessageCircle className="w-8 h-8 text-slate-200" />
                        <p className="text-sm text-slate-400">{t('chat.noMessages')}</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isOwn = msg.sender_id === currentUserId;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
                            >
                                {(showSenderLabels || !isOwn) && (
                                    <span className="text-[10px] text-slate-400 px-1">{msg.sender_name}</span>
                                )}
                                <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-snug break-words ${
                                    isOwn
                                        ? 'bg-slate-900 text-white rounded-br-sm'
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                }`}>
                                    {msg.message}
                                </div>
                                <span className="text-[10px] text-slate-400 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </motion.div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            {!readOnly && (
            <div className="flex items-center gap-2 p-3 border-t border-slate-200 bg-white">
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder={t('chat.placeholder')}
                    maxLength={2000}
                    disabled={sending}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
                <Button
                    variant="default"
                    size="sm"
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="flex items-center gap-1.5 flex-shrink-0"
                >
                    {sending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                    }
                    <span className="hidden sm:inline">
                        {sending ? t('chat.sending') : t('chat.send')}
                    </span>
                </Button>
            </div>
            )}
        </div>
    );
}
