import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PhoneInput } from '../components/PhoneInput';
import { OtpStep } from '../components/OtpStep';
import { saveAuth, type AuthUser } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

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
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                </div>
            </nav>

            <div className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatePresence mode="wait">
                        {step === 'form' && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.35 }}
                                className="max-w-lg mx-auto"
                            >
                                <StepProgress current={1 as 1 | 2} />

                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('register.customerTitle')}</h1>
                                    <p className="text-slate-500">{t('register.customerSubtitle')}</p>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                                    {formErrors.general && (
                                        <div className="mb-5 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
                                            {formErrors.general}
                                        </div>
                                    )}

                                    <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.firstName')}</label>
                                                <input
                                                    type="text"
                                                    value={form.first_name}
                                                    onChange={setField('first_name')}
                                                    placeholder={t('register.firstNamePlaceholder')}
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.first_name ? 'border-destructive' : 'border-slate-200'}`}
                                                />
                                                {formErrors.first_name && <p className="text-xs text-destructive mt-1">{formErrors.first_name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.lastName')}</label>
                                                <input
                                                    type="text"
                                                    value={form.last_name}
                                                    onChange={setField('last_name')}
                                                    placeholder={t('register.lastNamePlaceholder')}
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.last_name ? 'border-destructive' : 'border-slate-200'}`}
                                                />
                                                {formErrors.last_name && <p className="text-xs text-destructive mt-1">{formErrors.last_name}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.email')}</label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={setField('email')}
                                                placeholder={t('register.emailPlaceholder')}
                                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.email ? 'border-destructive' : 'border-slate-200'}`}
                                            />
                                            {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.phone')}</label>
                                            <PhoneInput
                                                value={form.phone}
                                                onChange={phone => {
                                                    setForm(f => ({ ...f, phone }));
                                                    setFormErrors(er => ({ ...er, phone: undefined, general: undefined }));
                                                }}
                                                error={!!formErrors.phone}
                                            />
                                            {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.password')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={form.password}
                                                    onChange={setField('password')}
                                                    placeholder={t('register.passwordPlaceholder')}
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.password ? 'border-destructive' : 'border-slate-200'}`}
                                                />
                                                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {formErrors.password && <p className="text-xs text-destructive mt-1">{formErrors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.confirmPassword')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirm ? 'text' : 'password'}
                                                    value={form.password_confirmation}
                                                    onChange={setField('password_confirmation')}
                                                    placeholder={t('register.confirmPasswordPlaceholder')}
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.password_confirmation ? 'border-destructive' : 'border-slate-200'}`}
                                                />
                                                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {formErrors.password_confirmation && <p className="text-xs text-destructive mt-1">{formErrors.password_confirmation}</p>}
                                        </div>

                                        <Button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-slate-700 text-white h-11 mt-2">
                                            {submitting
                                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('register.sendingCode')}</>
                                                : t('register.continue')}
                                        </Button>
                                    </form>
                                </div>

                                <p className="text-center text-sm text-slate-500 mt-5">
                                    {t('register.haveAccount')}{' '}
                                    <Link to="/login/customer" className="text-slate-900 font-medium hover:underline">{t('register.signIn')}</Link>
                                </p>
                                <p className="text-center text-sm text-slate-500 mt-2">
                                    {t('register.joiningAsTailor')}{' '}
                                    <Link to="/register/tailor" className="text-slate-900 font-medium hover:underline">{t('register.registerHere')}</Link>
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
                                className="max-w-md mx-auto"
                            >
                                <StepProgress current={2 as 1 | 2} />
                                <OtpStep
                                    icon={<Mail className="w-6 h-6 text-slate-600" />}
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
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 ${current === s.n ? 'text-slate-900' : current > s.n ? 'text-slate-400' : 'text-slate-300'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors ${
                            current > s.n
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : current === s.n
                                ? 'border-slate-900 text-slate-900'
                                : 'border-slate-200 text-slate-300'
                        }`}>
                            {current > s.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                        </div>
                        <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-px w-8 transition-colors ${current > s.n ? 'bg-slate-900' : 'bg-slate-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

