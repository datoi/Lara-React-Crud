import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
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

export default function RegisterTailor() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [errors, setErrors] = useState<Partial<FormState & { general: string }>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setErrors(er => ({ ...er, [field]: undefined, general: undefined }));
    };

    function validate(): boolean {
        const e: Partial<FormState & { general: string }> = {};
        if (!form.first_name.trim()) e.first_name = t('register.errorRequired');
        if (!form.last_name.trim()) e.last_name = t('register.errorRequired');
        if (!form.email.trim()) e.email = t('register.errorRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('register.errorInvalidEmail');
        if (!form.phone.trim()) e.phone = t('register.errorRequired');
        if (!form.password) e.password = t('register.errorRequired');
        else if (form.password.length < 8) e.password = t('register.errorMinPassword');
        if (form.password !== form.password_confirmation) e.password_confirmation = t('register.errorPasswordMatch');
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ ...form, role: 'tailor' }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const mapped: Partial<FormState> = {};
                    for (const [k, v] of Object.entries(data.errors)) {
                        (mapped as Record<string, string>)[k] = (v as string[])[0];
                    }
                    setErrors(mapped);
                } else {
                    setErrors({ general: data.message ?? t('register.errorRegistrationFailed') });
                }
                return;
            }

            saveAuth(data.user as AuthUser, data.token as string);
            navigate('/tailor-dashboard');
        } catch {
            setErrors({ general: t('register.errorNetwork') });
        } finally {
            setLoading(false);
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
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="max-w-lg mx-auto"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('register.tailorTitle')}</h1>
                            <p className="text-slate-500">{t('register.tailorSubtitle')}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            {errors.general && (
                                <div className="mb-5 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-3">
                                    {errors.general}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.firstName')}</label>
                                        <input
                                            type="text"
                                            value={form.first_name}
                                            onChange={set('first_name')}
                                            placeholder={t('register.firstNamePlaceholder')}
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.first_name ? 'border-slate-400' : 'border-slate-200'}`}
                                        />
                                        {errors.first_name && <p className="text-xs text-slate-600 mt-1">{errors.first_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.lastName')}</label>
                                        <input
                                            type="text"
                                            value={form.last_name}
                                            onChange={set('last_name')}
                                            placeholder={t('register.lastNamePlaceholder')}
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.last_name ? 'border-slate-400' : 'border-slate-200'}`}
                                        />
                                        {errors.last_name && <p className="text-xs text-slate-600 mt-1">{errors.last_name}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.email')}</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={set('email')}
                                        placeholder={t('register.emailPlaceholder')}
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.email ? 'border-slate-400' : 'border-slate-200'}`}
                                    />
                                    {errors.email && <p className="text-xs text-slate-600 mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.phone')}</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={set('phone')}
                                        placeholder={t('register.phonePlaceholder')}
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.phone ? 'border-slate-400' : 'border-slate-200'}`}
                                    />
                                    {errors.phone && <p className="text-xs text-slate-600 mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.password')}</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={set('password')}
                                            placeholder={t('register.passwordPlaceholder')}
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.password ? 'border-slate-400' : 'border-slate-200'}`}
                                        />
                                        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-slate-600 mt-1">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('register.confirmPassword')}</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={form.password_confirmation}
                                            onChange={set('password_confirmation')}
                                            placeholder={t('register.confirmPasswordPlaceholder')}
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.password_confirmation ? 'border-slate-400' : 'border-slate-200'}`}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && <p className="text-xs text-slate-600 mt-1">{errors.password_confirmation}</p>}
                                </div>

                                <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-700 text-white h-11 mt-2">
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('register.creatingAccount')}</>
                                        : t('register.joinAsTailor')}
                                </Button>
                            </form>
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-5">
                            {t('register.haveAccount')}{' '}
                            <Link to="/login/tailor" className="text-slate-900 font-medium hover:underline">{t('register.signIn')}</Link>
                        </p>
                        <p className="text-center text-sm text-slate-500 mt-2">
                            {t('register.lookingToOrder')}{' '}
                            <Link to="/register/customer" className="text-slate-900 font-medium hover:underline">{t('register.registerAsCustomer')}</Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
