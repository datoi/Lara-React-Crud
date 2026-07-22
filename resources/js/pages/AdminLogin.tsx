import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router';
import { Loader2, ShieldAlert } from 'lucide-react';
import { saveAuth, getAuthToken, getAuthUser } from '../hooks/useAuth';

export default function AdminLogin() {
    const navigate  = useNavigate();
    const emailRef  = useRef<HTMLInputElement>(null);

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState<string | null>(null);
    const [loading,  setLoading]  = useState(false);

    // Already logged in as admin — go straight to dashboard
    useEffect(() => {
        const token = getAuthToken();
        const user  = getAuthUser();
        if (token && user?.role === 'admin') {
            navigate('/admin-dashboard', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message ?? 'Login failed.');
                return;
            }

            saveAuth(data.user, data.token);
            navigate('/admin-dashboard', { replace: true });
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <Helmet>
                <title>Admin Login | Kere</title>
                <meta name="robots" content="noindex" />
            </Helmet>

            <div className="w-full max-w-sm">
                {/* Logo mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                        <ShieldAlert className="w-6 h-6 text-slate-300" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Admin Access</h1>
                    <p className="text-sm text-slate-500 mt-1">Design Studio Control Panel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Email
                        </label>
                        <input
                            ref={emailRef}
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition"
                            placeholder="admin@kere.ge"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition"
                            placeholder="Password"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full bg-white text-slate-900 font-semibold text-sm rounded-xl py-3 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
