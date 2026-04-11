import { OrderCardSkeleton } from './OrderCardSkeleton';

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-3 bg-slate-200 rounded w-20" />
                            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                        </div>
                        <div className="h-7 bg-slate-200 rounded w-16 mb-1" />
                        <div className="h-3 bg-slate-200 rounded w-24" />
                    </div>
                ))}
            </div>

            {/* Orders list */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-28 animate-pulse mb-4" />
                {[...Array(3)].map((_, i) => (
                    <OrderCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
