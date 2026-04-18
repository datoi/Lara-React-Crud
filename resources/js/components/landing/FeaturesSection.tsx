import { motion } from 'motion/react';
import { BadgeCheck, Ruler, ShieldCheck } from 'lucide-react';

const guarantees = [
    {
        icon: BadgeCheck,
        title: 'Verified Local Tailors',
        description: 'Every tailor on Kere is a verified Georgian craftsperson. Made by real local tailors — not factories.',
    },
    {
        icon: Ruler,
        title: 'Custom-Fit Guarantee',
        description: "Your garment is made to your exact measurements. If it doesn't fit perfectly, your tailor will adjust it.",
    },
    {
        icon: ShieldCheck,
        title: 'Quality Assurance',
        description: 'Every piece is inspected before delivery to ensure it meets our standards.',
    },
];

export function FeaturesSection() {
    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-14"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        The Kere Guarantee
                    </h2>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        Your peace of mind is our priority
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-10">
                    {guarantees.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-5">
                                <item.icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{item.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
