import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, X, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getAuthUser, getAuthToken } from '../../hooks/useAuth';
import { Button } from '../ui/button';

function SupportModal({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const user    = getAuthUser();
    const token   = getAuthToken();
    const [subject,    setSubject]    = useState('');
    const [message,    setMessage]    = useState('');
    const [sending,    setSending]    = useState(false);
    const [sent,       setSent]       = useState(false);
    const [error,      setError]      = useState('');

    const handleSend = async () => {
        if (!subject.trim()) { setError(t('faq.enterSubject')); return; }
        if (!message.trim()) { setError(t('faq.enterMessage')); return; }

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
                setError(d.message ?? t('faq.somethingWentWrong'));
                return;
            }
            setSent(true);
            setTimeout(onClose, 2200);
        } catch {
            setError(t('faq.networkError'));
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
                    <h3 className="font-bold text-slate-900">{t('faq.emailSupport')}</h3>
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
                            <CheckCircle className="w-14 h-14 text-slate-700 mb-4" />
                        </motion.div>
                        <p className="font-semibold text-slate-900 mb-1">{t('faq.messageSent')}</p>
                        <p className="text-sm text-slate-500">{t('faq.messageSentDesc')}</p>
                    </div>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* From — read-only */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">{t('faq.from')}</label>
                            <input
                                type="email"
                                value={user?.email ?? ''}
                                disabled
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">{t('faq.subject')}</label>
                            <input
                                type="text"
                                placeholder={t('faq.subjectPlaceholder')}
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">{t('faq.message')}</label>
                            <textarea
                                rows={5}
                                placeholder={t('faq.messagePlaceholder')}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                maxLength={5000}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                            />
                            <p className="text-xs text-slate-400 text-right mt-0.5">{message.length}/5000</p>
                        </div>

                        {error && <p className="text-xs text-slate-600">{error}</p>}

                        <div className="flex gap-3 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                                disabled={sending}
                            >
                                {t('faq.cancel')}
                            </Button>
                            <Button
                                variant="default"
                                className="flex-1 bg-slate-900 hover:bg-slate-700"
                                onClick={handleSend}
                                disabled={sending}
                            >
                                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {sending ? t('faq.sending') : t('faq.send')}
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export function FAQSection() {
    const { t } = useTranslation();
    const [open,        setOpen]        = useState<number | null>(null);
    const [supportOpen, setSupportOpen] = useState(false);
    const navigate = useNavigate();

    const faqs = [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') },
        { q: t('faq.q5'), a: t('faq.a5') },
        { q: t('faq.q6'), a: t('faq.a6') },
    ];

    const handleEmailSupport = () => {
        const user = getAuthUser();
        if (!user) {
            navigate('/login/customer');
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
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('faq.sectionTitle')}</h2>
                    <p className="text-slate-500">{t('faq.sectionSubtitle')}</p>
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
                    <p className="font-semibold text-slate-900 text-lg mb-2">{t('faq.stillHaveQuestions')}</p>
                    <p className="text-slate-500 text-sm mb-6">
                        {t('faq.stillHaveQuestionsDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                        <button
                            onClick={handleEmailSupport}
                            className="bg-slate-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            {t('faq.emailSupport')}
                        </button>
                        <button className="border border-slate-300 text-slate-700 text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors">
                            {t('faq.liveChat')}
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
