import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { DashboardHeader } from '../components/tailor/DashboardHeader';
import { StatsCards } from '../components/tailor/StatsCards';
import { OrdersList, type TailorOrder } from '../components/tailor/OrdersList';
import { ProductManager, type TailorProductFull } from '../components/tailor/ProductManager';
import { getAuthUser, getAuthToken } from '../hooks/useAuth';

export default function TailorDashboard() {
    const user  = getAuthUser();
    const token = getAuthToken();

    const [orders,   setOrders]   = useState<TailorOrder[]>([]);
    const [products, setProducts] = useState<TailorProductFull[]>([]);
    const [loadingOrders,   setLoadingOrders]   = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

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

    useEffect(() => { fetchOrders(); fetchProducts(); }, [fetchOrders, fetchProducts]);

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
        if (res.ok) {
            const data = await res.json();
            setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
        }
    };

    // ─── Stats ────────────────────────────────────────────────────────────────
    const revenue      = orders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    const stats = {
        revenue,
        activeOrders,
        productsListed: products.length,
        avgRating: 4.9,
    };

    const greeting = user ? user.first_name : 'Tailor';

    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader earnings={stats.revenue} />

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

                {/* Stats */}
                <StatsCards stats={stats} />

                {/* Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                >
                    {loadingOrders ? (
                        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-12 text-center text-slate-400 text-sm">
                            Loading orders…
                        </div>
                    ) : (
                        <OrdersList orders={orders} onStatusChange={handleStatusChange} />
                    )}
                </motion.div>

                {/* Products */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                >
                    {loadingProducts ? (
                        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-12 text-center text-slate-400 text-sm">
                            Loading products…
                        </div>
                    ) : (
                        <ProductManager
                            products={products}
                            onProductAdded={p => setProducts(prev => [p, ...prev])}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
