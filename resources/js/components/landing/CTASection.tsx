import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, Scissors, ShoppingBag } from 'lucide-react';

export function CTASection() {
    return (
        <section className="relative py-28 md:py-36 overflow-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&auto=format&fit=crop')",
                }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-slate-900/75" />

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-slate-300 text-sm font-medium mb-3">Ready to wear something made for you?</p>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                        Your Perfect Garment,<br className="hidden sm:block" /> Sewn by a Local Tailor
                    </h2>
                    <p className="text-slate-300 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                        Pick a ready-made design or build one from scratch — fabric, cut, and measurements chosen by you.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/marketplace"
                            className="inline-flex items-center gap-2 bg-white text-slate-900 text-base font-semibold px-8 py-4 rounded-full hover:bg-white/90 transition-all active:scale-[0.98] w-full sm:w-auto justify-center shadow-lg"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Browse Marketplace
                        </Link>
                        <Link
                            to="/design"
                            className="inline-flex items-center gap-2 border border-white/40 bg-white/10 backdrop-blur-sm text-white text-base font-semibold px-8 py-4 rounded-full hover:bg-white/20 transition-all active:scale-[0.98] w-full sm:w-auto justify-center"
                        >
                            <Scissors className="w-5 h-5" />
                            Design Your Own Clothes
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
