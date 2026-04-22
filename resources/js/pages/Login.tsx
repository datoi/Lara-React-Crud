import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { saveAuth, getReturnTo, clearReturnTo, type AuthUser } from '../hooks/useAuth';

type Role = 'customer' | 'tailor';

export default function Login() {
    const { role } = useParams<{ role: Role }>();
    const navigate = useNavigate();

    const isCustomer = role !== 'tailor';
    const roleLabel = isCustomer ? 'Customer' : 'Tailor';
    const redirect = isCustomer ? '/customer-dashboard' : '/tailor-dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [loading, setLoading] = useState(false);

    function validate(): boolean {
        const e: typeof errors = {};
        if (!email.trim()) e.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
        if (!password) e.password = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // API endpoint: POST /api/login
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrors({ general: data.message ?? 'Login failed. Please try again.' });
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
            setErrors({ general: 'Network error. Please try again.' });
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
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                Sign in as {roleLabel}
                            </h1>
                            <p className="text-slate-500">
                                {isCustomer
                                    ? 'Welcome back. Browse and order custom clothing.'
                                    : 'Welcome back. Manage your orders and products.'}
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            {errors.general && (
                                <div className="mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                    <p className="text-sm text-red-600">{errors.general}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: undefined, general: undefined })); }}
                                        placeholder="you@example.com"
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: undefined, general: undefined })); }}
                                            placeholder="Your password"
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-700 text-white h-11 mt-2"
                                >
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                                        : 'Sign In'}
                                </Button>
                            </form>
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-5">
                            Don't have an account?{' '}
                            <Link
                                to={`/register/${role}`}
                                className="text-slate-900 font-medium hover:underline"
                            >
                                Register as {roleLabel}
                            </Link>
                        </p>
                        <p className="text-center text-sm text-slate-500 mt-2">
                            <Link to="/signin" className="text-slate-400 hover:text-slate-600 transition-colors">
                                ← Back to role selection
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
