import { motion } from 'motion/react';
import { RotateCcw, Clock, Lock, ThumbsUp } from 'lucide-react';

const guarantees = [
    {
        icon: ThumbsUp,
        title: 'Satisfaction Guaranteed',
        description: "If you're not happy with the result, we'll arrange a free revision or full refund.",
    },
    {
        icon: Clock,
        title: 'On-Time Delivery',
        description: 'We commit to realistic deadlines and keep you updated every step of the way.',
    },
    {
        icon: Lock,
        title: 'Secure Payments',
        description: 'Your payment is held safely until you confirm you love your order.',
    },
    {
        icon: RotateCcw,
        title: 'Free Revisions',
        description: 'Minor adjustments? No problem. Every order includes one free revision.',
    },
];

export function GuaranteeSection() {
    return (
        <section className="py-16 md:py-24 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-14"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Our promise to you</h2>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        We hold ourselves to the highest standards so you can order with complete confidence.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {guarantees.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="border border-slate-700 rounded-2xl p-6 hover:border-slate-500 transition-colors"
                        >
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                                <item.icon className="w-5 h-5 text-slate-300" />
                            </div>
                            <h3 className="font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
