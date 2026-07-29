import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { ShoppingBag, Ruler, RotateCcw, Mail, Package, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HelpCenter() {
    const { t } = useTranslation();

    const topics = [
        {
            icon: ShoppingBag,
            titleKey: 'helpCenter.t1Title',
            articles: [
                { qKey: 'helpCenter.t1q1', aKey: 'helpCenter.t1a1' },
                { qKey: 'helpCenter.t1q2', aKey: 'helpCenter.t1a2' },
                { qKey: 'helpCenter.t1q3', aKey: 'helpCenter.t1a3' },
            ],
        },
        {
            icon: Ruler,
            titleKey: 'helpCenter.t2Title',
            articles: [
                { qKey: 'helpCenter.t2q1', aKey: 'helpCenter.t2a1' },
                { qKey: 'helpCenter.t2q2', aKey: 'helpCenter.t2a2' },
                { qKey: 'helpCenter.t2q3', aKey: 'helpCenter.t2a3' },
            ],
        },
        {
            icon: Package,
            titleKey: 'helpCenter.t3Title',
            articles: [
                { qKey: 'helpCenter.t3q1', aKey: 'helpCenter.t3a1' },
                { qKey: 'helpCenter.t3q2', aKey: 'helpCenter.t3a2' },
                { qKey: 'helpCenter.t3q3', aKey: 'helpCenter.t3a3' },
            ],
        },
        {
            icon: RotateCcw,
            titleKey: 'helpCenter.t4Title',
            articles: [
                { qKey: 'helpCenter.t4q1', aKey: 'helpCenter.t4a1' },
                { qKey: 'helpCenter.t4q2', aKey: 'helpCenter.t4a2' },
                { qKey: 'helpCenter.t4q3', aKey: 'helpCenter.t4a3' },
            ],
        },
        {
            icon: CreditCard,
            titleKey: 'helpCenter.t5Title',
            articles: [
                { qKey: 'helpCenter.t5q1', aKey: 'helpCenter.t5a1' },
                { qKey: 'helpCenter.t5q2', aKey: 'helpCenter.t5a2' },
                { qKey: 'helpCenter.t5q3', aKey: 'helpCenter.t5a3' },
            ],
        },
        {
            icon: Mail,
            titleKey: 'helpCenter.t6Title',
            articles: [
                { qKey: 'helpCenter.t6q1', aKey: 'helpCenter.t6a1' },
                { qKey: 'helpCenter.t6q2', aKey: 'helpCenter.t6a2' },
                { qKey: 'helpCenter.t6q3', aKey: 'helpCenter.t6a3' },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white text-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black mb-6">{t('helpCenter.heroTitle')}</h1>
                        <p className="text-slate-300 max-w-xl mx-auto">{t('helpCenter.heroDesc')}</p>
                    </motion.div>
                </div>
            </section>

            {/* Topics */}
            <section className="py-16 md:py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    {topics.map((topic, ti) => (
                        <motion.div
                            key={topic.titleKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: ti * 0.07 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                                    <topic.icon className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">{t(topic.titleKey)}</h2>
                            </div>
                            <div className="space-y-3">
                                {topic.articles.map((a) => (
                                    <div key={a.qKey} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                                        <p className="font-semibold text-slate-900 mb-1.5">{t(a.qKey)}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed">{t(a.aKey)}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Still stuck */}
            <section className="py-16 bg-slate-50 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-md mx-auto px-4"
                >
                    <h2 className="text-2xl font-black text-slate-900 mb-3">{t('helpCenter.stillNeedHelp')}</h2>
                    <p className="text-slate-500 mb-6 text-sm">{t('helpCenter.stillDesc')}</p>
                    <Link
                        to="/"
                        className="inline-block bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors"
                    >
                        {t('helpCenter.emailSupport')}
                    </Link>
                    <p className="text-xs text-slate-400 mt-4">{t('helpCenter.signInNote')}</p>
                </motion.div>
            </section>
            <Footer />
        </div>
    );
}
