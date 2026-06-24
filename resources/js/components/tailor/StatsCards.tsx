import { motion } from 'motion/react';
import { TrendingUp, Package, ShoppingBag, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Stats {
    revenue: number;
    activeOrders: number;
    productsListed: number;
    avgRating: number | null;
    reviewsCount: number;
}

interface StatsCardsProps {
    stats: Stats;
    statsError?: boolean;
}

export function StatsCards({ stats, statsError }: StatsCardsProps) {
    const { t } = useTranslation();

    const cards = [
        {
            label: t('tailorComponents.totalRevenue'),
            value: stats.revenue > 0 ? `₾${stats.revenue.toLocaleString()}` : '₾0',
            icon: TrendingUp,
            change: stats.revenue > 0
                ? t('tailorComponents.fromCompletedOrders')
                : t('tailorComponents.noRevenueYet'),
            positive: stats.revenue > 0,
        },
        {
            label: t('tailorComponents.activeOrders'),
            value: String(stats.activeOrders),
            icon: Package,
            change: stats.activeOrders > 0
                ? t('tailorComponents.needsAttention', { count: stats.activeOrders })
                : t('tailorComponents.noActiveOrders'),
            positive: stats.activeOrders > 0,
        },
        {
            label: t('tailorComponents.productsListed'),
            value: String(stats.productsListed),
            icon: ShoppingBag,
            change: stats.productsListed > 0
                ? t('tailorComponents.visibleInMarketplace')
                : t('tailorComponents.addFirstProductStat'),
            positive: stats.productsListed > 0,
        },
        {
            label: t('tailorComponents.avgRating'),
            value: stats.avgRating !== null ? `${stats.avgRating}★` : '—',
            icon: Star,
            change: stats.reviewsCount > 0
                ? t('tailorComponents.basedOnReviews', { count: stats.reviewsCount })
                : t('tailorComponents.noReviewsYet'),
            positive: stats.reviewsCount > 0,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {statsError && (
                <div className="col-span-2 sm:col-span-4 text-xs text-slate-400 text-center py-1">
                    {t('tailorComponents.statsFetchError', 'Stats unavailable — check your connection')}
                </div>
            )}
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                    className="bg-white rounded-2xl border border-slate-200 p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</span>
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                            <card.icon className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">{card.value}</div>
                    <div className={`text-xs ${card.positive ? 'text-slate-700' : 'text-slate-400'}`}>
                        {card.change}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
