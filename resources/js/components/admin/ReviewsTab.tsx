import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { formatTimestampDay } from '../../lib/dates';
import { reviewSubject, type ReviewSubject } from '../../lib/reviewSubject';
import { translateServerMessage } from '../../lib/serverMessage';
import { Button } from '../ui/button';

/**
 * Customers' reviews, as Kere moderates them (terms §20). Nothing is public
 * until an admin publishes it, and the home page then shows it with no customer
 * and no tailor named — so anything that names a person or carries contact
 * details is hidden instead. The customer and the tailor are shown here for
 * Kere alone.
 */

export interface TailorScoreValue {
    average: number;
    count: number;
}

/** A tailor's internal score, for admins: "4.8★ (12)", or a plain "no reviews yet". */
export function TailorScore({ score }: { score: TailorScoreValue | null | undefined }) {
    const { t } = useTranslation();

    return score
        ? <span className="whitespace-nowrap tabular-nums text-slate-700">{t('adminReviews.score', { average: score.average.toFixed(1), count: score.count })}</span>
        : <span className="whitespace-nowrap text-slate-400">{t('adminReviews.noScore')}</span>;
}

type ReviewStatus = 'pending' | 'published' | 'hidden';

interface AdminReview {
    id: number;
    rating: number;
    comment: string;
    status: ReviewStatus;
    created_at: string;
    order: ({ id: number; order_number: string } & ReviewSubject) | null;
    customer: { name: string; email: string | null } | null;
    tailor: { id: number; name: string } | null;
}

function ReviewRow({ review, onChanged }: { review: AdminReview; onChanged: () => void }) {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const decide = async (status: 'published' | 'hidden') => {
        setBusy(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/reviews/${review.id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                setError(translateServerMessage(await res.json().catch(() => null), t, 'adminReviews.saveFailed'));
                return;
            }
            onChanged();
        } catch {
            setError(t('adminReviews.saveFailed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-2 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">
                    <span aria-label={t('guarantee.starRating', { count: review.rating })} role="img" className="tracking-wide text-brand">
                        {'★'.repeat(review.rating)}
                        <span className="text-slate-300">{'★'.repeat(5 - review.rating)}</span>
                    </span>
                    {review.order && (
                        <>
                            <span className="ml-2 font-mono text-xs text-slate-500">{review.order.order_number}</span>
                            <span className="ml-2 text-xs text-slate-500">{reviewSubject(review.order, t)}</span>
                        </>
                    )}
                </p>
                <span className="text-xs text-slate-500">
                    {t(`adminReviews.status.${review.status}`)} · {formatTimestampDay(review.created_at, t)}
                </span>
            </div>
            <p className="whitespace-pre-line text-sm text-slate-700">{review.comment}</p>
            <p className="text-xs text-slate-500">
                {t('adminReviews.customer')}: {review.customer ? [review.customer.name, review.customer.email].filter(Boolean).join(' · ') : '—'}
                {' · '}
                {t('adminReviews.tailor')}: {review.tailor?.name ?? '—'}
            </p>
            <div className="flex flex-wrap gap-3">
                {review.status !== 'published' && (
                    <Button size="sm" disabled={busy} onClick={() => void decide('published')} className="h-7 px-3 text-xs">
                        {t('adminReviews.publish')}
                    </Button>
                )}
                {review.status !== 'hidden' && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide('hidden')} className="h-7 px-0 text-xs">
                        {t('adminReviews.hide')}
                    </Button>
                )}
            </div>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function ReviewsTab({ onChanged }: { onChanged: () => void }) {
    const { t } = useTranslation();
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    const load = useCallback(async () => {
        setFailed(false);
        try {
            const res = await fetch('/api/admin/reviews', { headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' } });
            if (!res.ok) throw new Error();
            setReviews((await res.json()).reviews ?? []);
        } catch {
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-900">{t('adminReviews.title')}</h2>
                <p className="mt-1 text-xs text-slate-500">{t('adminReviews.hint')}</p>
            </div>
            {loading ? (
                <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminDashboard.loading')}</div>
            ) : failed ? (
                <div className="px-6 py-14 text-center text-sm text-destructive">{t('adminReviews.loadFailed')}</div>
            ) : reviews.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-slate-400">{t('adminReviews.empty')}</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {reviews.map((review) => (
                        <ReviewRow
                            key={review.id}
                            review={review}
                            onChanged={() => {
                                void load();
                                onChanged();
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
