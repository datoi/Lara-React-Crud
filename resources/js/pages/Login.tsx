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
                    {errors.general && (
                        <div className="mb-6 border border-[#d8d0c7] bg-[#f0e8e0] px-4 py-3">
                            <p className="text-xs leading-5 text-[#2a1418]">{errors.general}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-8">
                        <div>
                            <label htmlFor="login-identifier" className="block text-[10px] font-semibold leading-none text-[#2a1418]">
                                {t('signIn.emailOrPhoneLabel')}
                            </label>
                            <input
                                id="login-identifier"
                                aria-invalid={!!errors.login}
                                type="text"
                                autoComplete="username"
                                value={login}
                                onChange={e => { setLogin(e.target.value); setErrors(er => ({ ...er, login: undefined, general: undefined })); }}
                                
                                className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 text-xs font-medium text-[#2a1418] placeholder:text-[#8a8179] focus:outline-none focus:ring-0 ${errors.login ? 'border-[#d8d0c7]' : 'border-[#d8d0c7] focus:border-[#d8d0c7]'}`}
                            />
                            {errors.login && <p className="mt-2 text-[10px] font-medium text-[#2a1418]">{errors.login}</p>}
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block text-[10px] font-semibold leading-none text-[#2a1418]">
                                {t('signIn.passwordLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    autoComplete="current-password"
                                    aria-invalid={!!errors.password}
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: undefined, general: undefined })); }}
                                    
                                    className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 pr-8 text-xs font-medium text-[#2a1418] placeholder:text-[#8a8179] focus:outline-none focus:ring-0 ${errors.password ? 'border-[#d8d0c7]' : 'border-[#d8d0c7] focus:border-[#d8d0c7]'}`}
                                />
                                <button
                                    type="button"
                                    aria-label={t('signIn.passwordLabel')}
                                    aria-pressed={showPassword}
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#2a1418] transition-colors hover:text-[#2a1418]"
                                >
                                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-2 text-[10px] font-medium text-[#2a1418]">{errors.password}</p>}
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
