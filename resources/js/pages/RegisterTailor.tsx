import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
    ArrowLeft,
    ArrowRight,
    Clock,
    Eye,
    EyeOff,
    Loader2,
    Mail,
    Smartphone,
} from 'lucide-react';
import { PhoneInput } from '../components/PhoneInput';
import { OtpStep } from '../components/OtpStep';
import { saveAuth, type AuthUser } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface FormState {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
}

const EMPTY: FormState = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
};

type Step = 'form' | 'email-otp' | 'phone-otp';

export default function RegisterTailor() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [step, setStep] = useState<Step>('form');
    const [form, setForm] = useState<FormState>(EMPTY);
    const [errors, setErrors] = useState<
        Partial<FormState & { general: string }>
    >({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);

    const [verificationId, setVerificationId] = useState('');
    const [contactHint, setContactHint] = useState('');

    const set =
        (field: keyof FormState) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            setForm((current) => ({
                ...current,
                [field]: event.target.value,
            }));

            setErrors((current) => ({
                ...current,
                [field]: undefined,
                general: undefined,
            }));
        };

    function validate(): boolean {
        const nextErrors: Partial<
            FormState & { general: string }
        > = {};

        if (!form.first_name.trim()) {
            nextErrors.first_name = t('register.errorRequired');
        }

        if (!form.last_name.trim()) {
            nextErrors.last_name = t('register.errorRequired');
        }

        if (
            form.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ) {
            nextErrors.email = t('register.errorInvalidEmail');
        }

        if (!form.phone.trim()) {
            nextErrors.phone = t('register.errorRequired');
        }

        if (!form.password) {
            nextErrors.password = t('register.errorRequired');
        } else if (form.password.length < 8) {
            nextErrors.password = t('register.errorMinPassword');
        }

        if (form.password !== form.password_confirmation) {
            nextErrors.password_confirmation = t(
                'register.errorPasswordMatch',
            );
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/register/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    ...form,
                    email: form.email.trim() || null,
                    role: 'tailor',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const mapped: Partial<FormState> = {};

                    for (const [key, value] of Object.entries(
                        data.errors,
                    )) {
                        (
                            mapped as Record<string, string>
                        )[key] = (value as string[])[0];
                    }

                    setErrors(mapped);
                } else {
                    setErrors({
                        general:
                            data.message ??
                            t(
                                'register.errorRegistrationFailed',
                            ),
                    });
                }

                return;
            }

            setVerificationId(data.verification_id);

            if (data.channel === 'phone') {
                setContactHint(data.phone ?? form.phone);
                setStep('phone-otp');
            } else {
                setContactHint(data.email ?? form.email);
                setStep('email-otp');
            }
        } catch {
            setErrors({
                general: t('register.errorNetwork'),
            });
        } finally {
            setLoading(false);
        }
    }

    function handleVerified(data: Record<string, unknown>) {
        const user = data.user as AuthUser;

        saveAuth(user, data.token as string);

        if (user.approval_status === 'pending') {
            setPendingApproval(true);
        } else {
            navigate('/tailor-dashboard');
        }
    }

    const inputClass = (hasError: boolean) =>
        [
            'h-11 w-full rounded-md border bg-white px-3.5 text-sm text-[#1A1A1A]',
            'placeholder:text-black/30',
            'outline-none transition duration-200',
            'focus:border-black focus:ring-1 focus:ring-black/10',
            hasError
                ? 'border-[#6F1D24]'
                : 'border-black/15',
        ].join(' ');

    if (pendingApproval) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F3F2EF] px-5 py-10">
                <motion.main
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="w-full max-w-[520px] bg-white px-8 py-12 text-center sm:px-12"
                >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/15">
                        <Clock className="h-5 w-5 stroke-[1.5]" />
                    </div>

                    <h1 className="mt-7 font-serif text-4xl font-medium leading-tight tracking-[-0.04em] text-[#181818]">
                        {t('register.tailorPendingTitle')}
                    </h1>

                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-black/50">
                        {t('register.tailorPendingDesc')}
                    </p>

                    <Link
                        to="/"
                        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#181818] px-6 text-sm font-medium text-white transition hover:bg-black/80"
                    >
                        {t('register.tailorPendingBack')}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F2EF] px-4 py-6 text-[#181818] sm:px-6 md:py-10">
            <motion.main
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-[1280px] overflow-hidden bg-white lg:grid-cols-[0.92fr_1.08fr]"
            >
                {/* Left: registration form */}
                <section className="flex min-h-[720px] flex-col px-6 py-6 sm:px-10 sm:py-8 lg:px-14 xl:px-20">
                    <header className="flex items-center justify-between">
                        <Link
                            to="/partners"
                            aria-label="Back"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition hover:bg-black hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>

                        <Link
                            to="/"
                            className="font-serif text-3xl font-medium tracking-[-0.05em]"
                        >
                            Kere
                        </Link>

                        <Link
                            to="/login/tailor"
                            className="text-[11px] font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-45"
                        >
                            {t('register.signIn')}
                        </Link>
                    </header>

                    <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
                        <AnimatePresence mode="wait">
                        {step === 'form' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="mb-8 text-center">
                                <h1 className="font-serif text-[clamp(2.4rem,4vw,3.7rem)] font-medium leading-[0.96] tracking-[-0.05em]">
                                    {t('register.tailorTitle')}
                                </h1>

                                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-black/45">
                                    {t('register.tailorSubtitle')}
                                </p>
                            </div>

                            {errors.general && (
                                <div className="mb-5 rounded-md border border-[#6F1D24]/20 bg-[#6F1D24]/5 px-4 py-3 text-sm text-[#6F1D24]">
                                    {errors.general}
                                </div>
                            )}

                            <form
                                onSubmit={handleSubmit}
                                noValidate
                                className="space-y-4"
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="tailor-first-name"
                                            className="mb-1.5 block text-xs font-medium"
                                        >
                                            {t('register.firstName')}
                                        </label>

                                        <input
                                            id="tailor-first-name"
                                            type="text"
                                            value={form.first_name}
                                            onChange={set('first_name')}
                                            placeholder={t(
                                                'register.firstNamePlaceholder',
                                            )}
                                            autoComplete="given-name"
                                            className={inputClass(
                                                Boolean(errors.first_name),
                                            )}
                                        />

                                        {errors.first_name && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">
                                                {errors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="tailor-last-name"
                                            className="mb-1.5 block text-xs font-medium"
                                        >
                                            {t('register.lastName')}
                                        </label>

                                        <input
                                            id="tailor-last-name"
                                            type="text"
                                            value={form.last_name}
                                            onChange={set('last_name')}
                                            placeholder={t(
                                                'register.lastNamePlaceholder',
                                            )}
                                            autoComplete="family-name"
                                            className={inputClass(
                                                Boolean(errors.last_name),
                                            )}
                                        />

                                        {errors.last_name && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">
                                                {errors.last_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="tailor-email"
                                        className="mb-1.5 block text-xs font-medium"
                                    >
                                        {t('register.email')}{' '}
                                        <span className="font-normal text-black/40">
                                            ({t('register.optional')})
                                        </span>
                                    </label>

                                    <input
                                        id="tailor-email"
                                        type="email"
                                        value={form.email}
                                        onChange={set('email')}
                                        placeholder={t(
                                            'register.emailPlaceholder',
                                        )}
                                        autoComplete="email"
                                        className={inputClass(
                                            Boolean(errors.email),
                                        )}
                                    />

                                    {errors.email && (
                                        <p className="mt-1.5 text-xs text-[#6F1D24]">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium">
                                        {t('register.phone')}
                                    </label>

                                    <PhoneInput
                                        value={form.phone}
                                        onChange={(phone) => {
                                            setForm((current) => ({
                                                ...current,
                                                phone,
                                            }));

                                            setErrors((current) => ({
                                                ...current,
                                                phone: undefined,
                                                general: undefined,
                                            }));
                                        }}
                                        error={Boolean(errors.phone)}
                                    />

                                    {errors.phone && (
                                        <p className="mt-1.5 text-xs text-[#6F1D24]">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="tailor-password"
                                        className="mb-1.5 block text-xs font-medium"
                                    >
                                        {t('register.password')}
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="tailor-password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={form.password}
                                            onChange={set('password')}
                                            placeholder={t(
                                                'register.passwordPlaceholder',
                                            )}
                                            autoComplete="new-password"
                                            className={`${inputClass(
                                                Boolean(errors.password),
                                            )} pr-11`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (current) => !current,
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/35 transition hover:text-black"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="mt-1.5 text-xs text-[#6F1D24]">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="tailor-password-confirmation"
                                        className="mb-1.5 block text-xs font-medium"
                                    >
                                        {t(
                                            'register.confirmPassword',
                                        )}
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="tailor-password-confirmation"
                                            type={
                                                showConfirm
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={
                                                form.password_confirmation
                                            }
                                            onChange={set(
                                                'password_confirmation',
                                            )}
                                            placeholder={t(
                                                'register.confirmPasswordPlaceholder',
                                            )}
                                            autoComplete="new-password"
                                            className={`${inputClass(
                                                Boolean(
                                                    errors.password_confirmation,
                                                ),
                                            )} pr-11`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirm(
                                                    (current) => !current,
                                                )
                                            }
                                            aria-label={
                                                showConfirm
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/35 transition hover:text-black"
                                        >
                                            {showConfirm ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password_confirmation && (
                                        <p className="mt-1.5 text-xs text-[#6F1D24]">
                                            {
                                                errors.password_confirmation
                                            }
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#181818] px-6 text-sm font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t(
                                                'register.sendingCode',
                                            )}
                                        </>
                                    ) : (
                                        t('register.joinAsTailor')
                                    )}
                                </button>
                            </form>

                            <div className="mt-7 space-y-2 text-center text-xs text-black/45">
                                <p>
                                    {t('register.haveAccount')}{' '}
                                    <Link
                                        to="/login/tailor"
                                        className="font-medium text-black underline underline-offset-4"
                                    >
                                        {t('register.signIn')}
                                    </Link>
                                </p>

                                <p>
                                    {t('register.lookingToOrder')}{' '}
                                    <Link
                                        to="/register/customer"
                                        className="font-medium text-black underline underline-offset-4"
                                    >
                                        {t(
                                            'register.registerAsCustomer',
                                        )}
                                    </Link>
                                </p>
                            </div>
                        </motion.div>
                        )}

                        {step === 'phone-otp' && (
                        <motion.div
                            key="phone-otp"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <OtpStep
                                icon={<Smartphone className="w-6 h-6 text-slate-600" />}
                                title={t('register.verifyPhoneTitle')}
                                description={t('register.verifyPhoneDesc', { phone: contactHint })}
                                verificationId={verificationId}
                                otpType="phone"
                                endpoint="/api/register/verify-phone"
                                onSuccess={handleVerified}
                                onBack={() => setStep('form')}
                                isLastStep
                            />
                        </motion.div>
                        )}

                        {step === 'email-otp' && (
                        <motion.div
                            key="email-otp"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <OtpStep
                                icon={<Mail className="w-6 h-6 text-slate-600" />}
                                title={t('register.verifyEmailTitle')}
                                description={t('register.verifyEmailDesc', { email: contactHint })}
                                verificationId={verificationId}
                                otpType="email"
                                endpoint="/api/register/verify-email"
                                onSuccess={handleVerified}
                                onBack={() => setStep('form')}
                                isLastStep
                            />
                        </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Right: visual */}
                <aside className="relative hidden min-h-[720px] overflow-hidden p-3 lg:block">
                    <div className="relative h-full overflow-hidden rounded-[30px]">
                        <img
                            src="/assets/partners/register-tailor.jpg"
                            alt=""
                            className="h-full w-full object-cover object-center"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />
                    </div>
                </aside>
            </motion.main>
        </div>
    );
}
