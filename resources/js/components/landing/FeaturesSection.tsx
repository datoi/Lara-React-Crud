import { motion } from 'motion/react';
import { Users, Sliders, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Local Georgian Tailors',
        description:
            'Every tailor on Kere is vetted and based in Georgia. Support local craftspeople while getting world-class quality.',
    },
    {
        icon: Sliders,
        title: 'Full Creative Control',
        description:
            'Choose from existing designs or build your own from scratch. Specify exact measurements, fabric, color — everything.',
    },
    {
        icon: ShieldCheck,
        title: 'Quality Guarantee',
        description:
            "Not satisfied? We'll make it right. Every order is backed by our satisfaction guarantee and revision policy.",
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
                        Why choose Kere?
                    </h2>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        We connect you with the best local tailors so you can get exactly what you want.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="bg-slate-50 rounded-2xl p-8 border border-slate-100 transition-shadow hover:shadow-md"
                        >
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6">
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
