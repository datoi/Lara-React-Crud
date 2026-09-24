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
import { serverMessageKey } from '../lib/serverMessage';
import { TAILOR_HOME } from '../lib/tailorAccess';

interface FormState {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    business_type: string;
    does_remodeling: '' | 'yes' | 'no';
    workspace_address: string;
    experience_band: string;
    legal_status: string;
    national_id: string;
}

const EMPTY: FormState = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    business_type: '',
    does_remodeling: '',
    workspace_address: '',
    experience_band: '',
    legal_status: '',
    national_id: '',
};

/** All three are mandatory; the server records the set, not each box. */
interface ConsentState {
    accept_partnership_terms: boolean;
    accept_data_processing: boolean;
    confirm_information_correct: boolean;
}

const NO_CONSENT: ConsentState = {
    accept_partnership_terms: false,
    accept_data_processing: false,
    confirm_information_correct: false,
};

/** Values mirror AuthController's validation — the server is what enforces them. */
const BUSINESS_TYPES = ['independent', 'atelier', 'workshop', 'designer'] as const;
const EXPERIENCE_BANDS = ['under_1', '1_3', '3_5', '5_10', 'over_10'] as const;
const LEGAL_STATUSES = ['individual', 'sole_trader', 'llc', 'other'] as const;

/** Which questions live on which page of the form. */
const PAGE_FIELDS: Record<number, (keyof FormState)[]> = {
    1: ['first_name', 'last_name', 'email', 'phone', 'password', 'password_confirmation'],
    2: ['business_type', 'does_remodeling', 'workspace_address', 'experience_band'],
    3: ['legal_status', 'national_id'],
};

/** A message per field, not a value: errors are strings whatever the field holds. */
type FormErrors = Partial<Record<keyof FormState | 'general', string>>;

const LAST_PAGE = 3;

type Step = 'form' | 'email-otp' | 'phone-otp';

