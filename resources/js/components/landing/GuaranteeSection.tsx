import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Review {
    id: number;
    comment: string;
    rating: number;
    reviewer: string;
    location?: string;
    avatar?: string;
}

const STATIC_REVIEWS: Review[] = [
    {
        id: -1,
        comment: 'I sent in my measurements, chose the fabric, and the dress arrived fitting perfectly. Working with a real local tailor made all the difference.',
        reviewer: 'Nino Beridze',
        location: 'Tbilisi, Georgia',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&auto=format&fit=crop&crop=face',
        rating: 5,
    },
    {
        id: -2,
        comment: "I designed a suit from scratch — fabric, cut, lining — and the tailor followed every detail. Will never buy off-the-rack again.",
        reviewer: 'Davit Merabishvili',
        location: 'Batumi, Georgia',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&auto=format&fit=crop&crop=face',
        rating: 5,
    },
    {
        id: -3,
        comment: 'The custom notes field let me describe exactly what I wanted. The tailor got it right on the first try. Incredible service.',
        reviewer: 'Nino Kvaratskhelia',
        location: 'Kutaisi, Georgia',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&auto=format&fit=crop&crop=face',
        rating: 5,
    },
];

export function GuaranteeSection() {
    const [reviews, setReviews] = useState<Review[]>(STATIC_REVIEWS);
    const [active, setActive]   = useState(0);

    useEffect(() => {
        fetch('/api/reviews/landing')
            .then(r => r.json())
            .then(d => {
                if (d.reviews?.length) setReviews(d.reviews);
            })
            .catch(() => {});
    }, []);

    const prev = () => setActive(a => (a - 1 + reviews.length) % reviews.length);
    const next = () => setActive(a => (a + 1) % reviews.length);

    const current = reviews[active] ?? reviews[0];

    return (
        <>
            {/* Testimonials */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                            What Our Customers Say
                        </h2>
                        <p className="text-slate-500">
                            Real reviews from customers who ordered through Kere
                        </p>
                    </motion.div>

                    {/* Card */}
                    <div className="relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.id}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.35 }}
                                className="bg-slate-50 rounded-2xl p-8 md:p-10"
                            >
                                <Quote className="w-10 h-10 text-slate-300 mb-4" />

                                {/* Stars */}
                                <div className="flex gap-1 mb-5">
                                    {Array.from({ length: current.rating }).map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-xl">★</span>
                                    ))}
                                </div>

                                <p className="text-slate-700 text-lg leading-relaxed mb-8">
                                    "{current.comment}"
                                </p>

                                <div className="flex items-center gap-4">
                                    {current.avatar ? (
                                        <img src={current.avatar} alt={current.reviewer} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg flex-shrink-0">
                                            {current.reviewer.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-slate-900">{current.reviewer}</p>
                                        {current.location && (
                                            <p className="text-sm text-slate-500">{current.location}</p>
                                        )}
                                        {!current.location && current.id > 0 && (
                                            <p className="text-xs text-green-600 font-medium">✓ Verified Purchase</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={prev}
                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>

                        <div className="flex gap-2">
                            {reviews.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActive(i)}
                                    className={`h-2 rounded-full transition-all ${i === active ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300'}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={next}
                            className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>

                    {/* #MyKereStyle */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-center mt-14"
                    >
                        <p className="text-slate-500 text-sm mb-1">Share your style with us</p>
                        <p className="text-xl font-bold text-slate-900">#MyKereStyle</p>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
