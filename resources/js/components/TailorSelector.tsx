import { useState, useEffect } from 'react';
import { Star, Check, Users, Loader2 } from 'lucide-react';

interface Tailor {
    id: number;
    name: string;
    specialty: string | null;
    years_experience: number | null;
    avg_rating: number | null;
    reviews_count: number;
}

interface Props {
    selectedTailorId: number | null;   // null = auto assign
    onChange: (id: number | null) => void;
    category?: string;
}

export function TailorSelector({ selectedTailorId, onChange, category }: Props) {
    const [tailors, setTailors] = useState<Tailor[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchFailed, setFetchFailed] = useState(false);

    useEffect(() => {
        const url = category
            ? `/api/tailors?category=${encodeURIComponent(category)}`
            : '/api/tailors';
        fetch(url)
            .then(r => r.json())
            .then(d => setTailors((d.tailors ?? []).slice(0, 6)))
            .catch(() => setFetchFailed(true))
            .finally(() => setLoading(false));
    }, [category]);

    // Tailor with the highest avg_rating gets the "Recommended" badge
    const topRatedId = tailors.reduce<{ id: number | null; rating: number }>(
        (best, t) => t.avg_rating !== null && t.avg_rating > best.rating
            ? { id: t.id, rating: t.avg_rating }
            : best,
        { id: null, rating: -1 }
    ).id;

    const isAutoSelected = selectedTailorId === null;

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    if (fetchFailed) {
        return (
            <p className="text-xs text-slate-400 text-center py-2">
                Could not load tailors — your order will be auto-assigned.
            </p>
        );
    }

    if (tailors.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Choose Your Tailor</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    Select a tailor or let us assign the best available one
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Auto-assign card — always first, default selected */}
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className={`relative text-left p-3.5 rounded-xl border-2 transition-all ${
                        isAutoSelected
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                    {isAutoSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                        </span>
                    )}
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                        <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-xs font-semibold text-slate-900">Auto Assign</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Best available</div>
                </button>

                {tailors.map(tailor => {
                    const isSelected = selectedTailorId === tailor.id;
                    const isRecommended = tailor.id === topRatedId && tailor.avg_rating !== null;

                    return (
                        <button
                            key={tailor.id}
                            type="button"
                            onClick={() => onChange(tailor.id)}
                            className={`relative text-left p-3.5 rounded-xl border-2 transition-all ${
                                isSelected
                                    ? 'border-slate-900 bg-slate-50'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Check or Recommended badge */}
                            {isSelected ? (
                                <span className="absolute top-2 right-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </span>
                            ) : isRecommended ? (
                                <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide bg-amber-400 text-white px-1.5 py-0.5 rounded-full leading-none">
                                    Top
                                </span>
                            ) : null}

                            <div className="text-xs font-semibold text-slate-900 pr-8 truncate leading-tight">
                                {tailor.name}
                            </div>
                            {tailor.specialty && (
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{tailor.specialty}</div>
                            )}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {tailor.avg_rating !== null ? (
                                    <div className="flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                        <span className="text-[10px] font-medium text-slate-700">
                                            {tailor.avg_rating.toFixed(1)}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            ({tailor.reviews_count})
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-400">New</span>
                                )}
                                {tailor.years_experience !== null && (
                                    <span className="text-[10px] text-slate-400">
                                        · {tailor.years_experience}yr
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
