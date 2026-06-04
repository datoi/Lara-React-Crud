import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Trash2, Loader2, Pencil, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getAuthToken, getAuthUser } from '../hooks/useAuth';
import type { SavedDesign } from '../types/customizer';

export default function MyDesignsPage() {
    const navigate  = useNavigate();
    const authUser  = getAuthUser();
    const token     = getAuthToken();

    const [designs, setDesigns]   = useState<SavedDesign[]>([]);
    const [loading, setLoading]   = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [error, setError]       = useState<string | null>(null);

    useEffect(() => {
        if (!token) { navigate('/login/customer'); return; }

        fetch('/api/customizer/designs', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
            .then(r => {
                if (r.status === 401) { navigate('/login/customer'); return null; }
                if (!r.ok) throw new Error('Failed to load');
                return r.json();
            })
            .then(d => d && setDesigns(d.designs ?? []))
            .catch(() => setError('Failed to load designs. Please try again.'))
            .finally(() => setLoading(false));
    }, [token, navigate]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this design?')) return;
        setDeleting(id);
        try {
            const res = await fetch(`/api/customizer/designs/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token!}`, Accept: 'application/json' },
            });
            if (res.ok) {
                setDesigns(prev => prev.filter(d => d.id !== id));
            } else {
                setError('Could not delete design. Please try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>My Designs | Kere</title>
            </Helmet>

            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <Link
                        to="/customer-dashboard"
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Saved Designs</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {authUser?.first_name ? `${authUser.first_name}'s` : 'Your'} customizer configurations
                        </p>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate('/marketplace')}
                    >
                        New Design
                    </Button>
                </div>

                {error && (
                    <div className="mb-4 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
                    </div>
                ) : designs.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-400 mb-4">No saved designs yet.</p>
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => navigate('/marketplace')}
                        >
                            Start Customizing
                        </Button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {designs.map((design, i) => (
                            <motion.div
                                key={design.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{design.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {design.product?.name} ·{' '}
                                            {new Date(design.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                navigate(`/customize/${design.product?.slug}`)
                                            }
                                            aria-label="Edit design"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(design.id)}
                                            disabled={deleting === design.id}
                                            aria-label="Delete design"
                                        >
                                            {deleting === design.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 text-slate-400" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Configuration summary */}
                                <div className="text-xs text-slate-500 leading-relaxed">
                                    {Object.keys(design.configuration.selections ?? {}).length} options selected
                                    {design.configuration.fabric_id ? ' · Fabric selected' : ''}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
