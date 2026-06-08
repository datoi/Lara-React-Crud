import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Shuffle, Star, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { getDraft, saveDraft } from '../hooks/useCustomOrderDraft';
import { getAuthUser, getAuthToken } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

interface Tailor {
    id: number;
    name: string;
    specialty: string | null;
    years_experience: number | null;
    avg_rating: number | null;
    reviews_count: number;
    is_available: boolean;
    turnaround_days: string | null;
    starting_price: number | null;
}

export default function TailorSelectStep() {
    const navigate = useNavigate();
    const { t }    = useTranslation();
    const draft    = getDraft();

    const [tailors,  setTailors]  = useState<Tailor[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);

    const [selected, setSelected] = useState<number | null | 'unset'>('unset');

    const user  = getAuthUser();
    const token = getAuthToken();

    useEffect(() => {
        if (!user || !token) { navigate('/login/customer'); return; }
        if (!draft.garment_type) { navigate('/design'); }
    }, []);

    useEffect(() => {
        if (!draft.garment_type) return;
        fetch(`/api/tailors?garment_type=${encodeURIComponent(draft.garment_type)}`)
            .then(r => r.json())
            .then(d => setTailors(d.tailors ?? []))
            .catch(() => setError(t('tailorSelect.errorLoad')))
            .finally(() => setLoading(false));
    }, [draft.garment_type]);

    const availableTailors = tailors.filter(t => t.is_available);
    const noManualOption   = !loading && availableTailors.length === 0;

    const handleContinue = () => {
        if (selected === 'unset') return;
        saveDraft({ tailor_id: selected, assignment_mode: selected === null ? 'random' : 'manual' });
        navigate('/design/review');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet><title>Select Your Tailor | Kere</title></Helmet>

            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">Kere</Link>
                    <span className="text-xs text-slate-400 hidden sm:block">{t('design.studioLabel')}</span>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto"
                >
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        {t('tailorSelect.back')}
                    </button>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('tailorSelect.pageTitle')}</h1>
                    <p className="text-slate-500 mb-8">{t('tailorSelect.pageSubtitle')}</p>

                    {loading ? (
                        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div>
                    ) : error ? (
                        <p className="text-slate-500 text-sm">{error}</p>
                    ) : (
                        <div className="space-y-4">
                            <LetKereChooseCard selected={selected === null} onSelect={() => setSelected(null)} />

                            {noManualOption ? (
                                <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
                                    <p className="text-sm text-slate-500">{t('tailorSelect.noTailorsAvailable')}</p>
                                </div>
                            ) : (
                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-300 ${selected === null ? 'opacity-40 pointer-events-none' : ''}`}>
                                    {tailors.map((tailor, i) => (
                                        <motion.div
                                            key={tailor.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: i * 0.07 }}
                                        >
                                            <TailorCard
                                                tailor={tailor}
                                                selected={selected === tailor.id}
                                                onSelect={() => { if (tailor.is_available) setSelected(tailor.id); }}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && (
                        <div className="mt-8 flex items-center justify-between">
                            <Button variant="outline" onClick={() => navigate(-1)}>
                                <ArrowLeft className="w-4 h-4 mr-1.5" />
                                {t('tailorSelect.back')}
                            </Button>
                            <Button variant="default" disabled={selected === 'unset'} onClick={handleContinue}>
                                {t('tailorSelect.reviewOrder')}
                                <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Button>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

function LetKereChooseCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
    const { t } = useTranslation();
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left bg-white rounded-lg shadow-sm border p-6 hover:shadow-lg transition-all ${
                selected ? 'ring-2 ring-slate-900 border-slate-900' : 'border-slate-200'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <Shuffle className="w-6 h-6 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{t('tailorSelect.letKereChooseTitle')}</h3>
                        {selected && (
                            <span className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" />
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{t('tailorSelect.letKereChooseDesc')}</p>
                </div>
            </div>
        </button>
    );
}

function TailorCard({ tailor, selected, onSelect }: { tailor: Tailor; selected: boolean; onSelect: () => void }) {
    const { t } = useTranslation();
    const unavailable = !tailor.is_available;

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={unavailable}
            className={`w-full text-left bg-white rounded-lg shadow-sm border p-6 transition-all ${
                unavailable
                    ? 'opacity-50 cursor-not-allowed border-slate-200'
                    : selected
                    ? 'ring-2 ring-slate-900 border-slate-900 hover:shadow-lg'
                    : 'border-slate-200 hover:shadow-lg'
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{tailor.name}</h3>
                    {tailor.specialty && <p className="text-xs text-slate-500 mt-0.5 truncate">{tailor.specialty}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {unavailable ? (
                        <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t('tailorSelect.busy')}</span>
                    ) : (
                        <span className="text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">{t('tailorSelect.available')}</span>
                    )}
                    {selected && (
                        <span className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                {tailor.avg_rating !== null && (
                    <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-500 text-slate-500" />
                        <span className="font-medium text-slate-700">{tailor.avg_rating.toFixed(1)}</span>
                        <span>({tailor.reviews_count})</span>
                    </div>
                )}
                {tailor.years_experience !== null && (
                    <span>{tailor.years_experience} {tailor.years_experience === 1 ? t('tailorSelect.yrExp') : t('tailorSelect.yrsExp')}</span>
                )}
                {tailor.turnaround_days && <span>{t('tailorSelect.estDays', { n: tailor.turnaround_days })}</span>}
                {tailor.starting_price !== null && tailor.starting_price > 0 && (
                    <span>{t('tailorSelect.from', { n: tailor.starting_price })}</span>
                )}
            </div>
        </button>
    );
}
