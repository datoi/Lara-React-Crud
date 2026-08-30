import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface Props {
    onAddProduct: () => void;
}

export function OnboardingPanel({ onAddProduct }: Props) {
    const { t } = useTranslation();

    const STEPS = [
        { num: '1', label: t('tailorComponents.step1Label'), desc: t('tailorComponents.step1Desc') },
        { num: '2', label: t('tailorComponents.step2Label'), desc: t('tailorComponents.step2Desc') },
        { num: '3', label: t('tailorComponents.step3Label'), desc: t('tailorComponents.step3Desc') },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white"
        >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                {t('tailorComponents.gettingStarted')}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold mb-1.5">{t('tailorComponents.onboardingHeading')}</h2>
            <div className="mt-7 flex flex-col sm:flex-row gap-5 mb-8">
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

            <Button
                variant="default"
                size="default"
                onClick={onAddProduct}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold flex items-center gap-2"
            >
                {t('tailorComponents.addFirstProductBtn')}
                <ArrowRight className="w-4 h-4" />
            </Button>
        </motion.div>
    );
}
