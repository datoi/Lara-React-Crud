import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, Scissors, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PlatformStats {
    tailors_count: number;
    orders_count: number;
    avg_rating: number | null;
    reviews_count: number;
}

export function HeroSection() {
    const [stats, setStats] = useState<PlatformStats | null>(null);

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
                    backgroundImage: 'url(https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&q=85)',
                }}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 w-full text-center px-4 sm:px-6">
                {/* Pill badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-6"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Tbilisi-based tailors · Bespoke clothing · Guaranteed fit
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight tracking-tight mb-5 max-w-5xl mx-auto"
                >
                    Custom Clothes,<br className="hidden sm:block" /> Made by Local Tailors
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="text-base sm:text-lg text-white/75 mb-10 max-w-lg mx-auto leading-relaxed"
                >
                    Browse ready-made designs from Georgian tailors, or build your garment from scratch — fabric, cut, measurements, yours.
                </motion.p>

                {/* Two CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-full hover:bg-white/90 transition-all text-sm sm:text-base shadow-lg w-full sm:w-auto justify-center"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Browse Marketplace
                    </Link>
                    <Link
                        to="/design"
                        className="inline-flex items-center gap-2 bg-white/10 border border-white/30 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white/20 transition-all text-sm sm:text-base w-full sm:w-auto justify-center"
                    >
                        <Scissors className="w-4 h-4" />
                        Design Your Own
                        <ArrowRight className="w-4 h-4" />
                    </Link>
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
                                    <p>Local tailor{stats.tailors_count !== 1 ? 's' : ''}</p>
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
                                    <p>Order{stats.orders_count !== 1 ? 's' : ''} fulfilled</p>
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
                                    <p>Average rating</p>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
