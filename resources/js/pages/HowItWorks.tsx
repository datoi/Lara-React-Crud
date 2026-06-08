import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Ruler, Palette, Scissors, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
    const { t } = useTranslation();

    const steps = [
        { number: '01', icon: Palette,  titleKey: 'howItWorks.s1Title', descKey: 'howItWorks.s1Desc' },
        { number: '02', icon: Ruler,    titleKey: 'howItWorks.s2Title', descKey: 'howItWorks.s2Desc' },
        { number: '03', icon: Scissors, titleKey: 'howItWorks.s3Title', descKey: 'howItWorks.s3Desc' },
        { number: '04', icon: Package,  titleKey: 'howItWorks.s4Title', descKey: 'howItWorks.s4Desc' },
    ];

    const faqs = [
        { qKey: 'howItWorks.q1', aKey: 'howItWorks.a1' },
        { qKey: 'howItWorks.q2', aKey: 'howItWorks.a2' },
        { qKey: 'howItWorks.q3', aKey: 'howItWorks.a3' },
        { qKey: 'howItWorks.q4', aKey: 'howItWorks.a4' },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">{t('howItWorks.eyebrow')}</p>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">{t('howItWorks.heroTitle')}</h1>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto">{t('howItWorks.heroDesc')}</p>
                    </motion.div>
                </div>
            </section>

            {/* Steps */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-10">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="flex gap-6 p-8 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center">
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 mb-1">{step.number}</p>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{t(step.titleKey)}</h3>
                                    <p className="text-slate-500 leading-relaxed">{t(step.descKey)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24 bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-3">{t('howItWorks.faqTitle')}</h2>
                        <p className="text-slate-500">{t('howItWorks.faqSubtitle')}</p>
                    </motion.div>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={faq.qKey}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="bg-white rounded-2xl border border-slate-200 p-6"
                            >
                                <h3 className="font-semibold text-slate-900 mb-2">{t(faq.qKey)}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{t(faq.aKey)}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-xl mx-auto px-4"
                >
                    <h2 className="text-3xl font-black mb-4">{t('howItWorks.ctaTitle')}</h2>
                    <p className="text-slate-400 mb-8">{t('howItWorks.ctaDesc')}</p>
                    <Link
                        to="/marketplace"
                        className="inline-block bg-white text-slate-900 font-semibold px-8 py-3 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        {t('howItWorks.browseMarketplace')}
                    </Link>
                </motion.div>
            </section>
            <Footer />
        </div>
    );
}
