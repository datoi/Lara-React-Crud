import { motion } from 'motion/react';
import { DashboardHeader } from '../components/tailor/DashboardHeader';
import { StatsCards } from '../components/tailor/StatsCards';
import { OrdersList } from '../components/tailor/OrdersList';
import { ProductManager } from '../components/tailor/ProductManager';
import { getAuthUser } from '../hooks/useAuth';

const MOCK_ORDERS = [
    { id: '#KR-0041', customer: 'Mariam Tsereteli', product: 'Floral Maxi Dress', status: 'in-progress' as const, amount: 180, date: '2024-04-01', dueDate: 'Apr 10' },
    { id: '#KR-0039', customer: 'Davit Kiknadze', product: 'Linen Blazer', status: 'pending' as const, amount: 240, date: '2024-04-02', dueDate: 'Apr 14' },
    { id: '#KR-0037', customer: 'Nana Gelashvili', product: 'Silk Blouse', status: 'completed' as const, amount: 120, date: '2024-03-28', dueDate: 'Apr 5' },
    { id: '#KR-0035', customer: 'Giorgi Beraia', product: 'Wool Trench', status: 'in-progress' as const, amount: 380, date: '2024-03-30', dueDate: 'Apr 12' },
    { id: '#KR-0033', customer: 'Tamara Sulakvelidze', product: 'Wide Leg Pants', status: 'pending' as const, amount: 130, date: '2024-04-03', dueDate: 'Apr 15' },
];

const MOCK_PRODUCTS = [
    { id: 1, name: 'Floral Wrap Dress', category: 'Dresses', price: 180, orders: 34, status: 'active' as const },
    { id: 2, name: 'Summer Linen Blazer', category: 'Jackets', price: 240, orders: 22, status: 'active' as const },
    { id: 3, name: 'Silk Evening Blouse', category: 'Shirts', price: 120, orders: 18, status: 'active' as const },
    { id: 4, name: 'A-Line Midi Dress', category: 'Dresses', price: 160, orders: 12, status: 'paused' as const },
    { id: 5, name: 'Embroidered Shirt', category: 'Shirts', price: 100, orders: 9, status: 'active' as const },
];

const STATS = {
    revenue: 12480,
    activeOrders: 5,
    productsListed: 5,
    avgRating: 4.9,
};

export default function TailorDashboard() {
    const user = getAuthUser();
    const greeting = user ? user.first_name : 'Nino';
    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader earnings={STATS.revenue} />

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
                <StatsCards stats={STATS} />

                {/* Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                >
                    <OrdersList orders={MOCK_ORDERS} />
                </motion.div>

                {/* Products */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                >
                    <ProductManager products={MOCK_PRODUCTS} />
                </motion.div>
            </div>
        </div>
    );
}
