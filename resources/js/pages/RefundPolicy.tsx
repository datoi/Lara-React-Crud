import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RefundPolicy() {
    const { t } = useTranslation();

    const eligible = ['refund.e1', 'refund.e2', 'refund.e3', 'refund.e4'];
    const notEligible = ['refund.n1', 'refund.n2', 'refund.n3', 'refund.n4'];

    const steps = [
        { number: '01', titleKey: 'refund.step1Title', descKey: 'refund.step1Desc' },
        { number: '02', titleKey: 'refund.step2Title', descKey: 'refund.step2Desc' },
        { number: '03', titleKey: 'refund.step3Title', descKey: 'refund.step3Desc' },
        { number: '04', titleKey: 'refund.step4Title', descKey: 'refund.step4Desc' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{t('refund.title')}</h1>
                        <p className="text-slate-400 text-sm">{t('refund.lastUpdated')}</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-12">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 leading-relaxed">{t('refund.introBanner')}</p>
                            </div>
                        </div>

                        {/* Eligible */}
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-slate-700" />
                                <h2 className="text-xl font-bold text-slate-900">{t('refund.eligibleTitle')}</h2>
                            </div>
                            <ul className="space-y-3">
                                {eligible.map((key) => (
                                    <li key={key} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-2" />
                                        {t(key)}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Not eligible */}
                        <div className="mb-12">
                            <div className="flex items-center gap-2 mb-4">
                                <XCircle className="w-5 h-5 text-slate-400" />
                                <h2 className="text-xl font-bold text-slate-900">{t('refund.notEligibleTitle')}</h2>
                            </div>
                            <ul className="space-y-3">
                                {notEligible.map((key) => (
                                    <li key={key} className="flex gap-3 text-sm text-slate-500 leading-relaxed">
                                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
                                        {t(key)}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Cancellation */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-12">
                            <h2 className="font-bold text-slate-900 mb-3">{t('refund.cancellationTitle')}</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">{t('refund.cancellationDesc')}</p>
                        </div>
                    </motion.div>

                    {/* Process */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <h2 className="text-2xl font-black text-slate-900 mb-8">{t('refund.processTitle')}</h2>
                        <div className="space-y-4">
                            {steps.map((step) => (
                                <div key={step.number} className="flex gap-5 p-5 bg-white rounded-2xl border border-slate-200">
                                    <div className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-bold">
                                        {step.number}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 mb-1">{t(step.titleKey)}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed">{t(step.descKey)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mt-12 text-center"
                    >
                        <h2 className="text-xl font-black text-slate-900 mb-3">{t('refund.ctaTitle')}</h2>
                        <p className="text-slate-500 text-sm mb-6">{t('refund.ctaDesc')}</p>
                        <Link to="/" className="inline-block bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors">
                            {t('refund.contactSupport')}
                        </Link>
                    </motion.div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
