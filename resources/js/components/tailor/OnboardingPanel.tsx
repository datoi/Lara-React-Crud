import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface Props {
    onAddProduct: () => void;
    onEditProfile: () => void;
}

export function OnboardingPanel({ onAddProduct, onEditProfile }: Props) {
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
            className="tailor-studio-onboarding"
        >
            <p className="text-[10px] font-normal uppercase tracking-widest text-[var(--store-muted)] mb-3">
                {t('tailorComponents.gettingStarted')}
            </p>
            <h2 className="font-serif text-xl sm:text-2xl font-normal mb-1.5">{t('tailorComponents.onboardingHeading')}</h2>
            <div className="mt-7 flex flex-col sm:flex-row gap-5 mb-8">
                {STEPS.map((step) => (
                    <div key={step.num.padStart(2, '0')} className="flex items-start gap-3 flex-1 relative">
                        <div className="w-7 shrink-0 pt-0.5">
                            <span className="font-serif text-xl font-normal text-brand">{step.num.padStart(2, '0')}</span>
                        </div>
                        <div className="pt-0.5">
                            <p className="text-xs font-medium text-[var(--store-ink)] leading-relaxed">{step.label}</p>
                            <p className="text-[11px] text-[var(--store-muted)] mt-1 leading-relaxed">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
            <Button
                variant="default"
                size="default"
                onClick={onAddProduct}
                className="rounded-none bg-brand text-white hover:bg-brand-dark text-xs font-normal flex items-center gap-2"
            >
                {t('tailorComponents.addFirstProductBtn')}
                <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={onEditProfile} className="rounded-none border-[var(--store-rule)] bg-transparent text-xs font-normal text-[var(--store-ink)]">
                {t('tailorComponents.editProfileTitle')}
            </Button>
            </div>
        </motion.div>
    );
}
