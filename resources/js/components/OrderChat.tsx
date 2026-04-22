import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { getAuthToken } from '../hooks/useAuth';

interface Message {
    id: number;
    sender_id: number;
    sender_name: string;
    message: string;
    created_at: string;
}

interface Props {
    orderId: number;
    currentUserId: number;
}

const POLL_MS = 5000;

export function OrderChat({ orderId, currentUserId }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText]         = useState('');
    const [sending, setSending]   = useState(false);
    const bottomRef               = useRef<HTMLDivElement>(null);
    const prevCountRef            = useRef(0);
    const token = getAuthToken();

    const fetchMessages = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`/api/orders/${orderId}/messages`, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) return;
            const data = await res.json();
            const incoming: Message[] = data.messages ?? [];
            // Only update state when the list actually changed
            setMessages(prev => {
                if (prev.length === incoming.length && prev.at(-1)?.id === incoming.at(-1)?.id) {
                    return prev;
                }
                return incoming;
            });
        } catch {
            // Silently ignore network errors during poll
        }
    }, [orderId, token]);

    // Mount fetch + 5-second poll
    useEffect(() => {
        fetchMessages();
        const id = setInterval(fetchMessages, POLL_MS);
        return () => clearInterval(id);
    }, [fetchMessages]);

    // Scroll to bottom only when message count grows
    useEffect(() => {
        if (messages.length > prevCountRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevCountRef.current = messages.length;
    }, [messages.length]);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed || sending || !token) return;

        setSending(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ message: trimmed }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data.message]);
                setText('');
            }
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-slate-100 pt-5 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Messages</p>

            {/* Message list */}
            <div className="bg-slate-50 rounded-xl h-56 overflow-y-auto flex flex-col gap-2 p-3">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-slate-400">No messages yet. Start the conversation.</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMine = msg.sender_id === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                                    isMine
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white border border-slate-200 text-slate-900'
                                }`}>
                                    {!isMine && (
                                        <p className="text-[10px] font-semibold text-slate-400 mb-0.5">
                                            {msg.sender_name}
                                        </p>
                                    )}
                                    <p className="text-sm leading-snug break-words">{msg.message}</p>
                                    <p className={`text-[10px] mt-1 ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString('en-GB', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    maxLength={2000}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label="Send message"
                >
                    {sending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                    }
                </button>
            </div>
        </div>
    );
}
