import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, MailCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { getAuthToken } from '../hooks/useAuth';
import { serverMessageKey } from '../lib/serverMessage';

/**
 * The part of signing up that happens after the one-time code: date of birth,
 * a guardian where the age calls for one, and the terms.
 *
 * It runs against a real account — verifying the code is what creates one — so
 * these post to an authenticated endpoint rather than being carried through the
 * verification record. Until they are answered the account cannot order, which
 * is the server's rule, not this component's.
 */

/**
 * Mirrors User::MINIMUM_AGE / ADULT_AGE. Only decides whether to show the
 * guardian fields — the server re-checks and is what actually enforces them,
 * so a copy that drifts produces a corrected form, not a way through.
 */
const MINIMUM_AGE = 16;
const ADULT_AGE = 18;

type Screen = 'age' | 'terms' | 'guardian-sent';

interface Props {
    /** Registration is finished and the account may be used. */
    onDone: () => void;
}

const field =
    'mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 text-xs font-medium text-[#2a1418] placeholder:text-[#8a8179] focus:outline-none focus:ring-0';
const fieldTone = (hasError: boolean) =>
    hasError ? 'border-[#d8d0c7]' : 'border-[#d8d0c7] focus:border-[#d8d0c7]';
const label = 'block text-[10px] font-medium uppercase tracking-[0.18em] text-[#2a1418]';

/** Compact primary action matching the storefront. */
const primaryAction =
    'mt-7 h-11 w-full kere-auth-submit bg-[#631e26] px-6 text-xs font-medium text-white hover:bg-[#c3a69a] hover:text-[#631e26]';

/** The age on a given day, or null when the three parts are not yet a real date. */
function ageFrom(day: string, month: string, year: string): number | null {
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);

    if (!d || !m || !y || year.length !== 4) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;

    const date = new Date(y, m - 1, d);

    // Rejects the 31st of a 30-day month rather than letting it roll forward.
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    if (date > new Date()) return null;

    const now = new Date();
    let age = now.getFullYear() - y;
    const beforeBirthday =
        now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d);

    if (beforeBirthday) age -= 1;

    return age;
}

