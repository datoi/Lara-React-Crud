import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

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
                    <p className="text-slate-300 text-sm font-medium mb-3">Ready to get started?</p>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                        Create Your Custom Clothing Today
                    </h2>
                    <p className="text-slate-300 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                        Design clothes that fit your style and body perfectly. Made by local tailors with our quality guarantee.
                    </p>
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 border border-white text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-white hover:text-slate-900 transition-all active:scale-[0.98]"
                    >
                        Browse Marketplace
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
