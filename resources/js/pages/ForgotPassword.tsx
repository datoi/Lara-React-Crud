import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Navigation } from '../components/landing/Navigation';
import { PasswordField, passwordRuleError } from '../components/PasswordField';
import { serverMessageKey } from '../lib/serverMessage';

const RESEND_COOLDOWN = 60;

const LABEL = 'block text-[10px] font-semibold leading-none text-[#2a1418]';
const INPUT = 'mt-2 w-full border-0 border-b border-[#d8d0c7] bg-transparent px-0 pb-2 text-xs font-medium text-[#2a1418] placeholder:text-[#8a8179] focus:outline-none focus:ring-0';
const ERROR = 'mt-2 text-[10px] font-medium text-destructive';

type Errors = { login?: string; code?: string; password?: string; confirm?: string; general?: string };

/**
 * A forgotten password: a six-digit code to the email or phone the person signs
 * in with, then a new password, then back to the sign-in page for their role.
 */
export default function ForgotPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const role = params.get('role') === 'tailor' ? 'tailor' : 'customer';

    const [login, setLogin] = useState(() => (location.state as { login?: string } | null)?.login ?? '');
    const [sent, setSent] = useState<{ resetId: string; channel: 'email' | 'phone'; login: string } | null>(null);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

    const startCooldown = () => {
        if (timer.current) clearInterval(timer.current);
        setCooldown(RESEND_COOLDOWN);
        timer.current = setInterval(() => {
            setCooldown(c => {
                if (c <= 1 && timer.current) clearInterval(timer.current);
                return Math.max(0, c - 1);
            });
        }, 1000);
    };

    async function requestCode(target: string): Promise<boolean> {
        setBusy(true);
        setErrors({});
        setNotice('');
        try {
            const res = await fetch('/api/password/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ login: target }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const key = serverMessageKey(data.code) ?? (res.status === 429 ? 'password.errorTooMany' : 'password.errorFailed');
                setErrors({ general: t(key) });
                return false;
            }
            setSent({ resetId: data.reset_id, channel: data.channel === 'phone' ? 'phone' : 'email', login: target });
            startCooldown();
            return true;
        } catch {
            setErrors({ general: t('signIn.errorNetwork') });
            return false;
        } finally {
            setBusy(false);
        }
    }

    function handleRequest(e: React.FormEvent) {
        e.preventDefault();
        const target = login.trim();
        if (!target) return setErrors({ login: t('signIn.errorRequired') });
        if (target.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) return setErrors({ login: t('signIn.errorInvalidEmail') });
        void requestCode(target);
    }

    async function handleResend() {
        if (!sent || busy || cooldown > 0) return;
        if (await requestCode(sent.login)) {
            setCode('');
            setNotice(t('password.resent'));
        }
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        if (!sent) return;
        const next: Errors = {};
        if (!/^\d{6}$/.test(code)) next.code = t('password.errorCodeFormat');
        if (passwordRuleError(password)) next.password = t('password.errorPasswordRule');
        if (confirm !== password) next.confirm = t('password.errorPasswordMismatch');
        setErrors(next);
        setNotice('');
        if (Object.keys(next).length > 0) return;

        setBusy(true);
        try {
            const res = await fetch('/api/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ reset_id: sent.resetId, code, password, password_confirmation: confirm }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (data.code === 'reset_code_invalid' || data.code === 'reset_expired') {
                    setErrors({ code: t(serverMessageKey(data.code) ?? 'password.errorCodeInvalid') });
                    if (data.code === 'reset_expired') setCooldown(0);
                } else if (data.errors?.password) {
                    setErrors({ password: t('password.errorPasswordRule') });
                } else {
                    setErrors({ general: t(res.status === 429 ? 'password.errorThrottled' : 'password.errorFailed') });
                }
                return;
            }
            const signInRole = data.role === 'tailor' ? 'tailor' : 'customer';
            navigate(`/login/${signInRole}`, { replace: true, state: { passwordReset: true, login: sent.login } });
        } catch {
            setErrors({ general: t('signIn.errorNetwork') });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="kere-auth-page kere-login-page relative min-h-screen bg-[var(--store-paper)] text-[#2a1418]">
            <Helmet><title>{t('password.pageTitle')}</title></Helmet>
            <Navigation />

            <main className="kere-login-layout">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="kere-login-panel">
                    <h1 className="kere-login-title">{t('password.forgotTitle')}</h1>
                    <div className="kere-login-form">
                        {errors.general && (
                            <div role="alert" className="mb-6 border border-destructive/30 bg-destructive/10 px-4 py-3">
                                <p className="text-xs leading-5 text-destructive">{errors.general}</p>
                            </div>
                        )}

                        {!sent ? (
                            <form onSubmit={handleRequest} noValidate className="space-y-8">
                                <p className="text-xs leading-5 text-[#2a1418]">{t('password.forgotIntro')}</p>
                                <div>
                                    <label htmlFor="reset-login" className={LABEL}>{t('signIn.emailOrPhoneLabel')}</label>
                                    <input
                                        id="reset-login"
                                        type="text"
                                        autoComplete="username"
                                        value={login}
                                        aria-invalid={!!errors.login}
                                        aria-describedby={errors.login ? 'reset-login-error' : undefined}
                                        onChange={e => { setLogin(e.target.value); setErrors({}); }}
                                        className={INPUT}
                                    />
                                    {errors.login && <p id="reset-login-error" className={ERROR}>{errors.login}</p>}
                                </div>
                                <Button type="submit" disabled={busy} className="kere-login-submit">
                                    {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('password.sendingCode')}</> : t('password.sendCode')}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleReset} noValidate className="space-y-8">
                                <p role="status" className="text-xs leading-5 text-[#2a1418]">
                                    {t(sent.channel === 'phone' ? 'password.codeSentPhone' : 'password.codeSentEmail', { login: sent.login })}
                                </p>
                                <div>
                                    <label htmlFor="reset-code" className={LABEL}>{t('password.codeLabel')}</label>
                                    <input
                                        id="reset-code"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={code}
                                        aria-invalid={!!errors.code}
                                        aria-describedby={errors.code ? 'reset-code-error' : undefined}
                                        onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors(er => ({ ...er, code: undefined, general: undefined })); }}
                                        className={`${INPUT} tracking-[0.4em]`}
                                    />
                                    {errors.code && <p id="reset-code-error" className={ERROR}>{errors.code}</p>}
                                </div>
                                <PasswordField
                                    id="reset-password"
                                    label={t('password.newPasswordLabel')}
                                    value={password}
                                    onChange={v => { setPassword(v); setErrors(er => ({ ...er, password: undefined, general: undefined })); }}
                                    autoComplete="new-password"
                                    error={errors.password}
                                    hint={t('password.passwordHint')}
                                    labelClassName={LABEL}
                                    inputClassName={INPUT}
                                    errorClassName={ERROR}
                                />
                                <PasswordField
                                    id="reset-confirm"
                                    label={t('password.confirmPasswordLabel')}
                                    value={confirm}
                                    onChange={v => { setConfirm(v); setErrors(er => ({ ...er, confirm: undefined, general: undefined })); }}
                                    autoComplete="new-password"
                                    error={errors.confirm}
                                    labelClassName={LABEL}
                                    inputClassName={INPUT}
                                    errorClassName={ERROR}
                                />
                                <Button type="submit" disabled={busy} className="kere-login-submit">
                                    {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('password.saving')}</> : t('password.setPassword')}
                                </Button>
                                {notice && <p role="status" className="text-center text-[11px] text-[#2a1418]">{notice}</p>}
                                <div className="flex flex-col items-center gap-3 text-[11px]">
                                    <button type="button" onClick={() => void handleResend()} disabled={busy || cooldown > 0} className="underline underline-offset-4 disabled:no-underline disabled:opacity-60">
                                        {cooldown > 0 ? t('password.resendIn', { s: cooldown }) : t('password.resend')}
                                    </button>
                                    <button type="button" onClick={() => { setSent(null); setCode(''); setErrors({}); setNotice(''); }} className="underline underline-offset-4">
                                        {t('password.changeLogin')}
                                    </button>
                                </div>
                            </form>
                        )}

                        <p className="text-center text-[11px]">
                            <Link to={`/login/${role}`}>{t('password.backToSignIn')}</Link>
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
