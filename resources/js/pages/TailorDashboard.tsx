import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, X, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from '../components/tailor/DashboardHeader';
import { StatsCards } from '../components/tailor/StatsCards';
import { OrdersList, type TailorOrder } from '../components/tailor/OrdersList';
import { AvailableDesigns } from '../components/tailor/AvailableDesigns';
import { ProductManager, type TailorProductFull } from '../components/tailor/ProductManager';
import { TailorProfileEditor } from '../components/tailor/TailorProfileEditor';
import { OnboardingPanel } from '../components/tailor/OnboardingPanel';
import { SetupChecklist } from '../components/tailor/SetupChecklist';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { getAuthUser, getAuthToken, clearAuth, updateAuthUser } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router';

export default function TailorDashboard() {
    const { t } = useTranslation();
    const [user, setUser] = useState(getAuthUser());
    const token = getAuthToken();

    const [orders,   setOrders]   = useState<TailorOrder[]>([]);
    const [products, setProducts] = useState<TailorProductFull[]>([]);
    const [loadingOrders,   setLoadingOrders]   = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [avgRating,       setAvgRating]       = useState<number | null>(null);
    const [reviewsCount,    setReviewsCount]    = useState(0);
    const [profileComplete, setProfileComplete] = useState(false);
    const [statsError,      setStatsError]      = useState(false);

    // Lifted modal state — lets OnboardingPanel / SetupChecklist open the add-product modal
    const [openAddModal, setOpenAddModal] = useState(false);

    // Lifted profile editor expanded state — lets SetupChecklist open it
    const [profileEditorOpen, setProfileEditorOpen] = useState(false);

    // Post-add success toast
    const [productJustAdded, setProductJustAdded] = useState(false);

    // ─── Fetch orders ─────────────────────────────────────────────────────────
    const fetchOrders = useCallback(async () => {
        if (!token) { setLoadingOrders(false); return; }
        try {
            const res = await fetch('/api/tailor/orders', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (res.ok) setOrders((await res.json()).orders ?? []);
        } finally {
            setLoadingOrders(false);
        }
    }, [token]);

    // ─── Fetch products ───────────────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        if (!token) { setLoadingProducts(false); return; }
        try {
            const res = await fetch('/api/tailor/products', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (res.ok) setProducts((await res.json()).products ?? []);
        } finally {
            setLoadingProducts(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
        fetchProducts();
        if (token) {
            fetch('/api/tailor/stats', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            })
                .then(r => { if (!r.ok) throw new Error('stats'); return r.json(); })
                .then(d => {
                    setAvgRating(d.avg_rating ?? null);
                    setReviewsCount(d.reviews_count ?? 0);
                    setProfileComplete(d.profile_complete ?? false);
                })
                .catch(() => { setStatsError(true); });
        }
    }, [fetchOrders, fetchProducts, token]);

    // ─── Status update ────────────────────────────────────────────────────────
    const handleStatusChange = async (orderId: number, status: string): Promise<void> => {
        if (!token) return;
        const res = await fetch(`/api/tailor/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update status');
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: status as TailorOrder['status'] } : o
        ));
    };

    // ─── Product added ────────────────────────────────────────────────────────
    const handleProductAdded = (p: TailorProductFull) => {
        setProducts(prev => [p, ...prev]);
        setProductJustAdded(true);
        setTimeout(() => setProductJustAdded(false), 6000);
    };

    // ─── Stats ────────────────────────────────────────────────────────────────
    const revenue      = orders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    const stats = { revenue, activeOrders, productsListed: products.length, avgRating, reviewsCount };

    // ─── Setup state ──────────────────────────────────────────────────────────
    const setupComplete = profileComplete && products.length >= 3;
    const showOnboarding = !loadingProducts && products.length === 0;
    const showChecklist  = !loadingProducts && products.length > 0 && !setupComplete;

    const scrollToProfile = () => {
        setProfileEditorOpen(true);
        setTimeout(() => document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const greeting = user ? user.first_name : t('tailorDashboard.tailorFallback');
    const navigate = useNavigate();

    // ─── Approval status polling ─────────────────────────────────────────────
    // Tailors sitting on the pending/rejected gate have no other way to learn
    // their status changed — there's no re-login trigger, so poll /api/me.
    const approvalStatus = user?.approval_status;
    useEffect(() => {
        if (!token || (approvalStatus !== 'pending' && approvalStatus !== 'rejected')) return;

        const controller = new AbortController();
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/me', {
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    signal: controller.signal,
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data.user && data.user.approval_status !== approvalStatus) {
                    updateAuthUser(data.user);
                    setUser(data.user);
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
            }
        };

        const id = setInterval(checkStatus, 15_000);
        return () => {
            clearInterval(id);
            controller.abort();
        };
    }, [token, approvalStatus]);

    // ─── Approval gate ────────────────────────────────────────────────────────
    if (user?.approval_status === 'pending') {
        return (
            <div className="tailor-dashboard-page min-h-screen bg-[#F4EBD4] flex flex-col">
                <nav className="bg-white border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">Kere</Link>
                        <button onClick={() => { clearAuth(); navigate('/'); }} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                            {t('tailorComponents.signOut')}
                        </button>
                    </div>
                </nav>
                <div className="flex-1 flex items-center justify-center py-16 px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-8 h-8 text-brand" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-3">{t('tailorDashboard.pendingTitle')}</h1>
                        <p className="text-slate-500 leading-relaxed mb-8">{t('tailorDashboard.pendingDesc')}</p>
                        <p className="text-xs text-slate-400">{t('tailorDashboard.pendingContact')}</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (user?.approval_status === 'rejected') {
        return (
            <div className="tailor-dashboard-page min-h-screen bg-[#F4EBD4] flex flex-col">
                <nav className="bg-white border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">Kere</Link>
                        <button onClick={() => { clearAuth(); navigate('/'); }} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                            {t('tailorComponents.signOut')}
                        </button>
                    </div>
                </nav>
                <div className="flex-1 flex items-center justify-center py-16 px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-slate-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-3">{t('tailorDashboard.rejectedTitle')}</h1>
                        <p className="text-slate-500 leading-relaxed mb-8">{t('tailorDashboard.rejectedDesc')}</p>
                        <Link to="/" className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors">
                            {t('register.tailorPendingBack')}
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="tailor-dashboard-page min-h-screen bg-[#F4EBD4] text-[#631E26]">
            <DashboardHeader earnings={stats.revenue} />

            {/* ── Post-add success toast ── */}
            <AnimatePresence>
                {productJustAdded && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-sm font-medium px-5 py-3 rounded-lg shadow-lg flex items-center gap-2.5 max-w-sm w-full mx-4"
                    >
                        <CheckCircle className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="flex-1">{t('tailorDashboard.productLive')}</span>
                        <button onClick={() => setProductJustAdded(false)} className="text-slate-300 hover:text-white transition-colors ml-1">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h1 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.02] tracking-normal text-[#111111]">
                        {t('tailorDashboard.welcomeBack', { name: greeting })}
                    </h1>
                </motion.div>

                {/* ── Onboarding panel — 0 products ── */}
                {showOnboarding && (
                    <OnboardingPanel onAddProduct={() => setOpenAddModal(true)} />
                )}

                {/* ── Stats + checklist side-by-side once there's data ── */}
                {!showOnboarding && (
                    <>
                        <StatsCards stats={stats} statsError={statsError} />

                        {showChecklist && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <SetupChecklist
                                    profileComplete={profileComplete}
                                    productsCount={products.length}
                                    onAddProduct={() => setOpenAddModal(true)}
                                    onEditProfile={scrollToProfile}
                                />
                            </motion.div>
                        )}
                    </>
                )}

                {/* ── Available design requests (open pool) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <AvailableDesigns />
                </motion.div>

                {/* ── Orders ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                >
                    {loadingOrders ? (
                        <DashboardSkeleton />
                    ) : (
                        <OrdersList orders={orders} onStatusChange={handleStatusChange} />
                    )}
                </motion.div>

                {/* ── Products ── */}
                {!loadingOrders && (
                    <motion.div
                        id="products-section"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 }}
                    >
                        {!loadingProducts && (
                            <ProductManager
                                products={products}
                                onProductAdded={handleProductAdded}
                                externalOpen={openAddModal}
                                onExternalClose={() => setOpenAddModal(false)}
                            />
                        )}
                    </motion.div>
                )}

                {/* ── Edit Profile ── */}
                <motion.div
                    id="profile-section"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 }}
                >
                    {token && user && (
                        <>
                            {!profileComplete && (
                                <div className="mb-3 flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                                    <span className="text-base">💡</span>
                                    <span>
                                        <strong>{t('tailorDashboard.completeProfile')}</strong> — {t('tailorDashboard.completeProfileHint')}
                                    </span>
                                </div>
                            )}
                            <TailorProfileEditor
                                token={token}
                                tailorId={user.id}
                                expanded={profileEditorOpen}
                                onExpandedChange={setProfileEditorOpen}
                                onSaved={(complete) => setProfileComplete(complete)}
                            />
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
