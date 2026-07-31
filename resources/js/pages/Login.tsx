import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { saveAuth, getReturnTo, clearReturnTo, type AuthUser } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';

type Role = 'customer' | 'tailor';

export default function Login() {
    const { role } = useParams<{ role: Role }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const isCustomer = role !== 'tailor';

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ login?: string; password?: string; general?: string }>({});
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
                setErrors({ general: res.status === 401 ? t('signIn.errorInvalidCredentials') : data.message ?? t('signIn.errorLoginFailed') });
                return;
            }

            saveAuth(data.user as AuthUser, data.token as string);
            const savedRole = (data.user as AuthUser).role;
            const returnTo = savedRole === 'customer' ? getReturnTo() : null;
            clearReturnTo();
            navigate(
                savedRole === 'admin'  ? '/admin-dashboard'  :
                savedRole === 'tailor' ? '/tailor-dashboard' :
                                        (returnTo ?? '/customer-dashboard')
            );
        } catch {
            setErrors({ general: t('signIn.errorNetwork') });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#111111] text-white">
            <Navigation />

            <img
                src="/assets/auth/tailor-login-bg.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-y-0 left-0 my-auto max-h-full max-w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/34" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.04),rgba(0,0,0,0.36)_62%,rgba(0,0,0,0.62))]" />

            <div data-nav-theme="dark" className="relative z-10 flex min-h-screen items-center justify-center px-5 py-16 pt-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[340px] bg-black/36 px-5 py-6 backdrop-blur-[2px]"
                >
                    <div className="mb-10 text-center">
                        <Link
                            to="/"
                            className="inline-block text-[18px] font-semibold uppercase tracking-[0.48em] text-white transition-opacity hover:opacity-80"
                        >
                            Kere
                        </Link>
                        <h1 className="sr-only">
                            {isCustomer ? t('signIn.loginTitleCustomer') : t('signIn.loginTitleTailor')}
                        </h1>
                    </div>

                    {errors.general && (
                        <div className="mb-6 border border-white/25 bg-black/40 px-4 py-3">
                            <p className="text-xs leading-5 text-white">{errors.general}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-7">
                        <div>
                            <label className="block text-[10px] font-semibold leading-none text-white/78">
                                {t('signIn.emailOrPhoneLabel')}
                            </label>
                            <input
                                type="text"
                                autoComplete="username"
                                value={login}
                                onChange={e => { setLogin(e.target.value); setErrors(er => ({ ...er, login: undefined, general: undefined })); }}
                                placeholder={t('signIn.emailOrPhonePlaceholder')}
                                className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${errors.login ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                            />
                            {errors.login && <p className="mt-2 text-[10px] font-medium text-white/82">{errors.login}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold leading-none text-white/78">
                                {t('signIn.passwordLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: undefined, general: undefined })); }}
                                    placeholder={t('signIn.passwordPlaceholder')}
                                    className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 pr-8 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${errors.password ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/65 transition-colors hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-2 text-[10px] font-medium text-white/82">{errors.password}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="mt-2 h-11 w-full rounded-xl border border-white/22 bg-white/20 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_14px_40px_rgba(0,0,0,0.25)] transition-colors hover:bg-white hover:text-[#111111]"
                        >
                            {loading
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('signIn.signingIn')}</>
                                : t('signIn.signIn')}
                        </Button>
                    </form>

                    <p className="mt-7 text-center text-[10px] font-medium text-white/70">
                        {t('signIn.noAccount')}{' '}
                        <Link
                            to={`/register/${role}`}
                            className="font-bold text-white transition-colors hover:text-white/75"
                        >
                            {isCustomer ? t('signIn.registerAsCustomer') : t('signIn.registerAsTailor')}
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
