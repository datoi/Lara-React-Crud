import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { saveAuth, getReturnTo, clearReturnTo, type AuthUser } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';
import { serverMessageKey } from '../lib/serverMessage';
import { PasswordField } from '../components/PasswordField';

type Role = 'customer' | 'tailor';

export default function Login() {
    const { role } = useParams<{ role: Role }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    // Arriving from a password reset: say so, and keep the login they used.
    const arrival = location.state as { passwordReset?: boolean; login?: string } | null;

    const isCustomer = role !== 'tailor';

    const [login, setLogin] = useState(arrival?.login ?? '');
    const [password, setPassword] = useState('');
    // `credentials` is the server refusing the pair, so it marks both fields.
    const [errors, setErrors] = useState<{ login?: string; password?: string; credentials?: string; general?: string }>({});
    const [loading, setLoading] = useState(false);

    function validate(): boolean {
        const e: typeof errors = {};
        if (!login.trim()) e.login = t('signIn.errorRequired');
        else if (login.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) e.login = t('signIn.errorInvalidEmail');
        if (!password) e.password = t('signIn.errorRequired');
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ login, password, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    setErrors({ credentials: t('signIn.errorInvalidCredentials') });
                    return;
                }
                // Never data.message: the server answers in English.
                const key = res.status === 429
                    ? 'signIn.errorThrottled'
                    : data.code === 'wrong_role'
                    ? (isCustomer ? 'signIn.errorWrongRoleCustomer' : 'signIn.errorWrongRoleTailor')
                    : serverMessageKey(data.code) ?? 'signIn.errorLoginFailed';
                setErrors({ general: t(key) });
                return;
            }

            saveAuth(data.user as AuthUser, data.token as string);
            const savedRole = (data.user as AuthUser).role;
            const returnTo = savedRole === 'customer' ? getReturnTo() : null;
            clearReturnTo();
            navigate(savedRole === 'tailor' ? '/tailor-dashboard' : (returnTo ?? '/customer-dashboard'));
        } catch {
            setErrors({ general: t('signIn.errorNetwork') });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="kere-auth-page kere-login-page relative min-h-screen bg-[var(--store-paper)] text-[#2a1418]">
            <Navigation />


            <main className="kere-login-layout">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="kere-login-panel"
                >
                    <h1 className="kere-login-title">{t('signIn.signIn')}</h1>
                    <div className="kere-login-form">
                    {arrival?.passwordReset && !errors.credentials && !errors.general && (
                        <div role="status" className="mb-6 border border-[#d8d0c7] bg-white/60 px-4 py-3">
                            <p className="text-xs leading-5 text-[#2a1418]">{t('password.resetDone')}</p>
                        </div>
                    )}
                    {(errors.credentials || errors.general) && (
                        <div role="alert" className="mb-6 border border-destructive/30 bg-destructive/10 px-4 py-3">
                            <p className="text-xs leading-5 text-destructive">{errors.credentials ?? errors.general}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-8">
                        <div>
                            <label htmlFor="login-identifier" className="block text-[10px] font-semibold leading-none text-[#2a1418]">
                                {t('signIn.emailOrPhoneLabel')}
                            </label>
                            <input
                                id="login-identifier"
                                aria-invalid={!!(errors.login || errors.credentials)}
                                type="text"
                                autoComplete="username"
                                value={login}
                                onChange={e => { setLogin(e.target.value); setErrors(er => ({ ...er, login: undefined, credentials: undefined, general: undefined })); }}
                                className="mt-2 w-full border-0 border-b border-[#d8d0c7] bg-transparent px-0 pb-2 text-xs font-medium text-[#2a1418] placeholder:text-[#8a8179] focus:outline-none focus:ring-0"
                            />
                            {errors.login && <p className="mt-2 text-[10px] font-medium text-destructive">{errors.login}</p>}
                        </div>

                        <div>
                            <PasswordField
                                id="login-password"
                                label={t('signIn.passwordLabel')}
                                value={password}
                                onChange={v => { setPassword(v); setErrors(er => ({ ...er, password: undefined, credentials: undefined, general: undefined })); }}
                                autoComplete="current-password"
                                error={errors.password}
                                invalid={!!errors.credentials}
                                labelClassName="block text-[10px] font-semibold leading-none text-[#2a1418]"
                                inputClassName="mt-2 w-full border-0 border-b border-[#d8d0c7] bg-transparent px-0 pb-2 text-xs font-medium text-[#2a1418] placeholder:text-[#8a8179] focus:outline-none focus:ring-0"
                                errorClassName="mt-2 text-[10px] font-medium text-destructive"
                            />
                            <Link
                                to={`/forgot-password?role=${isCustomer ? 'customer' : 'tailor'}`}
                                state={{ login }}
                                className="mt-3 inline-block text-[11px] text-[#2a1418] underline underline-offset-4"
                            >
                                {t('password.forgotLink')}
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="kere-login-submit"
                        >
                            {loading
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('signIn.signingIn')}</>
                                : t('signIn.signIn')}
                        </Button>
                    </form>

                    <p className="mt-7 text-center text-[10px] font-medium text-[#2a1418]">
                        <Link
                            to={`/register/${isCustomer ? 'customer' : 'tailor'}`}
                            className="font-bold text-[#2a1418] transition-colors hover:text-[#2a1418]"
                        >
                            {isCustomer ? t('signIn.registerAsCustomer') : t('signIn.registerAsTailor')}
                        </Link>
                    </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
