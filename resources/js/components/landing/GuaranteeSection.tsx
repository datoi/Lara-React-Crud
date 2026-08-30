import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
        <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden bg-[#F4F0E9] px-4 py-12 sm:px-6 md:py-16 lg:px-8"
        >
            <div className="mx-auto max-w-[1180px]">
                <div className="mb-8 border-b border-black/15 pb-6 text-center">
                    <div className="mx-auto">
                        <h2 className="font-serif text-[clamp(1.45rem,2.7vw,2.45rem)] font-medium leading-[1.02] tracking-normal text-black">
                            {t('guarantee.title')}
                        </h2>
                    </div>

                </div>

                <div className="mx-auto max-w-4xl">
                    <div className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden bg-[url('/assets/backgrounds/review-card-ivory-embossed.png')] bg-cover bg-center px-5 py-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.12)] before:absolute before:inset-0 before:z-0 before:bg-white/10 sm:min-h-[340px] sm:px-10 md:px-16 md:py-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`quote-${current.id}`}
                                className="relative z-10"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div
                                    className="flex items-center justify-center gap-1"
                                    aria-label={`${current.rating} star rating`}
                                >
                                        {Array.from({ length: Math.max(0, current.rating) }).map((_, index) => (
                                            <span
                                                key={index}
                                                aria-hidden="true"
                                                className="bg-clip-text text-xl leading-none text-transparent"
                                                style={{
                                                    backgroundImage: "url('/assets/textures/gold-foil.png')",
                                                    backgroundPosition: 'center',
                                                    backgroundSize: 'cover',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}
                                            >
                                                ★
                                            </span>
                                        ))}
                                </div>

                                <blockquote className="mx-auto mt-8 max-w-2xl">
                                    <p className="font-serif text-[clamp(1.05rem,1.85vw,1.65rem)] font-normal leading-[1.28] tracking-normal !text-[#514843]">
                                        “{current.comment}”
                                    </p>
                                </blockquote>

                                <div className="mt-7 text-center">
                                    <p className="text-xs font-normal !text-[#6c625b]">{current.reviewer}</p>
                                    {current.location && (
                                        <p className="mt-1 text-[11px] !text-[#8a817b]">{current.location}</p>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="relative z-10 mt-8 flex items-center justify-center gap-5 border-t border-black/15 pt-5">
                            <p className="text-[10px] !text-[#8a817b]">
                                {active + 1} / {reviews.length}
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={prev}
                                    aria-label={t('guarantee.previousReview')}
                                    className="h-9 w-9 rounded-full border border-black/30 !text-[#111111] transition-colors hover:bg-black hover:!text-white"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={next}
                                    aria-label={t('guarantee.nextReview')}
                                    className="h-9 w-9 rounded-full border border-black/30 !text-[#111111] transition-colors hover:bg-black hover:!text-white"
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

                    <p className="text-left text-sm font-normal !text-[#6c625b] sm:text-right">
                        {t('guarantee.hashtag')}
                    </p>
                </div>
            </div>
        </motion.section>
    );
}
