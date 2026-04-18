import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, X } from 'lucide-react';
import { DashboardHeader } from '../components/tailor/DashboardHeader';
import { StatsCards } from '../components/tailor/StatsCards';
import { OrdersList, type TailorOrder } from '../components/tailor/OrdersList';
import { ProductManager, type TailorProductFull } from '../components/tailor/ProductManager';
import { TailorProfileEditor } from '../components/tailor/TailorProfileEditor';
import { OnboardingPanel } from '../components/tailor/OnboardingPanel';
import { SetupChecklist } from '../components/tailor/SetupChecklist';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { getAuthUser, getAuthToken } from '../hooks/useAuth';

export default function TailorDashboard() {
    const user  = getAuthUser();
    const token = getAuthToken();

    const [orders,   setOrders]   = useState<TailorOrder[]>([]);
    const [products, setProducts] = useState<TailorProductFull[]>([]);
    const [loadingOrders,   setLoadingOrders]   = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [avgRating,       setAvgRating]       = useState<number | null>(null);
    const [reviewsCount,    setReviewsCount]    = useState(0);
    const [profileComplete, setProfileComplete] = useState(false);

    // Lifted modal state — lets OnboardingPanel / SetupChecklist open the add-product modal
    const [openAddModal, setOpenAddModal] = useState(false);

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
                .then(r => r.json())
                .then(d => {
                    setAvgRating(d.avg_rating ?? null);
                    setReviewsCount(d.reviews_count ?? 0);
                    setProfileComplete(d.profile_complete ?? false);
                })
                .catch(() => {});
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

    const scrollToProfile = () =>
        document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const greeting = user ? user.first_name : 'Tailor';

    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader earnings={stats.revenue} />

            {/* ── Post-add success toast ── */}
            <AnimatePresence>
                {productJustAdded && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 max-w-sm w-full mx-4"
                    >
                        <CheckCircle className="w-4 h-4 text-green-300 shrink-0" />
                        <span className="flex-1">Your product is now live. Customers can start ordering from you.</span>
                        <button onClick={() => setProductJustAdded(false)} className="text-green-300 hover:text-white transition-colors ml-1">
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
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back, {greeting} 👋</h1>
                    <p className="text-slate-500 mt-1">Here's what's happening with your shop today.</p>
                </motion.div>

                {/* ── Onboarding panel — 0 products ── */}
                {showOnboarding && (
                    <OnboardingPanel onAddProduct={() => setOpenAddModal(true)} />
                )}

                {/* ── Stats + checklist side-by-side once there's data ── */}
                {!showOnboarding && (
                    <>
                        <StatsCards stats={stats} />

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

                {/* ── Motivation nudge — visible when not onboarding and setup incomplete ── */}
                {!showOnboarding && !setupComplete && profileComplete && products.length > 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="text-xs text-slate-400 text-center"
                    >
                        Customers are actively searching for custom clothing — keep building your shop.
                    </motion.p>
                )}

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
                                <div className="mb-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                                    <span className="text-base">💡</span>
                                    <span>
                                        <strong>Complete your profile</strong> — tailors with a bio and specialty get
                                        significantly more visibility in search results.
                                    </span>
                                </div>
                            )}
                            <TailorProfileEditor token={token} tailorId={user.id} />
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