export function CustomerProfileSteps({ onDone }: Props) {
    const { t } = useTranslation();

    const [screen, setScreen] = useState<Screen>('age');
    const [dob, setDob] = useState({ day: '', month: '', year: '' });
    const [guardian, setGuardian] = useState({
        guardian_name: '',
        guardian_email: '',
        guardian_phone: '',
        guardian_relationship: '',
    });
    const [consent, setConsent] = useState({ terms: false, privacy: false, marketing: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [general, setGeneral] = useState('');
    const [loading, setLoading] = useState(false);

    const age = useMemo(() => ageFrom(dob.day, dob.month, dob.year), [dob]);
    const needsGuardian = age !== null && age >= MINIMUM_AGE && age < ADULT_AGE;
    const tooYoung = age !== null && age < MINIMUM_AGE;

    const setDobPart = (part: 'day' | 'month' | 'year') => (value: string) => {
        setDob(current => ({ ...current, [part]: value.replace(/\D/g, '') }));
        setErrors(current => ({ ...current, date_of_birth: '' }));
    };

    const setGuardianField = (name: keyof typeof guardian) => (value: string) => {
        setGuardian(current => ({ ...current, [name]: value }));
        setErrors(current => ({ ...current, [name]: '' }));
    };

    function validateAge(): boolean {
        const next: Record<string, string> = {};

        if (age === null) next.date_of_birth = t('register.errorDateInvalid');
        else if (tooYoung) next.date_of_birth = t('register.errorTooYoung', { age: MINIMUM_AGE });

        if (needsGuardian) {
            if (!guardian.guardian_name.trim()) next.guardian_name = t('register.errorRequired');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardian.guardian_email)) next.guardian_email = t('register.errorInvalidEmail');
            if (!/^\+\d{8,15}$/.test(guardian.guardian_phone)) next.guardian_phone = t('register.errorPhoneFormat');
            if (!guardian.guardian_relationship) next.guardian_relationship = t('register.errorRequired');
        }

        setErrors(next);

        return Object.keys(next).length === 0;
    }

    async function submit() {
        if (!consent.terms || !consent.privacy) {
            setGeneral(t('register.errorConsentRequired'));

            return;
        }

        const token = getAuthToken();

        if (!token) {
            setGeneral(t('register.errorRegistrationFailed'));

            return;
        }

        setLoading(true);
        setGeneral('');

        try {
            const response = await fetch('/api/register/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    date_of_birth: `${dob.year}-${dob.month.padStart(2, '0')}-${dob.day.padStart(2, '0')}`,
                    accept_terms: true,
                    accept_privacy: true,
                    marketing_opt_in: consent.marketing,
                    ...(needsGuardian ? guardian : {}),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Never data.message — the server answers in English.
                setGeneral(t(serverMessageKey(data.code) ?? 'register.errorRegistrationFailed'));

                // A rejected field belongs to the screen that asked it, and the
                // fields on this step all live on the age screen. Without this
                // the customer sits on the terms screen reading "registration
                // failed" about a guardian field they were never shown — which
                // is exactly what a disagreement over the date could produce.
                if (data.errors) {
                    const mapped: Record<string, string> = {};

                    for (const [field, messages] of Object.entries(data.errors)) {
                        mapped[field] = t(
                            serverMessageKey((messages as string[])[0]) ?? 'register.errorFieldInvalid',
                        );
                    }

                    setErrors(mapped);
                    setScreen('age');

                    return;
                }

                if (data.code === 'below_minimum_age') setScreen('age');

                return;
            }

            if (data.needs_guardian_consent) {
                setScreen('guardian-sent');

                return;
            }

            onDone();
        } catch {
            setGeneral(t('register.errorNetwork'));
        } finally {
            setLoading(false);
        }
    }

    // ─── Guardian told, account waiting ───────────────────────────────────────

    if (screen === 'guardian-sent') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <MailCheck className="mx-auto mb-5 h-10 w-10 text-[#2a1418]" strokeWidth={1.4} />
                <h2 className="font-serif text-[24px] font-medium text-[#2a1418]">{t('register.guardianSentTitle')}</h2>
                <p className="mx-auto mt-3 max-w-[340px] text-xs leading-5 text-[#2a1418]">
                    {t('register.guardianSentBody', { email: guardian.guardian_email })}
                </p>
                <Button type="button" onClick={onDone} className={primaryAction}>
                    {t('register.guardianSentContinue')}
                </Button>
            </motion.div>
        );
    }

    // ─── Terms ────────────────────────────────────────────────────────────────

    if (screen === 'terms') {
        const box = (
            key: keyof typeof consent,
            text: string,
            required: boolean,
        ) => (
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[#2a1418]">
                <input
                    type="checkbox"
                    checked={consent[key]}
                    onChange={e => {
                        setConsent(current => ({ ...current, [key]: e.target.checked }));
                        setGeneral('');
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-white"
                />
                <span>
                    {text}
                    {!required && (
                        <span className="ml-1 text-[#2a1418]">{t('register.optionalSuffix')}</span>
                    )}
                </span>
            </label>
        );

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h2 className="font-serif text-[24px] font-medium text-[#2a1418]">{t('register.termsTitle')}</h2>
                <p className="mt-2 text-xs leading-5 text-[#2a1418]">{t('register.termsSubtitle')}</p>

                <div className="mt-6 space-y-3.5">
                    {box('terms', t('register.consentTerms'), true)}
                    {box('privacy', t('register.consentPrivacy'), true)}
                    {box('marketing', t('register.consentMarketing'), false)}
                </div>

                {general && <p className="mt-4 text-xs text-[#2a1418]">{general}</p>}

                <Button type="button" onClick={() => void submit()} disabled={loading} className={primaryAction}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('register.createAccount')}
                </Button>

                <Button
                    type="button"
                    variant="link"
                    onClick={() => setScreen('age')}
                    className="mt-3 h-auto w-full text-[11px] text-[#2a1418] hover:text-[#2a1418]"
                >
                    {t('register.back')}
                </Button>
            </motion.div>
        );
    }

    // ─── Age ──────────────────────────────────────────────────────────────────

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="font-serif text-[24px] font-medium text-[#2a1418]">{t('register.ageTitle')}</h2>
            <p className="mt-2 text-xs leading-5 text-[#2a1418]">{t('register.ageSubtitle')}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
                {([
                    ['day', t('register.dobDay'), '31', 2],
                    ['month', t('register.dobMonth'), '12', 2],
                    ['year', t('register.dobYear'), '1998', 4],
                ] as const).map(([part, text, placeholder, maxLength]) => (
                    <div key={part}>
                        <label htmlFor={`dob-${part}`} className={label}>{text}</label>
                        <input
                            id={`dob-${part}`}
                            inputMode="numeric"
                            maxLength={maxLength}
                            value={dob[part]}
                            onChange={e => setDobPart(part)(e.target.value)}
                            placeholder={placeholder}
                            className={`${field} ${fieldTone(Boolean(errors.date_of_birth))}`}
                        />
                    </div>
                ))}
            </div>

            {errors.date_of_birth && <p className="mt-2 text-xs text-[#2a1418]">{errors.date_of_birth}</p>}

            {needsGuardian && (
                <div className="mt-7 border-t border-[#d8d0c7] pt-6">
                    <p className="text-xs leading-5 text-[#2a1418]">{t('register.guardianIntro')}</p>

                    <div className="mt-5 space-y-5">
                        {([
                            ['guardian_name', t('register.guardianName'), 'text'],
                            ['guardian_email', t('register.guardianEmail'), 'email'],
                            ['guardian_phone', t('register.guardianPhone'), 'tel'],
                        ] as const).map(([name, text, type]) => (
                            <div key={name}>
                                <label htmlFor={name} className={label}>{text}</label>
                                <input
                                    id={name}
                                    type={type}
                                    value={guardian[name]}
                                    onChange={e => setGuardianField(name)(e.target.value)}
                                    placeholder={name === 'guardian_phone' ? '+995555123456' : ''}
                                    className={`${field} ${fieldTone(Boolean(errors[name]))}`}
                                />
                                {errors[name] && <p className="mt-1.5 text-xs text-[#2a1418]">{errors[name]}</p>}
                            </div>
                        ))}

                        <div>
                            <label htmlFor="guardian_relationship" className={label}>
                                {t('register.guardianRelationship')}
                            </label>
                            <select
                                id="guardian_relationship"
                                value={guardian.guardian_relationship}
                                onChange={e => setGuardianField('guardian_relationship')(e.target.value)}
                                className={`${field} ${fieldTone(Boolean(errors.guardian_relationship))} [&>option]:text-[#111111]`}
                            >
                                <option value="">{t('register.choosePlaceholder')}</option>
                                <option value="parent">{t('register.relationshipParent')}</option>
                                <option value="legal_guardian">{t('register.relationshipLegalGuardian')}</option>
                            </select>
                            {errors.guardian_relationship && (
                                <p className="mt-1.5 text-xs text-[#2a1418]">{errors.guardian_relationship}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Button
                type="button"
                onClick={() => { if (validateAge()) setScreen('terms'); }}
                className={primaryAction}
            >
                {t('register.continue')}
            </Button>
        </motion.div>
    );
}
