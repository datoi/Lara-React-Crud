import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Plus, X, Loader2, CheckCircle } from 'lucide-react';
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
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </Button>
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
        <section id="faq" className="overflow-hidden bg-[#f7f6f3] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="mx-auto max-w-[1500px]">
                <div className="border-b border-black/20 pb-8 sm:pb-10">
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8c8c8c]">
                        {t('faq.emailSupport')}
                    </p>

                    <h2 className="font-serif text-[clamp(1.65rem,3.1vw,3rem)] font-medium uppercase leading-[1] tracking-normal text-[#111111]">
                        {t('faq.sectionTitle')}
                    </h2>

                    <p className="mt-8 max-w-xl text-sm leading-7 text-[#717171] sm:text-base">
                        {t('faq.sectionSubtitle')}
                    </p>
                </div>

                <div className="mx-auto max-w-5xl">
                    {faqs.map((faq, i) => {
                        const isOpen = open === i;
                        const number = String(i + 1).padStart(2, '0');
                        const panelId = `faq-panel-${i}`;
                        const buttonId = `faq-button-${i}`;

                        return (
                            <article key={faq.q} className="border-b border-black/20">
                                <button
                                    id={buttonId}
                                    type="button"
                                    onClick={() => setOpen(isOpen ? null : i)}
                                    aria-expanded={isOpen}
                                    aria-controls={panelId}
                                    className="group grid w-full grid-cols-[52px_minmax(0,1fr)_36px] items-center gap-4 py-6 text-left sm:grid-cols-[84px_minmax(0,1fr)_46px] sm:py-8 lg:grid-cols-[110px_minmax(0,1fr)_50px] lg:py-9"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold tracking-[0.12em] text-[#333333]">{number}</span>

                                        <ArrowRight className="h-3.5 w-3.5 text-[#444444] transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>

                                    <h3 className="justify-self-start text-sm font-semibold leading-6 tracking-normal text-[#111111] sm:text-base">
                                        {faq.q}
                                    </h3>

                                    <span className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full transition-colors duration-300 group-hover:bg-black/5 sm:h-11 sm:w-11">
                                        <Plus
                                            className={[
                                                'h-5 w-5 stroke-[1.4] text-[#111111] transition-transform duration-300',
                                                isOpen ? 'rotate-45' : '',
                                            ].join(' ')}
                                        />
                                    </span>
                                </button>

                                <div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={buttonId}
                                    className={[
                                        'grid transition-[grid-template-rows,opacity] duration-500 ease-out',
                                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                                    ].join(' ')}
                                >
                                    <div className="overflow-hidden">
                                        <div className="grid grid-cols-[52px_minmax(0,1fr)_36px] gap-4 pb-7 sm:grid-cols-[84px_minmax(0,1fr)_46px] sm:pb-9 lg:grid-cols-[110px_minmax(0,1fr)_50px] lg:pb-10">
                                            <div />

                                            <p className="max-w-2xl text-xs leading-6 text-[#707070] sm:text-sm">
                                                {faq.a}
                                            </p>

                                            <div />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="mx-auto flex max-w-5xl flex-col gap-6 pt-10 sm:flex-row sm:items-end sm:justify-between md:pt-14">
                    <div>
                        <p className="max-w-lg font-serif text-lg font-medium leading-tight tracking-normal text-[#111111] sm:text-xl">
                            {t('faq.stillHaveQuestions')}
                        </p>
                        <p className="mt-3 max-w-lg text-sm leading-7 text-[#717171] sm:text-base">
                            {t('faq.stillHaveQuestionsDesc')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleEmailSupport}
                        className="inline-flex min-h-[50px] w-fit items-center justify-center gap-3 border border-black/30 px-7 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors duration-200 hover:bg-[#111111] hover:text-white"
                    >
                        {t('faq.emailSupport')}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
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
