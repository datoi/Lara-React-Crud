import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAuthToken } from '../hooks/useAuth';

interface Props {
    open: boolean;
    orderId: number;
    orderLabel: string;
    onClose: () => void;
    onSubmitted: () => void;
}

export function ReviewModal({ open, orderId, orderLabel, onClose, onSubmitted }: Props) {
    const [rating, setRating]     = useState(0);
    const [hover, setHover]       = useState(0);
    const [comment, setComment]   = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState('');

    const token = getAuthToken();

    const handleSubmit = async () => {
        if (!rating) { setError('Please select a star rating.'); return; }
        if (!comment.trim()) { setError('Please write a short comment.'); return; }

        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ order_id: orderId, rating, comment }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.message ?? 'Something went wrong.');
                return;
            }
            onSubmitted();
            onClose();
            setRating(0);
            setComment('');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900">Leave a Review</h3>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">{orderLabel}</p>
                            </div>
                            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Star selector */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-3">Your Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setRating(n)}
                                            onMouseEnter={() => setHover(n)}
                                            onMouseLeave={() => setHover(0)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className="w-8 h-8 transition-colors"
                                                fill={(hover || rating) >= n ? '#fbbf24' : 'none'}
                                                stroke={(hover || rating) >= n ? '#fbbf24' : '#cbd5e1'}
                                                strokeWidth={1.5}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Your Comment</label>
                                <textarea
                                    rows={4}
                                    placeholder="Tell us about your experience with the tailor and the garment quality…"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    maxLength={1000}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                                />
                                <p className="text-xs text-slate-400 text-right mt-1">{comment.length}/1000</p>
                            </div>

                            {error && <p className="text-xs text-red-500">{error}</p>}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {submitting ? 'Submitting…' : 'Submit Review'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
