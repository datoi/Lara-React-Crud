import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
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

const RESEND_COOLDOWN = 60;

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
                                        <div className="mb-5 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-3">
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
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.first_name ? 'border-slate-400' : 'border-slate-200'}`}
                                                />
                                                {formErrors.first_name && <p className="text-xs text-slate-600 mt-1">{formErrors.first_name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.lastName')}</label>
                                                <input
                                                    type="text"
                                                    value={form.last_name}
                                                    onChange={setField('last_name')}
                                                    placeholder={t('register.lastNamePlaceholder')}
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.last_name ? 'border-slate-400' : 'border-slate-200'}`}
                                                />
                                                {formErrors.last_name && <p className="text-xs text-slate-600 mt-1">{formErrors.last_name}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.email')}</label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={setField('email')}
                                                placeholder={t('register.emailPlaceholder')}
                                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.email ? 'border-slate-400' : 'border-slate-200'}`}
                                            />
                                            {formErrors.email && <p className="text-xs text-slate-600 mt-1">{formErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.phone')}</label>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={setField('phone')}
                                                placeholder={t('register.phonePlaceholder')}
                                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.phone ? 'border-slate-400' : 'border-slate-200'}`}
                                            />
                                            {formErrors.phone && <p className="text-xs text-slate-600 mt-1">{formErrors.phone}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.password')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={form.password}
                                                    onChange={setField('password')}
                                                    placeholder={t('register.passwordPlaceholder')}
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.password ? 'border-slate-400' : 'border-slate-200'}`}
                                                />
                                                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {formErrors.password && <p className="text-xs text-slate-600 mt-1">{formErrors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.confirmPassword')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirm ? 'text' : 'password'}
                                                    value={form.password_confirmation}
                                                    onChange={setField('password_confirmation')}
                                                    placeholder={t('register.confirmPasswordPlaceholder')}
                                                    className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${formErrors.password_confirmation ? 'border-slate-400' : 'border-slate-200'}`}
                                                />
                                                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            {formErrors.password_confirmation && <p className="text-xs text-slate-600 mt-1">{formErrors.password_confirmation}</p>}
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

// ─── OTP input step ───────────────────────────────────────────────────────────

interface OtpStepProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    verificationId: string;
    otpType: 'email' | 'phone';
    endpoint: string;
    onSuccess: (data: Record<string, unknown>) => void;
    onBack: () => void;
    isLastStep?: boolean;
}

function OtpStep({ icon, title, description, verificationId, otpType, endpoint, onSuccess, onBack, isLastStep }: OtpStepProps) {
    const { t } = useTranslation();
    const [digits, setDigits]     = useState(['', '', '', '', '', '']);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startCooldown = () => {
        setCooldown(RESEND_COOLDOWN);
        timerRef.current = setInterval(() => {
            setCooldown(c => {
                if (c <= 1) { clearInterval(timerRef.current!); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const code = digits.join('');

    const handleDigit = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...digits];
        next[i] = val.slice(-1);
        setDigits(next);
        setError('');
        if (val && i < 5) inputRefs.current[i + 1]?.focus();
        if (val && i === 5 && next.every(d => d)) submitCode(next.join(''));
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const next = pasted.split('');
            setDigits(next);
            inputRefs.current[5]?.focus();
            submitCode(pasted);
        }
    };

    const submitCode = async (codeStr: string) => {
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ verification_id: verificationId, code: codeStr }),
            });
            const data = await res.json();
            if (res.status === 410) {
                setError(t('register.sessionExpired'));
                setTimeout(() => onBack(), 2000);
                return;
            }
            if (!res.ok) {
                setError(data.message ?? t('register.incorrectCode'));
                setDigits(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                return;
            }
            onSuccess(data as Record<string, unknown>);
        } catch {
            setError(t('register.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resending || cooldown > 0) return;
        setResending(true);
        setError('');
        try {
            const res = await fetch('/api/register/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ verification_id: verificationId, type: otpType }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message ?? t('register.resendFailed')); return; }
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            startCooldown();
        } catch {
            setError(t('register.errorNetwork'));
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {icon}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
                <p className="text-slate-500 text-sm">{description}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                {error && (
                    <div className="mb-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={e => handleDigit(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            disabled={loading}
                            className={`w-11 h-14 text-center text-xl font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${
                                error ? 'border-slate-400 bg-slate-50' : d ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                            } disabled:opacity-50`}
                        />
                    ))}
                </div>

                <Button
                    type="button"
                    disabled={code.length < 6 || loading}
                    onClick={() => submitCode(code)}
                    className="w-full bg-slate-900 hover:bg-slate-700 text-white h-11"
                >
                    {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isLastStep ? t('register.creatingAccount') : t('register.verifying')}</>
                        : isLastStep ? t('register.createAccount') : t('register.verify')}
                </Button>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || cooldown > 0}
                        className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
                    >
                        {resending
                            ? t('register.resendSending')
                            : cooldown > 0
                            ? t('register.resendCooldown', { s: cooldown })
                            : t('register.resendPrompt')}
                    </button>
                </div>
            </div>

            <div className="mt-5 text-center">
                <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    ← {t('register.stepDetails')}
                </button>
            </div>
        </>
    );
}
