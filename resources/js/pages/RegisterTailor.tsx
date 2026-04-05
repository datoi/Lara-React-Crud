import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { saveAuth, type AuthUser } from '../hooks/useAuth';

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
        if (!form.first_name.trim()) e.first_name = 'Required';
        if (!form.last_name.trim()) e.last_name = 'Required';
        if (!form.email.trim()) e.email = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.phone.trim()) e.phone = 'Required';
        if (!form.password) e.password = 'Required';
        else if (form.password.length < 8) e.password = 'At least 8 characters';
        if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // API endpoint: POST /api/register
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
                    setErrors({ general: data.message ?? 'Registration failed.' });
                }
                return;
            }

            saveAuth(data.user as AuthUser, data.token as string);
            navigate('/tailor-dashboard');
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
                        className="max-w-lg mx-auto"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Join as a Tailor</h1>
                            <p className="text-slate-500">Grow your tailoring business on the Kere platform.</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            {errors.general && (
                                <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                                    {errors.general}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                {/* Name row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={form.first_name}
                                            onChange={set('first_name')}
                                            placeholder="Nino"
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.first_name ? 'border-red-400' : 'border-slate-200'}`}
                                        />
                                        {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={form.last_name}
                                            onChange={set('last_name')}
                                            placeholder="Beridze"
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.last_name ? 'border-red-400' : 'border-slate-200'}`}
                                        />
                                        {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={set('email')}
                                        placeholder="nino@example.com"
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={set('phone')}
                                        placeholder="+995 555 123 456"
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.phone ? 'border-red-400' : 'border-slate-200'}`}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={set('password')}
                                            placeholder="Min. 8 characters"
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

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={form.password_confirmation}
                                            onChange={set('password_confirmation')}
                                            placeholder="Repeat password"
                                            className={`w-full border rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${errors.password_confirmation ? 'border-red-400' : 'border-slate-200'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 hover:bg-slate-700 text-white h-11 mt-2"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                                    ) : 'Join as Tailor'}
                                </Button>
                            </form>
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-5">
                            Already have an account?{' '}
                            <Link to="/login/tailor" className="text-slate-900 font-medium hover:underline">Sign in</Link>
                        </p>
                        <p className="text-center text-sm text-slate-500 mt-2">
                            Looking to order clothing?{' '}
                            <Link to="/register/customer" className="text-slate-900 font-medium hover:underline">Register as customer</Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
