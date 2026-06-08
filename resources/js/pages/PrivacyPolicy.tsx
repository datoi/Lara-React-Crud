import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicy() {
    const { t } = useTranslation();

    const sections = [
        { titleKey: 'privacy.s1Title', bullets: ['privacy.s1b1', 'privacy.s1b2', 'privacy.s1b3', 'privacy.s1b4', 'privacy.s1b5'] },
        { titleKey: 'privacy.s2Title', bullets: ['privacy.s2b1', 'privacy.s2b2', 'privacy.s2b3', 'privacy.s2b4', 'privacy.s2b5'] },
        { titleKey: 'privacy.s3Title', bullets: ['privacy.s3b1', 'privacy.s3b2', 'privacy.s3b3'] },
        { titleKey: 'privacy.s4Title', bullets: ['privacy.s4b1', 'privacy.s4b2', 'privacy.s4b3', 'privacy.s4b4'] },
        { titleKey: 'privacy.s5Title', bullets: ['privacy.s5b1', 'privacy.s5b2', 'privacy.s5b3'] },
        { titleKey: 'privacy.s6Title', bullets: ['privacy.s6b1', 'privacy.s6b2', 'privacy.s6b3'] },
        { titleKey: 'privacy.s7Title', bullets: ['privacy.s7b1', 'privacy.s7b2', 'privacy.s7b3', 'privacy.s7b4', 'privacy.s7b5'] },
        { titleKey: 'privacy.s8Title', bullets: ['privacy.s8b1', 'privacy.s8b2', 'privacy.s8b3'] },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">{t('privacy.eyebrow')}</p>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{t('privacy.title')}</h1>
                        <p className="text-slate-400 text-sm">{t('privacy.lastUpdated')}</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-slate-600 leading-relaxed mb-12"
                    >
                        {t('privacy.intro')}
                    </motion.p>

                    <div className="space-y-10">
                        {sections.map((s, i) => (
                            <motion.div
                                key={s.titleKey}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                            >
                                <h2 className="text-lg font-bold text-slate-900 mb-3">{t(s.titleKey)}</h2>
                                <ul className="space-y-2">
                                    {s.bullets.map((bKey) => (
                                        <li key={bKey} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
                                            {t(bKey)}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
