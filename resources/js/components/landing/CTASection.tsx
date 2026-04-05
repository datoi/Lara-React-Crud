import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
    return (
        <section className="py-16 md:py-24 bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 md:p-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-5 leading-tight">
                        Ready to wear something made for you?
                    </h2>
                    <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto">
                        Join thousands of customers who've discovered the joy of perfectly-fitted, custom clothing from Georgian tailors.
                    </p>
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 bg-slate-900 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-slate-700 transition-all hover:gap-3 active:scale-[0.98] shadow-lg shadow-slate-900/10"
                    >
                        Browse Marketplace
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-sm text-slate-400 mt-6">No sign-up required to browse.</p>
                </motion.div>
            </div>
        </section>
    );
}
