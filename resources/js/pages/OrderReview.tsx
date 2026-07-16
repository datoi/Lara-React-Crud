import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Star, FileText, Shuffle, AlertCircle } from 'lucide-react';
import { getDraft, clearDraft } from '../hooks/useCustomOrderDraft';
import { getAuthUser, getAuthToken } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

const SHIPPING = 15;

interface TailorSummary {
    id: number;
    name: string;
    specialty: string | null;
    avg_rating: number | null;
    turnaround_days: string | null;
}

export default function OrderReview() {
    const navigate = useNavigate();
    const { t }    = useTranslation();
    const draft    = getDraft();
    const user     = getAuthUser();
    const token    = getAuthToken();

    const [tailor,      setTailor]      = useState<TailorSummary | null>(null);
    const [submitting,  setSubmitting]  = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const submitted = useRef(false);

    useEffect(() => {
        if (!user || !token) { navigate('/login/customer'); return; }
        if (!draft.garment_type) { navigate('/design'); return; }
    }, []);

    useEffect(() => {
        if (draft.tailor_id === null || draft.assignment_mode === 'random') return;
        fetch(`/api/tailors/${draft.tailor_id}`)
            .then(r => r.json())
            .then(d => {
                const t = d.tailor;
                if (t) setTailor({ id: t.id, name: t.name, specialty: t.specialty ?? null, avg_rating: t.avg_rating ?? null, turnaround_days: t.turnaround_days ?? null });
            })
            .catch(() => {});
    }, [draft.tailor_id]);

    const subtotal = draft.estimated_price ?? 0;
    const total    = subtotal + SHIPPING;

    const handlePlaceOrder = async () => {
        if (submitted.current || submitting) return;
        if (!token) { navigate('/login/customer'); return; }
        submitted.current = true;
        setSubmitting(true);
        setSubmitError(null);

        const body: Record<string, unknown> = {
            order_type:             'custom',
            tailor_assignment_mode: draft.assignment_mode,
            tailor_id:              draft.tailor_id,
            custom_design_data: {
                garment_type:    draft.garment_type,
                customization:   draft.customization,
                design_file_url: draft.design_file_url,
                tailor_notes:    draft.tailor_notes,
            },
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (res.status === 409) {
                setSubmitError(data.message ?? t('orderReview.garment_coat')); // fallback unused
                setSubmitting(false);
                submitted.current = false;
                navigate('/design/tailor-select');
                return;
            }
            if (!res.ok) {
                throw new Error(data.message ?? t('orderReview.placeOrder'));
            }

            clearDraft();
            if (data.status === 'pending_assignment') {
                navigate('/customer-dashboard', { state: { pendingAssignment: true, orderNumber: data.order_number } });
            } else {
                navigate('/customer-dashboard');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t('orderReview.placeOrder');
            setSubmitError(msg);
            setSubmitting(false);
            submitted.current = false;
        }
    };

    // Map garment_type to a translated label
    const garmentKeyMap: Record<string, string> = {
        'shirt': 'orderReview.garment_shirt',
        'womens-top': 'orderReview.garment_womensTop',
        'dress': 'orderReview.garment_dress',
        'trousers': 'orderReview.garment_trousers',
        'jacket': 'orderReview.garment_jacket',
        'skirt': 'orderReview.garment_skirt',
        'coat': 'orderReview.garment_coat',
    };
    const garmentLabel = garmentKeyMap[draft.garment_type] ? t(garmentKeyMap[draft.garment_type]) : draft.garment_type;
    const isAutoMatch  = draft.assignment_mode === 'random' || draft.tailor_id === null;

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet><title>Review Your Order | Kere</title></Helmet>

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
                    className="max-w-xl mx-auto"
                >
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        {t('orderReview.back')}
                    </button>

                    <h1 className="text-2xl font-bold text-slate-900 mb-8">{t('orderReview.pageTitle')}</h1>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {/* Design section */}
                        <div className="p-6 border-b border-slate-100">
                            {draft.design_file_url ? (
                                <div className="mb-4">
                                    {draft.design_file_url.match(/\.(jpg|jpeg|png|svg)$/i) ? (
                                        <img src={draft.design_file_url} alt="Your design" className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                                    ) : (
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                            <FileText className="w-8 h-8 text-slate-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700">{t('orderReview.uploadedDesign')}</p>
                                                <p className="text-xs text-slate-400 truncate">{draft.design_file_url}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : draft.customization ? (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-xl">✂️</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">{t('orderReview.customDesignStudio')}</p>
                                </div>
                            ) : null}

                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">{t('orderReview.garment')}</dt>
                                    <dd className="font-medium text-slate-900">{garmentLabel}</dd>
                                </div>
                                {draft.tailor_notes && (
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500 shrink-0">{t('orderReview.notes')}</dt>
                                        <dd className="font-medium text-slate-900 text-right">{draft.tailor_notes}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Tailor section */}
                        <div className="p-6 border-b border-slate-100">
                            {isAutoMatch ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                        <Shuffle className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{t('orderReview.matchedByKere')}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{t('orderReview.tailorAssignedOnOrder')}</p>
                                    </div>
                                </div>
                            ) : tailor ? (
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">{tailor.name}</p>
                                            {tailor.specialty && <p className="text-xs text-slate-500 mt-0.5">{tailor.specialty}</p>}
                                        </div>
                                        {tailor.avg_rating !== null && (
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 fill-slate-500 text-slate-500" />
                                                <span className="text-sm font-semibold text-slate-700">{tailor.avg_rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {tailor.turnaround_days && (
                                        <p className="text-xs text-slate-500 mt-2">{t('orderReview.estDelivery', { n: tailor.turnaround_days })}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                    <span className="text-sm text-slate-500">{t('orderReview.loadingTailor')}</span>
                                </div>
                            )}
                        </div>

                        {/* Price section */}
                        <div className="p-6 border-b border-slate-100">
                            {subtotal > 0 ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t('orderReview.subtotal')}</span>
                                        <span className="text-slate-900">₾{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t('orderReview.shipping')}</span>
                                        <span className="text-slate-900">₾{SHIPPING}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold">
                                        <span className="text-slate-900">{t('orderReview.total')}</span>
                                        <span className="text-slate-900">₾{total}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t('orderReview.price')}</span>
                                        <span className="text-slate-500 italic">{t('orderReview.finalPriceNote')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t('orderReview.shipping')}</span>
                                        <span className="text-slate-900">₾{SHIPPING}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6">
                            {submitError && (
                                <div className="flex items-start gap-2 mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{submitError}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-3">
                                <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
                                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                                    {t('orderReview.back')}
                                </Button>
                                <Button variant="default" onClick={handlePlaceOrder} disabled={submitting} className="flex-1 sm:flex-none">
                                    {submitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('orderReview.placingOrder')}</>
                                    ) : t('orderReview.placeOrder')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
