import { motion } from 'motion/react';
import { TrendingUp, Package, ShoppingBag, Star } from 'lucide-react';

interface Stats {
    revenue: number;
    activeOrders: number;
    productsListed: number;
    avgRating: number | null;
    reviewsCount: number;
}

interface StatsCardsProps {
    stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            label: 'Total Revenue',
            value: stats.revenue > 0 ? `₾${stats.revenue.toLocaleString()}` : '₾0',
            icon: TrendingUp,
            change: stats.revenue > 0 ? 'From completed orders' : 'No revenue yet',
            positive: stats.revenue > 0,
        },
        {
            label: 'Active Orders',
            value: String(stats.activeOrders),
            icon: Package,
            change: stats.activeOrders > 0
                ? `${stats.activeOrders} need${stats.activeOrders === 1 ? 's' : ''} attention`
                : 'No active orders',
            positive: stats.activeOrders > 0,
        },
        {
            label: 'Products Listed',
            value: String(stats.productsListed),
            icon: ShoppingBag,
            change: stats.productsListed > 0 ? 'Visible in marketplace' : 'Add your first product',
            positive: stats.productsListed > 0,
        },
        {
            label: 'Average Rating',
            value: stats.avgRating !== null ? `${stats.avgRating}★` : '—',
            icon: Star,
            change: stats.reviewsCount > 0
                ? `Based on ${stats.reviewsCount} ${stats.reviewsCount === 1 ? 'review' : 'reviews'}`
                : 'No reviews yet',
            positive: stats.reviewsCount > 0,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="bg-white rounded-2xl border border-slate-200 p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</span>
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                            <card.icon className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">{card.value}</div>
                    <div className={`text-xs ${card.positive ? 'text-green-600' : 'text-slate-400'}`}>
                        {card.change}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
