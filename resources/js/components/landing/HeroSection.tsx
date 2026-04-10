import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, ArrowDown } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&q=85)',
                }}
            />
            {/* Dark overlay — enough to read text, light enough to see the image */}
            <div className="absolute inset-0 bg-black/45" />

            <div className="relative z-10 w-full text-center px-4 sm:px-6">
                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight tracking-tight mb-6 max-w-5xl mx-auto"
                >
                    Design Your Own Clothes — Made Locally, Guaranteed.
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-base md:text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed"
                >
                    Create custom clothing with full control over design, fabric, and fit.
                    Made by skilled local tailors with our quality guarantee.
                </motion.p>

                {/* Pointing arrow + button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-col items-center gap-3"
                >
                    {/* Bouncing down arrow above button */}
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <ArrowDown className="w-5 h-5 text-white/70" />
                    </motion.div>

                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-3.5 rounded-full hover:bg-white/90 transition-all text-base shadow-lg"
                    >
                        Browse Marketplace
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
