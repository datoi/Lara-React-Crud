import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, X, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getAuthUser, getAuthToken } from '../../hooks/useAuth';
import { Button } from '../ui/button';

const faqs = [
    {
        q: 'How do I place a custom clothing order?',
        a: "Browse the marketplace to find a tailor whose style matches yours, or use our custom designer to describe exactly what you want. Then submit your order and we'll connect you with the right tailor.",
    },
    {
        q: "What if the finished item doesn't fit?",
        a: "Every order includes a free revision. If there's a fit issue, your tailor will adjust it at no extra cost. If you're still not satisfied, we offer a full refund.",
    },
    {
        q: 'How long does an order take?',
        a: "Most orders are completed within 5–14 business days depending on complexity. You'll see the estimated delivery time before confirming your order.",
    },
    {
        q: 'Can I provide my own measurements?',
        a: 'Yes! Our customization forms let you enter exact measurements (chest, waist, hips, length, inseam) in centimeters for a perfect fit.',
    },
    {
        q: 'Do you deliver outside Tbilisi?',
        a: 'Yes. We deliver to all major cities across Georgia. Delivery time may vary by location.',
    },
    {
        q: 'How do I become a tailor on Kere?',
        a: 'Click "Sign In" in the navigation and choose the tailor option. Our team will review your application and onboard you within 2–3 business days.',
    },
];

function SupportModal({ onClose }: { onClose: () => void }) {
    const user    = getAuthUser();
    const token   = getAuthToken();
    const [subject,    setSubject]    = useState('');
    const [message,    setMessage]    = useState('');
    const [sending,    setSending]    = useState(false);
    const [sent,       setSent]       = useState(false);
    const [error,      setError]      = useState('');

    const handleSend = async () => {
        if (!subject.trim()) { setError('Please enter a subject.'); return; }
        if (!message.trim()) { setError('Please enter a message.'); return; }

        setSending(true);
        setError('');
        try {
            const res = await fetch('/api/support-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ subject, message }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.message ?? 'Something went wrong.');
                return;
            }
            setSent(true);
            setTimeout(onClose, 2200);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Email Support</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {sent ? (
                    <div className="p-8 flex flex-col items-center text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
                        </motion.div>
                        <p className="font-semibold text-slate-900 mb-1">Message Sent!</p>
                        <p className="text-sm text-slate-500">Our support team will get back to you shortly.</p>
                    </div>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* From — read-only */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">From</label>
                            <input
                                type="email"
                                value={user?.email ?? ''}
                                disabled
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Subject</label>
                            <input
                                type="text"
                                placeholder="How can we help?"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Message</label>
                            <textarea
                                rows={5}
                                placeholder="Describe your issue or question in detail…"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                maxLength={5000}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                            />
                            <p className="text-xs text-slate-400 text-right mt-0.5">{message.length}/5000</p>
                        </div>

                        {error && <p className="text-xs text-red-500">{error}</p>}

                        <div className="flex gap-3 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                                disabled={sending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                className="flex-1 bg-slate-900 hover:bg-slate-700"
                                onClick={handleSend}
                                disabled={sending}
                            >
                                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {sending ? 'Sending…' : 'Send'}
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export function FAQSection() {
    const [open,          setOpen]          = useState<number | null>(null);
    const [supportOpen,   setSupportOpen]   = useState(false);
    const navigate = useNavigate();

    const handleEmailSupport = () => {
        const user = getAuthUser();
        if (!user) {
            navigate('/signin');
            return;
        }
        setSupportOpen(true);
    };

    return (
        <>
        <section id="faq" className="py-16 md:py-24 bg-slate-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-5 text-2xl">
                        ❓
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-slate-500">Everything you need to know about Kere.</p>
                </motion.div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                            >
                                <span className="font-medium text-slate-900">{faq.q}</span>
                                <motion.div
                                    animate={{ rotate: open === i ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-shrink-0"
                                >
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                </motion.div>
                            </button>
                            <AnimatePresence initial={false}>
                                {open === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <div className="px-6 pb-5 text-slate-500 leading-relaxed text-sm border-t border-slate-100 pt-4">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Still have questions? */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-10 bg-white border border-slate-200 rounded-2xl p-8 text-center"
                >
                    <p className="font-semibold text-slate-900 text-lg mb-2">Still have questions?</p>
                    <p className="text-slate-500 text-sm mb-6">
                        Our support team is here to help you with any questions or concerns.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                        <button
                            onClick={handleEmailSupport}
                            className="bg-slate-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Email Support
                        </button>
                        <button className="border border-slate-300 text-slate-700 text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors">
                            Live Chat
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>

        <AnimatePresence>
            {supportOpen && (
                <SupportModal onClose={() => setSupportOpen(false)} />
            )}
        </AnimatePresence>
        </>
    );
}
