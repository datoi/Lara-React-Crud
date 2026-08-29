import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Heart, Shield, Users, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AboutUs() {
    const { t } = useTranslation();

    const values = [
        { icon: Heart,  titleKey: 'aboutUs.v1Title', descKey: 'aboutUs.v1Desc' },
        { icon: Users,  titleKey: 'aboutUs.v2Title', descKey: 'aboutUs.v2Desc' },
        { icon: Shield, titleKey: 'aboutUs.v3Title', descKey: 'aboutUs.v3Desc' },
        { icon: Leaf,   titleKey: 'aboutUs.v4Title', descKey: 'aboutUs.v4Desc' },
    ];

    const stats = [
        { numKey: 'aboutUs.stat1Num', labelKey: 'aboutUs.stat1Label' },
        { numKey: 'aboutUs.stat2Num', labelKey: 'aboutUs.stat2Label' },
        { numKey: 'aboutUs.stat3Num', labelKey: 'aboutUs.stat3Label' },
        { numKey: 'aboutUs.stat4Num', labelKey: 'aboutUs.stat4Label' },
    ];

    return (
        <div className="kere-info-page min-h-screen bg-white">
            <Navigation />

            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-black mb-6">{t('aboutUs.heroTitle')}</h1>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <h2 className="text-3xl font-black text-slate-900 mb-6">{t('aboutUs.whyTitle')}</h2>
                            <div className="space-y-4 text-slate-600 leading-relaxed">
                                <p>{t('aboutUs.whyP1')}</p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-slate-100 rounded-3xl aspect-[4/3] flex items-center justify-center"
                        >
                            <div className="text-center text-slate-400 px-8">
                                <p className="text-6xl mb-4">🪡</p>
                                <p className="text-sm">Tbilisi, Georgia</p>
                                <p className="text-xs mt-1 text-slate-300">Est. 2024</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-900 mb-3">{t('aboutUs.valuesTitle')}</h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <motion.div
                                key={v.titleKey}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="bg-white rounded-2xl border border-slate-200 p-6"
                            >
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                                    <v.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{t(v.titleKey)}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{t(v.descKey)}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, i) => (
                            <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                                <p className="text-4xl font-black text-white mb-2">{t(stat.numKey)}</p>
                                <p className="text-slate-400 text-sm">{t(stat.labelKey)}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-xl mx-auto px-4">
                    <h2 className="text-2xl font-black text-slate-900 mb-4">{t('aboutUs.ctaTitle')}</h2>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/marketplace" className="bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors">
                            {t('aboutUs.browseMarketplace')}
                        </Link>
                        <Link to="/register/tailor" className="border border-slate-300 text-slate-700 font-semibold px-8 py-3 rounded-full hover:border-slate-500 transition-colors">
                            {t('aboutUs.joinAsTailor')}
                        </Link>
                    </div>
                </motion.div>
            </section>
            <Footer />
        </div>
    );
}
