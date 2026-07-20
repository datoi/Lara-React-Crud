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

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [loading, setLoading] = useState(false);

    function validate(): boolean {
        const e: typeof errors = {};
        if (!email.trim()) e.email = t('signIn.errorRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('signIn.errorInvalidEmail');
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
                body: JSON.stringify({ email, password, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrors({ general: data.message ?? t('signIn.errorLoginFailed') });
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

    if (!isCustomer) {
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
                                {t('signIn.loginTitleTailor')}
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
                                    {t('signIn.emailLabel')}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: undefined, general: undefined })); }}
                                    placeholder={t('signIn.emailPlaceholder')}
                                    className={`mt-2 w-full border-0 border-b bg-transparent px-0 pb-2 text-xs font-medium text-white placeholder:text-white/48 focus:outline-none focus:ring-0 ${errors.email ? 'border-white/80' : 'border-white/42 focus:border-white/85'}`}
                                />
                                {errors.email && <p className="mt-2 text-[10px] font-medium text-white/82">{errors.email}</p>}
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
                                {t('signIn.registerAsTailor')}
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        );
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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                {isCustomer ? t('signIn.loginTitleCustomer') : t('signIn.loginTitleTailor')}
                            </h1>
                            <p className="text-slate-500">
                                {isCustomer ? t('signIn.loginSubtitleCustomer') : t('signIn.loginSubtitleTailor')}
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            {errors.general && (
                                <div className="mb-5 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                                    <p className="text-sm text-slate-600">{errors.general}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('signIn.emailLabel')}
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: undefined, general: undefined })); }}
                                        placeholder={t('signIn.emailPlaceholder')}
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.email ? 'border-slate-400' : 'border-slate-200'}`}
                                    />
                                    {errors.email && <p className="text-xs text-slate-600 mt-1">{errors.email}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('signIn.passwordLabel')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: undefined, general: undefined })); }}
                                            placeholder={t('signIn.passwordPlaceholder')}
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.password ? 'border-slate-400' : 'border-slate-200'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-slate-600 mt-1">{errors.password}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-700 text-white h-11 mt-2"
                                >
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('signIn.signingIn')}</>
                                        : t('signIn.signIn')}
                                </Button>
                            </form>
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-5">
                            {t('signIn.noAccount')}{' '}
                            <Link
                                to={`/register/${role}`}
                                className="text-slate-900 font-medium hover:underline"
                            >
                                {isCustomer ? t('signIn.registerAsCustomer') : t('signIn.registerAsTailor')}
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