export default function RegisterTailor() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [step, setStep] = useState<Step>('form');
    const [page, setPage] = useState(1);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [consent, setConsent] = useState<ConsentState>(NO_CONSENT);
    const [consentError, setConsentError] = useState('');
    const [checkingContact, setCheckingContact] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
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

    const setChoice = (field: keyof FormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
    };

    const setConsentBox = (field: keyof ConsentState, value: boolean) => {
        setConsent((current) => ({ ...current, [field]: value }));
        setConsentError('');
    };

    /**
     * Validate one page of the form.
     *
     * Only the page in front of the tailor is checked, so pressing Next cannot
     * surface an error about a question they have not reached yet. The server
     * re-validates all of it regardless; this is only about where the cursor
     * goes.
     */
    function validatePage(target: number): boolean {
        const nextErrors: FormErrors = {};

        if (target === 2) {
            if (!form.business_type) nextErrors.business_type = t('register.errorRequired');
            if (!form.does_remodeling) nextErrors.does_remodeling = t('register.errorRequired');
            if (!form.workspace_address.trim()) nextErrors.workspace_address = t('register.errorRequired');
            if (!form.experience_band) nextErrors.experience_band = t('register.errorRequired');

            setErrors(nextErrors);

            return Object.keys(nextErrors).length === 0;
        }

        if (target === 3) {
            if (!form.legal_status) nextErrors.legal_status = t('register.errorRequired');
            if (!form.national_id.trim()) nextErrors.national_id = t('register.errorRequired');

            const allConsented =
                consent.accept_partnership_terms &&
                consent.accept_data_processing &&
                consent.confirm_information_correct;

            setConsentError(allConsented ? '' : t('register.errorConsentRequired'));
            setErrors(nextErrors);

            return Object.keys(nextErrors).length === 0 && allConsented;
        }

        return validate();
    }

    function validate(): boolean {
        const nextErrors: FormErrors = {};

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
        } else if (!/\d/.test(form.password)) {
            // The endpoint is shared and requires a digit. Without this the form
            // accepts a digitless password, walks the tailor through all three
            // pages, and bounces them back with "check this field" and no hint
            // of what is wrong — so the next attempt is another digitless one.
            nextErrors.password = t('register.errorPasswordNeedsNumber');
        }

        if (form.password !== form.password_confirmation) {
            nextErrors.password_confirmation = t(
                'register.errorPasswordMatch',
            );
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    /**
     * Ask whether the email and phone are already registered, and mark them here
     * if they are. Returns false when the page should not be left.
     *
     * A failure to reach the server is not treated as taken — the final submit
     * checks again and is the real gate, so a flaky moment must not block
     * someone whose details are perfectly fine.
     */
    async function contactIsFree(): Promise<boolean> {
        setCheckingContact(true);

        try {
            const response = await fetch('/api/register/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    email: form.email.trim() || null,
                    phone: form.phone.trim() || null,
                }),
            });

            if (!response.ok) return true;

            const data = await response.json();
            const taken: FormErrors = {};

            if (data.email_taken) taken.email = t('register.errorEmailTaken');
            if (data.phone_taken) taken.phone = t('register.errorPhoneTaken');

            if (Object.keys(taken).length > 0) {
                setErrors(taken);

                return false;
            }

            return true;
        } catch {
            return true;
        } finally {
            setCheckingContact(false);
        }
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!validatePage(page)) {
            return;
        }

        // Leaving the page that asked for them is the moment to find out whether
        // the email and phone are free. Only the server knows, and if it is left
        // to the final submit the tailor fills in two more pages before being
        // sent back here to be told.
        if (page === 1 && !(await contactIsFree())) {
            return;
        }

        // Next, until there is no next — the form submits only from the last page.
        if (page < LAST_PAGE) {
            setPage(page + 1);

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
                    ...consent,
                    email: form.email.trim() || null,
                    does_remodeling: form.does_remodeling === 'yes',
                    role: 'tailor',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const mapped: FormErrors = {};

                    for (const [key, value] of Object.entries(
                        data.errors,
                    )) {
                        // The server answers with a code for the failures a real
                        // person hits — a phone already registered, say — because
                        // its own wording is English and this form is not.
                        // Anything else falls back to a translated generic rather
                        // than printing Laravel's sentence into a Georgian page.
                        const code = (value as string[])[0];

                        (mapped as Record<string, string>)[key] = t(
                            serverMessageKey(code) ?? 'register.errorFieldInvalid',
                        );
                    }

                    setErrors(mapped);

                    // A rejected field may belong to a page the tailor has left
                    // — a phone taken since they typed it, say. Showing the
                    // error on a page that does not contain the field would
                    // look like nothing happened, so go back to the first page
                    // that owns one.
                    const rejected = Object.keys(mapped);
                    const target = Object.keys(PAGE_FIELDS)
                        .map(Number)
                        .sort()
                        .find((p) =>
                            PAGE_FIELDS[p].some((field) => rejected.includes(field)),
                        );

                    if (target) {
                        setPage(target);
                    }
                } else {
                    setErrors({
                        general: t(
                            serverMessageKey(data.code) ??
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
            <div className="kere-workflow-page flex min-h-screen items-center justify-center bg-[#F3F2EF] px-5 py-10">
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
                        to={TAILOR_HOME}
                        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-medium text-white transition hover:bg-brand-dark"
                    >
                        {t('register.tailorPendingBack')}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.main>
            </div>
        );
    }

    return (
        <div className="tailor-registration-page kere-workflow-page min-h-screen bg-[#F3F2EF] px-3 py-3 text-[#181818] sm:px-6 md:py-10">
            <motion.main
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-[1280px] overflow-hidden bg-white lg:grid-cols-[0.92fr_1.08fr]"
            >
                {/* Left: registration form */}
                <section className="flex min-w-0 flex-col px-4 py-5 lg:min-h-[720px] sm:px-10 sm:py-8 lg:px-14 xl:px-20">
                    <header className="flex items-center justify-between">
                        <Link
                            to="/partners"
                            aria-label="Back"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition hover:bg-brand-dark hover:text-white"
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

                    <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-6 sm:py-12">
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
                                <h1 className="font-serif text-[clamp(1.6rem,4vw,3.7rem)] font-medium leading-[1.15] tracking-[-0.05em]">
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
                                {/* Which of the three pages this is. Reads as progress
                                    rather than navigation: the pages are gated, so a dot
                                    is not a link. */}
                                <div className="mb-5 flex items-center gap-2" aria-hidden="true">
                                    {[1, 2, 3].map((n) => (
                                        <span
                                            key={n}
                                            className={`h-1 flex-1 rounded-full transition-colors duration-150 ${
                                                n <= page ? 'bg-[#6F1D24]' : 'bg-black/10'
                                            }`}
                                        />
                                    ))}
                                </div>

                                <p className="mb-4 text-xs text-black/45">
                                    {t('register.stepCounter', { current: page, total: LAST_PAGE })}
                                    {' — '}
                                    {t(`register.stepTitle${page}`)}
                                </p>

                                {page === 1 && (
                                <>
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

                                </>
                                )}

                                {page === 2 && (
                                <>
                                    <div>
                                        <label htmlFor="tailor-business-type" className="mb-1.5 block text-xs font-medium">
                                            {t('register.businessType')}
                                        </label>
                                        <select
                                            id="tailor-business-type"
                                            value={form.business_type}
                                            onChange={(e) => setChoice('business_type', e.target.value)}
                                            className={inputClass(Boolean(errors.business_type))}
                                        >
                                            <option value="">{t('register.choosePlaceholder')}</option>
                                            {BUSINESS_TYPES.map((value) => (
                                                <option key={value} value={value}>
                                                    {t(`register.business_type_${value}`)}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.business_type && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">{errors.business_type}</p>
                                        )}
                                    </div>

                                    <fieldset>
                                        <legend className="mb-1.5 block text-xs font-medium">
                                            {t('register.doesRemodeling')}
                                        </legend>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(['yes', 'no'] as const).map((answer) => (
                                                <label
                                                    key={answer}
                                                    className={`flex h-11 cursor-pointer items-center justify-center rounded-md border bg-[var(--kere-panel)] text-sm transition-colors hover:border-black has-[:checked]:border-[#6F1D24] has-[:checked]:bg-[#6F1D24] has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6F1D24] has-[:focus-visible]:ring-offset-2 ${errors.does_remodeling ? 'border-[#6F1D24]' : 'border-black/15'}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="does_remodeling"
                                                        value={answer}
                                                        checked={form.does_remodeling === answer}
                                                        onChange={() => setChoice('does_remodeling', answer)}
                                                        className="sr-only"
                                                    />
                                                    {t(answer === 'yes' ? 'register.doesRemodelingYes' : 'register.doesRemodelingNo')}
                                                </label>
                                            ))}
                                        </div>
                                        <p className="mt-1.5 text-xs text-black/45">{t('register.doesRemodelingHint')}</p>
                                        {errors.does_remodeling && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">{errors.does_remodeling}</p>
                                        )}
                                    </fieldset>

                                    <div>
                                        <label htmlFor="tailor-workspace" className="mb-1.5 block text-xs font-medium">
                                            {t('register.workspaceAddress')}
                                        </label>
                                        <input
                                            id="tailor-workspace"
                                            type="text"
                                            value={form.workspace_address}
                                            onChange={set('workspace_address')}
                                            placeholder={t('register.workspaceAddressPlaceholder')}
                                            className={inputClass(Boolean(errors.workspace_address))}
                                        />
                                        {errors.workspace_address && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">{errors.workspace_address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="tailor-experience" className="mb-1.5 block text-xs font-medium">
                                            {t('register.experienceBand')}
                                        </label>
                                        <select
                                            id="tailor-experience"
                                            value={form.experience_band}
                                            onChange={(e) => setChoice('experience_band', e.target.value)}
                                            className={inputClass(Boolean(errors.experience_band))}
                                        >
                                            <option value="">{t('register.choosePlaceholder')}</option>
                                            {EXPERIENCE_BANDS.map((value) => (
                                                <option key={value} value={value}>
                                                    {t(`register.experience_band_${value}`)}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.experience_band && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">{errors.experience_band}</p>
                                        )}
                                    </div>
                                </>
                                )}

                                {page === 3 && (
                                <>
                                    <div>
                                        <label htmlFor="tailor-legal-status" className="mb-1.5 block text-xs font-medium">
                                            {t('register.legalStatus')}
                                        </label>
                                        <select
                                            id="tailor-legal-status"
                                            value={form.legal_status}
                                            onChange={(e) => setChoice('legal_status', e.target.value)}
                                            className={inputClass(Boolean(errors.legal_status))}
                                        >
                                            <option value="">{t('register.choosePlaceholder')}</option>
                                            {LEGAL_STATUSES.map((value) => (
                                                <option key={value} value={value}>
                                                    {t(`register.legal_status_${value}`)}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.legal_status && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">{errors.legal_status}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="tailor-national-id" className="mb-1.5 block text-xs font-medium">
                                            {t('register.nationalId')}
                                        </label>
                                        <input
                                            id="tailor-national-id"
                                            type="text"
                                            value={form.national_id}
                                            onChange={set('national_id')}
                                            placeholder={t('register.nationalIdPlaceholder')}
                                            className={inputClass(Boolean(errors.national_id))}
                                        />
                                        {errors.national_id && (
                                            <p className="mt-1.5 text-xs text-[#6F1D24]">{errors.national_id}</p>
                                        )}
                                    </div>
                                    <p className="-mt-2 text-xs text-black/45">
                                        {t('register.nationalIdHint')}
                                    </p>

                                    <div className="space-y-2.5 rounded-md border border-black/10 p-3.5">
                                        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
                                            <input
                                                type="checkbox"
                                                checked={consent.accept_partnership_terms}
                                                onChange={(e) => setConsentBox('accept_partnership_terms', e.target.checked)}
                                                className="mt-0.5 h-4 w-4 shrink-0 accent-[#6F1D24]"
                                            />
                                            <span>{t('register.consentPartnership')}</span>
                                        </label>
                                        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
                                            <input
                                                type="checkbox"
                                                checked={consent.accept_data_processing}
                                                onChange={(e) => setConsentBox('accept_data_processing', e.target.checked)}
                                                className="mt-0.5 h-4 w-4 shrink-0 accent-[#6F1D24]"
                                            />
                                            <span>{t('register.consentData')}</span>
                                        </label>
                                        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
                                            <input
                                                type="checkbox"
                                                checked={consent.confirm_information_correct}
                                                onChange={(e) => setConsentBox('confirm_information_correct', e.target.checked)}
                                                className="mt-0.5 h-4 w-4 shrink-0 accent-[#6F1D24]"
                                            />
                                            <span>{t('register.consentAccurate')}</span>
                                        </label>
                                        {consentError && (
                                            <p className="text-xs text-[#6F1D24]">{consentError}</p>
                                        )}
                                    </div>
                                </>
                                )}

                                {page > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setPage(page - 1)}
                                        className="inline-flex min-h-11 h-auto w-full items-center justify-center gap-2 whitespace-normal rounded-none py-3 border border-black/15 px-6 text-sm font-medium transition hover:bg-black/[0.03]"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        {t('register.back')}
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || checkingContact}
                                    className="mt-2 inline-flex min-h-11 h-auto w-full items-center justify-center gap-2 whitespace-normal rounded-none py-3 bg-brand px-6 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t(
                                                'register.sendingCode',
                                            )}
                                        </>
                                    ) : (
                                        page < LAST_PAGE ? (
                                            <>
                                                {t('register.next')}
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        ) : (
                                            t('register.joinAsTailor')
                                        )
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
