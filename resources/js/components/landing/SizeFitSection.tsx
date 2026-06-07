import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Pencil, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MeasurementGuideModal } from '../MeasurementGuideModal';

export function SizeFitSection() {
    const [guideOpen, setGuideOpen] = useState(false);
    const { t } = useTranslation();

    const features = [
        {
            icon: FileText,
            title: t('sizeFit.step1Title'),
            description: t('sizeFit.step1Desc'),
        },
        {
            icon: Pencil,
            title: t('sizeFit.step2Title'),
            description: t('sizeFit.step2Desc'),
        },
        {
            icon: CheckCircle,
            title: t('sizeFit.step3Title'),
            description: t('sizeFit.step3Desc'),
        },
    ];

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left — text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            {t('sizeFit.title')}
                        </h2>
                        <p className="text-slate-500 text-base mb-8 leading-relaxed">
                            {t('sizeFit.subtitle')}
                        </p>

                        <div className="space-y-6 mb-8">
                            {features.map((f, i) => (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    className="flex gap-4 items-start"
                                >
                                    <div className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 bg-white">
                                        <f.icon className="w-4 h-4 text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 mb-1">{f.title}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setGuideOpen(true)}
                            className="border border-slate-900 text-slate-900 text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {t('sizeFit.viewGuide')}
                        </motion.button>
                    </motion.div>

                    {/* Right — image */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-2xl overflow-hidden aspect-[4/3]"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop"
                            alt="Fabric and measuring tape"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-300 mb-1">
                                {t('sizeFit.badgeTop')}
                            </p>
                            <p className="text-white text-lg font-semibold">{t('sizeFit.badgeBottom')}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <MeasurementGuideModal
                open={guideOpen}
                onClose={() => setGuideOpen(false)}
                initialStep="chest"
            />
        </section>
    );
}
