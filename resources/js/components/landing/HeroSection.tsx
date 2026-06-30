import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, Scissors, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PlatformStats {
    tailors_count: number;
    orders_count: number;
    avg_rating: number | null;
    reviews_count: number;
}

export function HeroSection() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetch('/api/platform/stats')
            .then(r => r.json())
            .then(setStats)
            .catch(() => {});
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/assets/garments/fashionShow.jpg)',
                }}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 w-full text-center px-4 sm:px-6">

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight tracking-tight mb-5 max-w-5xl mx-auto"
                >
                    {t('hero.headline')}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="text-base sm:text-lg text-white/75 mb-10 max-w-lg mx-auto leading-relaxed"
                >
                    {t('hero.subtitle')}
                </motion.p>

                {/* Primary CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                    {/* Primary — solid white */}
                    <Link
                        to="/design"
                        className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-lg hover:bg-slate-100 transition-all text-sm sm:text-base shadow-lg w-full sm:w-auto justify-center"
                    >
                        <Scissors className="w-4 h-4" />
                        {t('hero.startYourDesign')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>

                {/* Tertiary — upload, visually separated */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.38 }}
                    className="flex items-center justify-center gap-3 mt-6"
                >
                    <div className="w-12 h-px bg-white/20" />
                    <Link
                        to="/design?upload=1"
                        className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/15 font-medium px-5 py-2.5 rounded-lg transition-all text-sm"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        {t('hero.uploadYourDesign')}
                    </Link>
                    <div className="w-12 h-px bg-white/20" />
                </motion.div>

                {/* Social proof numbers — only shown if we have real data */}
                {stats && (stats.tailors_count > 0 || stats.orders_count > 0 || stats.avg_rating !== null) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="mt-12 flex items-center justify-center gap-6 sm:gap-10 text-white/60 text-xs sm:text-sm"
                    >
                        {stats.tailors_count > 0 && (
                            <>
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg sm:text-xl">{stats.tailors_count}</p>
                                    <p>{stats.tailors_count !== 1 ? t('hero.localTailors') : t('hero.localTailor')}</p>
                                </div>
                            </>
                        )}
                        {stats.tailors_count > 0 && stats.orders_count > 0 && (
                            <div className="w-px h-8 bg-white/20" />
                        )}
                        {stats.orders_count > 0 && (
                            <>
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg sm:text-xl">{stats.orders_count}</p>
                                    <p>{stats.orders_count !== 1 ? t('hero.ordersFulfilled') : t('hero.orderFulfilled')}</p>
                                </div>
                            </>
                        )}
                        {stats.avg_rating !== null && stats.reviews_count > 0 && (
                            <>
                                {(stats.tailors_count > 0 || stats.orders_count > 0) && (
                                    <div className="w-px h-8 bg-white/20" />
                                )}
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg sm:text-xl">{stats.avg_rating}★</p>
                                    <p>{t('hero.averageRating')}</p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
