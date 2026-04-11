export function OrderCardSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="h-5 bg-slate-200 rounded-full w-16" />
                <div className="h-4 bg-slate-200 rounded w-12" />
            </div>
        </div>
    );
}
