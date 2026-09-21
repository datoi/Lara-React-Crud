export function ProductCardSkeleton() {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="aspect-[3/4] bg-slate-200 animate-pulse" />
            <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3" />
                <div className="flex items-center justify-between pt-1">
                    <div className="h-5 bg-slate-200 rounded animate-pulse w-12" />
                    <div className="h-8 bg-slate-200 rounded-lg animate-pulse w-20" />
                </div>
            </div>
        </div>
    );
}
