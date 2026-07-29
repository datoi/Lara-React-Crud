import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface Review {
    id: number;
    comment: string;
    rating: number;
    reviewer: string;
    location?: string;
    avatar?: string;
}

export function GuaranteeSection() {
    const { t } = useTranslation();
    const [active, setActive] = useState(0);
    const [apiReviews, setApiReviews] = useState<Review[]>([]);

    const staticReviews: Review[] = [
        {
            id: -1,
            comment: t('guarantee.review1'),
            reviewer: 'Nino Beridze',
            location: 'Tbilisi, Georgia',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=650&auto=format&fit=crop&crop=face',
            rating: 5,
        },
        {
            id: -2,
            comment: t('guarantee.review2'),
            reviewer: 'Davit Merabishvili',
            location: 'Batumi, Georgia',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=650&auto=format&fit=crop&crop=face',
            rating: 5,
        },
        {
            id: -3,
            comment: t('guarantee.review3'),
            reviewer: 'Nino Kvaratskhelia',
            location: 'Kutaisi, Georgia',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=650&auto=format&fit=crop&crop=face',
            rating: 5,
        },
    ];

    const reviews = apiReviews.length > 0 ? apiReviews : staticReviews;
    const current = reviews[active] ?? reviews[0];

    useEffect(() => {
        fetch('/api/reviews/landing')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load reviews');
                }

                return response.json();
            })
            .then((data) => {
                if (data.reviews?.length) {
                    setApiReviews(data.reviews);
                    setActive(0);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (active >= reviews.length) {
            setActive(0);
        }
    }, [active, reviews.length]);

    const prev = () => {
        setActive((value) => (value - 1 + reviews.length) % reviews.length);
    };

    const next = () => {
        setActive((value) => (value + 1) % reviews.length);
    };

    if (!current) {
        return null;
    }

    return (
        <section className="relative isolate overflow-hidden bg-[#631E26] bg-[url('/assets/backgrounds/guarantee-texture.jpg')] bg-cover bg-center px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <div className="absolute inset-0 -z-10 bg-[#631E26]/78" />

            <div className="mx-auto max-w-[1180px]">
                <div className="mb-8 flex flex-col gap-4 border-b border-[#F4EBD4]/25 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="font-serif text-[clamp(1.45rem,2.7vw,2.45rem)] font-medium leading-[1.02] tracking-normal text-[#F4EBD4]">
                            {t('guarantee.title')}
                        </h2>
                    </div>

                    <p className="max-w-sm text-xs leading-6 text-[#F4EBD4]/80 sm:text-sm">
                        {t('guarantee.subtitle')}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-[0.72fr_1.28fr] md:items-stretch">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`image-${current.id}`}
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.985 }}
                            transition={{ duration: 0.45 }}
                            className="relative min-h-[280px] overflow-hidden bg-[#e9e6e1] shadow-[0_24px_70px_rgba(39,25,16,0.18)] sm:min-h-[340px] md:min-h-[390px]"
                        >
                            {current.avatar ? (
                                <img
                                    src={current.avatar}
                                    alt={current.reviewer}
                                    className="h-full w-full object-cover grayscale"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center font-serif text-6xl text-black/20">
                                    {current.reviewer.charAt(0)}
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-[#631E26]/48 via-[#631E26]/8 to-transparent" />

                            <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between text-white">
                                <div>
                                    <p className="text-xs font-bold">
                                        {current.reviewer}
                                    </p>

                                    {current.location && (
                                        <p className="mt-1 text-[11px] text-white/65">
                                            {current.location}
                                        </p>
                                    )}
                                </div>

                                <span className="text-[10px] font-bold tracking-[0.15em] text-white/65">
                                    {String(active + 1).padStart(2, '0')}
                                </span>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex min-h-[280px] flex-col justify-between border-y border-[#F4EBD4]/25 bg-[#631E26]/72 py-6 shadow-[0_24px_70px_rgba(31,8,12,0.28)] backdrop-blur-[1px] sm:min-h-[340px] md:min-h-[390px] md:px-6 md:py-8 lg:px-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`quote-${current.id}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="flex items-center justify-between gap-5">
                                    <Quote className="h-8 w-8 stroke-[1] text-[#C3A69A]/70" />

                                    <div
                                        className="flex items-center gap-1"
                                        aria-label={`${current.rating} star rating`}
                                    >
                                        {Array.from({ length: Math.max(0, current.rating) }).map((_, index) => (
                                            <Star
                                                key={index}
                                                className="h-3.5 w-3.5 fill-[#b9923c] text-[#b9923c]"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <blockquote className="mt-8 max-w-2xl">
                                    <p className="font-serif text-[clamp(1.05rem,1.85vw,1.65rem)] font-medium leading-[1.28] tracking-normal text-[#F4EBD4]">
                                        “{current.comment}”
                                    </p>
                                </blockquote>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-8 flex flex-col gap-5 border-t border-[#F4EBD4]/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="mt-1 text-[10px] text-[#C3A69A]">
                                    {active + 1} / {reviews.length}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={prev}
                                    aria-label={t('guarantee.previousReview')}
                                    className="h-9 w-9 rounded-full border border-[#F4EBD4]/35 text-[#F4EBD4] transition-colors hover:bg-[#F4EBD4] hover:text-[#631E26]"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={next}
                                    aria-label={t('guarantee.nextReview')}
                                    className="h-9 w-9 rounded-full border border-[#F4EBD4]/35 text-[#F4EBD4] transition-colors hover:bg-[#F4EBD4] hover:text-[#631E26]"
                                >
                                    <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        {reviews.map((review, index) => {
                            const isActive = index === active;

                            return (
                                <Button
                                    key={review.id}
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setActive(index)}
                                    aria-label={t('guarantee.goToReview', {
                                        number: index + 1,
                                    })}
                                    className={[
                                        'h-1.5 rounded-full p-0 transition-all duration-200',
                                        isActive
                                            ? 'w-10 bg-[#111111] hover:bg-[#111111]'
                                            : 'w-4 bg-black/15 hover:bg-black/35',
                                    ].join(' ')}
                                />
                            );
                        })}
                    </div>

                    <p className="text-left text-sm font-bold text-[#F4EBD4] sm:text-right">
                        {t('guarantee.hashtag')}
                    </p>
                </div>
            </div>
        </section>
    );
}
