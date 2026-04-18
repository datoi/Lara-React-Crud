import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface Props {
    onAddProduct: () => void;
}

const STEPS = [
    { num: '1', label: 'Add your first product', desc: 'Describe what you make and upload a photo' },
    { num: '2', label: 'Set your price',          desc: 'Name your price in Georgian Lari'           },
    { num: '3', label: 'Publish',                 desc: 'Your listing goes live in the marketplace'  },
];

export function OnboardingPanel({ onAddProduct }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white"
        >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Getting started
            </p>
            <h2 className="text-xl sm:text-2xl font-bold mb-1.5">Let's get your first order</h2>
            <p className="text-slate-400 text-sm mb-7 max-w-lg">
                Customers are already searching for custom clothing. Add a product to get discovered in the marketplace.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 mb-8">
                {STEPS.map((step, i) => (
                    <div key={step.num} className="flex items-start gap-3 flex-1 relative">
                        {/* Connector line */}
                        {i < STEPS.length - 1 && (
                            <div className="hidden sm:block absolute left-4 top-4 w-full h-px bg-white/10 -translate-y-1/2 z-0" />
                        )}
                        <div className="relative z-10 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{step.num}</span>
                        </div>
                        <div className="pt-0.5">
                            <p className="text-sm font-semibold text-white leading-tight">{step.label}</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onAddProduct}
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 active:scale-[0.98] transition-all text-sm"
            >
                Add First Product
                <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
