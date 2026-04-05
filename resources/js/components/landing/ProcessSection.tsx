import { motion } from 'motion/react';
import { Shirt, Palette, DollarSign, ShoppingBag } from 'lucide-react';

const steps = [
    {
        icon: Shirt,
        number: 1,
        title: 'Choose a Style',
        description: 'Browse tailor designs or start from scratch with our custom designer tool.',
    },
    {
        icon: Palette,
        number: 2,
        title: 'Customize It',
        description: 'Pick fabric, colors, and measurements for a perfect personal fit.',
    },
    {
        icon: DollarSign,
        number: 3,
        title: 'Place Your Order',
        description: 'Confirm your design and pay securely. No hidden fees, ever.',
    },
    {
        icon: ShoppingBag,
        number: 4,
        title: 'Get It Delivered',
        description: 'Your garment is crafted locally and delivered straight to your door.',
    },
];

export function ProcessSection() {
    return (
        <section id="how-it-works" className="py-16 md:py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        From idea to finished garment in four simple steps.
                    </p>
                </motion.div>

                {/* Steps row */}
                <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Horizontal connector line (desktop only) */}
                    <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-slate-200 z-0" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative z-10 flex flex-col items-center text-center"
                        >
                            {/* Circle icon with number badge */}
                            <div className="relative mb-6">
                                <div className="w-20 h-20 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                                    <step.icon className="w-8 h-8 text-slate-700" />
                                </div>
                                {/* Number badge */}
                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                    {step.number}
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-900 mb-2 text-base">{step.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-[180px]">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
