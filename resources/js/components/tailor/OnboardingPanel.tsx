import { CheckCircle, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface Props {
    profileComplete: boolean;
    productsCount: number;
    onAddProduct: () => void;
    onEditProfile: () => void;
}

export function OnboardingPanel({ profileComplete, productsCount, onAddProduct, onEditProfile }: Props) {
    const { t } = useTranslation();
    const productsReady = productsCount >= 3;
    const steps = [
        { done: profileComplete, label: t('tailorComponents.completeProfileItem') },
        { done: productsReady, label: t('tailorComponents.listProducts', { goal: 3 }) },
        { done: profileComplete && productsReady, label: t('tailorComponents.readyForOrders') },
    ];
    const current = steps.findIndex(step => !step.done);
    return (
        <section className="studio-checklist" aria-labelledby="studio-start-title">
            <h2 id="studio-start-title">{t('studio.startHere')}</h2>
            <ol>
                {steps.map((step, index) => <li key={step.label} aria-current={index === current ? 'step' : undefined}>
                    {step.done ? <CheckCircle aria-hidden="true" /> : <Circle aria-hidden="true" />}
                    <span>{step.label}</span>
                    {(step.done || index === current) && <small className={step.done ? 'studio-step-done' : 'studio-step-next'}>{t(step.done ? 'studio.done' : 'studio.next')}</small>}
                </li>)}
            </ol>
            <p>{t('studio.productProgress', { count: productsCount })}</p>
            <Button type="button" variant="link" onClick={profileComplete ? onAddProduct : onEditProfile} className="studio-text-action h-auto px-0">
                {t(profileComplete ? 'studio.goToProducts' : 'tailorComponents.editProfileTitle')}
            </Button>
        </section>
    );
}
