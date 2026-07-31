import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PhoneInput } from '../components/PhoneInput';
import { OtpStep } from '../components/OtpStep';
import { saveAuth, type AuthUser } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
}

type Step = 'form' | 'email-otp';

const EMPTY: FormState = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function RegisterCustomer() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('form');

    const [form, setForm] = useState<FormState>(EMPTY);
    const [formErrors, setFormErrors] = useState<Partial<FormState & { general: string }>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [submitting, setSubmitting]     = useState(false);

    const [verificationId, setVerificationId] = useState('');
    const [emailHint, setEmailHint]           = useState('');

    const setField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setFormErrors(er => ({ ...er, [field]: undefined, general: undefined }));
    };

    function validateForm(): boolean {
        const e: Partial<FormState & { general: string }> = {};
        if (!form.first_name.trim())  e.first_name = t('register.errorRequired');
        if (!form.last_name.trim())   e.last_name  = t('register.errorRequired');
        if (!form.email.trim())       e.email      = t('register.errorRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('register.errorInvalidEmail');
        if (!form.phone.trim())       e.phone      = t('register.errorRequired');
        if (!form.password)           e.password   = t('register.errorRequired');
        else if (form.password.length < 8) e.password = t('register.errorMinPassword');
        if (form.password !== form.password_confirmation) e.password_confirmation = t('register.errorPasswordMatch');
        setFormErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/register/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ ...form, role: 'customer' }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const mapped: Partial<FormState> = {};
                    for (const [k, v] of Object.entries(data.errors)) {
                        (mapped as Record<string, string>)[k] = (v as string[])[0];
                    }
                    setFormErrors(mapped);
                } else {
                    setFormErrors({ general: data.message ?? t('register.errorRegistrationFailed') });
                }
                return;
            }

            setVerificationId(data.verification_id);
            setEmailHint(data.email ?? form.email);
            setStep('email-otp');
        } catch {
            setFormErrors({ general: t('register.errorNetwork') });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="customer-register-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
            <Navigation />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_28%,rgba(0,0,0,0)_62%)]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(78vw,720px)] w-[min(78vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035] bg-white/[0.025]" />

            <div data-nav-theme="dark" className="relative z-10 flex min-h-screen items-center justify-center px-5 py-16 pt-24">
                <div className="w-full max-w-7xl">
                    <AnimatePresence mode="wait">
                        {step === 'form' && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.35 }}
                                className="mx-auto w-full max-w-[520px] bg-black/42 px-5 py-6 backdrop-blur-[2px] sm:px-6"
                            >
                                <StepProgress current={1 as 1 | 2} />

                                <div className="mb-8 text-center">
                                    <Link
                                        to="/"
                                        className="mb-7 inline-block text-[18px] font-semibold uppercase tracking-[0.48em] text-white transition-opacity hover:opacity-80"
                                    >
                                        Kere
                                    </Link>
                                    <h1 className="font-serif text-[28px] font-medium leading-none text-white sm:text-[34px]">{t('register.customerTitle')}</h1>
                                    <p className="mx-auto mt-3 max-w-[360px] text-xs leading-5 text-white/72">{t('register.customerSubtitle')}</p>
                                </div>

                                <div>
                                    {formErrors.general && (
                                        <div className="mb-5 border border-white/25 bg-black/40 px-4 py-3 text-xs leading-5 text-white">
                                            {formErrors.general}
                                        </div>
                                    )}

                                    <form onSubmit={handleFormSubmit} noValidate className="space-y-5">
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-[10px] font-semibold leading-none text-white/78">{t('register.firstName')}</label>
                                                <input
                                                    type="text"
                                                    value={form.first_name}
                                                    onChange={setField('first_name')}
                                                    placeholder={t('register.firstNamePlaceholder')}
                                                    className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${formErrors.first_name ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                                                />
                                                {formErrors.first_name && <p className="mt-2 text-[10px] font-medium text-white/82">{formErrors.first_name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold leading-none text-white/78">{t('register.lastName')}</label>
                                                <input
                                                    type="text"
                                                    value={form.last_name}
                                                    onChange={setField('last_name')}
                                                    placeholder={t('register.lastNamePlaceholder')}
                                                    className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${formErrors.last_name ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                                                />
                                                {formErrors.last_name && <p className="mt-2 text-[10px] font-medium text-white/82">{formErrors.last_name}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-semibold leading-none text-white/78">{t('register.email')}</label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={setField('email')}
                                                placeholder={t('register.emailPlaceholder')}
                                                className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${formErrors.email ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                                            />
                                            {formErrors.email && <p className="mt-2 text-[10px] font-medium text-white/82">{formErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-semibold leading-none text-white/78">{t('register.phone')}</label>
                                            <PhoneInput
                                                value={form.phone}
                                                onChange={phone => {
                                                    setForm(f => ({ ...f, phone }));
                                                    setFormErrors(er => ({ ...er, phone: undefined, general: undefined }));
                                                }}
                                                error={!!formErrors.phone}
                                            />
                                            {formErrors.phone && <p className="mt-2 text-[10px] font-medium text-white/82">{formErrors.phone}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-semibold leading-none text-white/78">{t('register.password')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={form.password}
                                                    onChange={setField('password')}
                                                    placeholder={t('register.passwordPlaceholder')}
                                                    className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 pr-8 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${formErrors.password ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                                                />
                                                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/65 transition-colors hover:text-white">
                                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                            {formErrors.password && <p className="mt-2 text-[10px] font-medium text-white/82">{formErrors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-semibold leading-none text-white/78">{t('register.confirmPassword')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirm ? 'text' : 'password'}
                                                    value={form.password_confirmation}
                                                    onChange={setField('password_confirmation')}
                                                    placeholder={t('register.confirmPasswordPlaceholder')}
                                                    className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 pr-8 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${formErrors.password_confirmation ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                                                />
                                                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/65 transition-colors hover:text-white">
                                                    {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                            {formErrors.password_confirmation && <p className="mt-2 text-[10px] font-medium text-white/82">{formErrors.password_confirmation}</p>}
                                        </div>

                                        <Button type="submit" disabled={submitting} className="mt-2 h-11 w-full rounded-xl border border-white/22 bg-white/20 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_14px_40px_rgba(0,0,0,0.25)] transition-colors hover:bg-white hover:text-[#111111]">
                                            {submitting
                                                ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{t('register.sendingCode')}</>
                                                : t('register.continue')}
                                        </Button>
                                    </form>
                                </div>

                                <p className="mt-6 text-center text-[10px] font-medium text-white/70">
                                    {t('register.haveAccount')}{' '}
                                    <Link to="/login/customer" className="font-bold text-white transition-colors hover:text-white/75">{t('register.signIn')}</Link>
                                </p>
                                <p className="mt-2 text-center text-[10px] font-medium text-white/70">
                                    {t('register.joiningAsTailor')}{' '}
                                    <Link to="/register/tailor" className="font-bold text-white transition-colors hover:text-white/75">{t('register.registerHere')}</Link>
                                </p>
                            </motion.div>
                        )}

                        {step === 'email-otp' && (
                            <motion.div
                                key="email-otp"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.35 }}
                                className="mx-auto w-full max-w-[420px] bg-black/42 px-5 py-6 backdrop-blur-[2px] sm:px-6"
                            >
                                <StepProgress current={2 as 1 | 2} />
                                <OtpStep
                                    icon={<Mail className="h-6 w-6 text-white" />}
                                    title={t('register.verifyEmailTitle')}
                                    description={t('register.verifyEmailDesc', { email: emailHint })}
                                    verificationId={verificationId}
                                    otpType="email"
                                    endpoint="/api/register/verify-email"
                                    onSuccess={(data) => {
                                        saveAuth(data.user as AuthUser, data.token as string);
                                        navigate('/customer-dashboard');
                                    }}
                                    onBack={() => setStep('form')}
                                    isLastStep
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ─── Step progress indicator ─────────────────────────────────────────────────

function StepProgress({ current }: { current: 1 | 2 }) {
    const { t } = useTranslation();
    const steps = [
        { n: 1, label: t('register.stepDetails') },
        { n: 2, label: t('register.stepEmail') },
    ];
    return (
        <div className="mb-8 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 ${current === s.n ? 'text-white' : current > s.n ? 'text-white/62' : 'text-white/38'}`}>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                            current > s.n
                                ? 'border-white bg-white text-[#111111]'
                                : current === s.n
                                ? 'border-white text-white'
                                : 'border-white/24 text-white/38'
                        }`}>
                            {current > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
                        </div>
                        <span className="hidden text-[10px] font-medium sm:block">{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-px w-8 transition-colors ${current > s.n ? 'bg-white' : 'bg-white/20'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}
