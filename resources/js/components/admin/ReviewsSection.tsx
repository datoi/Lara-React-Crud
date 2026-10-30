import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTimestampDay } from '../../lib/dates';
import { reviewSubject } from '../../lib/reviewSubject';
import { translateServerMessage } from '../../lib/serverMessage';
import { Facts, SidePanel, Stars, useDesk } from './WorkspaceUi';
import { api, type AdminReview, type ReviewStatus } from './workspace';

/**
 * Customers' reviews, as Kere moderates them (terms §20). Nothing is public
 * until an admin publishes it, and the site then shows it with no customer and
 * no tailor named — so a review that names a person or carries contact details
 * is hidden instead. The customer and the tailor are shown here for Kere alone.
 */

type ReviewView = 'waiting' | 'all' | 'low' | 'hidden';

const VIEWS: ReviewView[] = ['waiting', 'all', 'low', 'hidden'];

const STATUS_DOT: Record<ReviewStatus, string> = { pending: '#C98A2B', published: '#6E9A78', hidden: '#B1A596' };

const inView = (r: AdminReview, v: ReviewView) => (v === 'waiting' ? r.status === 'pending' : v === 'low' ? r.rating <= 2 : v === 'hidden' ? r.status === 'hidden' : true);

export function ReviewsSection({
    reviews,
    loading,
    failed,
    onRetry,
    openId,
    onOpen,
}: {
    reviews: AdminReview[];
    loading: boolean;
    failed: boolean;
    onRetry: () => void;
    openId: number | null;
    onOpen: (id: number) => void;
}) {
    const { t } = useTranslation();
    const [chosen, setChosen] = useState<ReviewView | null>(null);
    const [sort, setSort] = useState<'newest' | 'lowest'>('newest');
    // Until the admin picks a view, open on the reviews waiting for them.
    const view = chosen ?? (reviews.some((r) => r.status === 'pending') ? 'waiting' : 'all');
    const list = reviews
        .filter((r) => inView(r, view))
        .sort((a, b) => (sort === 'lowest' ? a.rating - b.rating || b.created_at.localeCompare(a.created_at) : b.created_at.localeCompare(a.created_at)));

    return (
        <section aria-label={t('adminDesk.sections.reviews')} className="ka-list" style={{ marginTop: 40 }}>
            <div className="ka-toolbar">
                <div role="group" aria-label={t('adminDesk.show')} className="ka-views">
                    {VIEWS.map((v) => (
                        <button key={v} type="button" className="ka-view" aria-pressed={view === v} onClick={() => setChosen(v)}>
                            {t(`adminDesk.reviewViews.${v}`)}
                            <span className="ka-n">{reviews.filter((r) => inView(r, v)).length}</span>
                        </button>
                    ))}
                </div>
                <div className="ka-sel-wrap" style={{ width: 210 }}>
                    <label htmlFor="ka-rs" className="ka-sr">{t('adminDesk.sortReviews')}</label>
                    <select id="ka-rs" className="ka-field ka-sel" value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'lowest')}>
                        <option value="newest">{t('adminDesk.newestFirst')}</option>
                        <option value="lowest">{t('adminDesk.lowestFirst')}</option>
                    </select>
                    <ChevronDown size={14} aria-hidden="true" />
                </div>
            </div>
            <div className="ka-card" style={{ ['--cols' as string]: '96px minmax(0, 1fr) 100px 16px' }}>
                {failed ? (
                    <div className="ka-empty">
                        <b>{t('adminReviews.loadFailed')}</b>
                        <button type="button" className="ka-btn ka-btn-sm" onClick={onRetry}>{t('adminDesk.retry')}</button>
                    </div>
                ) : loading ? (
                    <div className="ka-empty"><span>{t('adminDashboard.loading')}</span></div>
                ) : (
                    <>
                        <div role="list" aria-label={t('adminDesk.sections.reviews')}>
                            {list.map((r, i) => (
                                <div key={r.id} role="listitem">
                                    <button
                                        type="button"
                                        className={`ka-row${openId === r.id ? ' is-open' : ''}`}
                                        style={{ minHeight: 76, paddingTop: 14, paddingBottom: 14, borderTop: i === 0 ? 0 : undefined }}
                                        onClick={() => onOpen(r.id)}
                                    >
                                        <span className="ka-ca"><Stars rating={r.rating} /></span>
                                        <span className="ka-cc" style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                                            <span className="ka-cut" style={{ color: 'var(--ka-ink)' }}>{r.comment}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ka-text-2)', minWidth: 0 }}>
                                                <span className="ka-cut">{[r.customer?.name, r.order?.order_number, r.order ? reviewSubject(r.order, t) : null].filter(Boolean).join(' · ')}</span>
                                                {r.status !== 'published' && <span className="ka-tag">{t(`adminReviews.status.${r.status}`)}</span>}
                                            </span>
                                        </span>
                                        <span className="ka-cd" style={{ color: 'var(--ka-text-2)', whiteSpace: 'nowrap' }}>{formatTimestampDay(r.created_at, t)}</span>
                                        <ChevronRight size={16} aria-hidden="true" className="ka-chev" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {list.length === 0 && (
                            <div className="ka-empty" style={{ borderTop: 0 }}>
                                <span>{reviews.length ? t('adminDesk.noReviewsHere') : t('adminReviews.empty')}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}

export function ReviewPanel({
    review,
    problemOpen,
    onClose,
    onChanged,
    onOpenOrder,
}: {
    review: AdminReview;
    problemOpen: boolean;
    onClose: () => void;
    onChanged: (review: AdminReview) => void;
    onOpenOrder: (id: number) => void;
}) {
    const { t } = useTranslation();
    const { toast } = useDesk();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const decide = async (status: 'published' | 'hidden', undoTo?: ReviewStatus) => {
        setBusy(true);
        setError('');
        try {
            const { ok, data } = await api(`/api/admin/reviews/${review.id}`, 'PATCH', { status });
            if (!ok) {
                setError(translateServerMessage(data, t, 'adminReviews.saveFailed'));
                return;
            }
            onChanged({ ...review, status });
            const previous = undoTo ?? review.status;
            // A waiting review cannot be put back to waiting, so only a change
            // between published and hidden can be undone.
            const undo = !undoTo && previous !== 'pending' ? { label: t('adminDesk.undo'), run: () => void decide(previous as 'published' | 'hidden', status) } : undefined;
            toast(t(status === 'published' ? 'adminDesk.reviewPublished' : 'adminDesk.reviewHidden'), undo);
        } catch {
            setError(t('adminDesk.networkError'));
        } finally {
            setBusy(false);
        }
    };

    const facts: [string, ReactNode][] = [
        [t('adminReviews.customer'), review.customer ? [review.customer.name, review.customer.email].filter(Boolean).join(' · ') : '—'],
        [
            t('adminDesk.colOrder'),
            review.order ? (
                <button type="button" className="ka-link" onClick={() => review.order && onOpenOrder(review.order.id)}>{review.order.order_number}</button>
            ) : (
                '—'
            ),
        ],
        [t('adminReviews.tailor'), review.tailor?.name ?? '—'],
    ];
    if (review.order) facts.push([t('adminDesk.whatWasMade'), reviewSubject(review.order, t)]);
    facts.push([t('adminDesk.onTheSite'), t(review.status === 'published' ? 'adminDesk.yes' : 'adminDesk.no')]);

    return (
        <SidePanel
            kicker={t('adminDesk.review')}
            title={t('adminDesk.outOfFive', { rating: review.rating })}
            serif
            status={{ dot: STATUS_DOT[review.status], label: t(`adminDesk.reviewStatus.${review.status}`) }}
            meta={<span>{formatTimestampDay(review.created_at, t)}</span>}
            footer={
                <>
                    {review.status !== 'hidden' && (
                        <button type="button" className="ka-btn" disabled={busy} onClick={() => void decide('hidden')}>{t('adminDesk.hideFromSite')}</button>
                    )}
                    {review.status !== 'published' && (
                        <button type="button" className="ka-btn ka-btn-primary" disabled={busy} onClick={() => void decide('published')}>
                            {t(review.status === 'hidden' ? 'adminDesk.showOnSite' : 'adminReviews.publish')}
                        </button>
                    )}
                </>
            }
            onClose={onClose}
        >
            <div className="ka-col" style={{ gap: 28 }}>
                <div className="ka-section" style={{ gap: 12 }}>
                    <Stars rating={review.rating} size={18} />
                    <p className="ka-quote">“{review.comment}”</p>
                </div>
                <Facts rows={facts} />
                <p className="ka-muted" style={{ margin: 0 }}>{t('adminReviews.hint')}</p>
                {problemOpen && <p role="note" className="ka-note-warn">{t('adminDesk.reviewHasProblem')}</p>}
                {error && <p role="alert" className="ka-err">{error}</p>}
            </div>
        </SidePanel>
    );
}
