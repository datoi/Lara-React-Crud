import { motion } from 'motion/react';
import { BadgeCheck, Ruler, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FeaturesSection() {
    const { t } = useTranslation();

    const guarantees = [
        {
            icon: BadgeCheck,
            title: t('features.verifiedTailorsTitle'),
            description: t('features.verifiedTailorsDesc'),
        },
        {
            icon: Ruler,
            title: t('features.customFitTitle'),
            description: t('features.customFitDesc'),
        },
        {
            icon: ShieldCheck,
            title: t('features.qualityTitle'),
            description: t('features.qualityDesc'),
        },
    ];

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
                    <h2 className="font-serif text-3xl md:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
                        {t('features.sectionTitle')}
                    </h2>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        {t('features.sectionSubtitle')}
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
                            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center mb-5">
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
