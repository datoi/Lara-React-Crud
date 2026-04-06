import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
    {
        text: 'The AI measurement feature is incredible! My dress fit perfectly, and the quality exceeded my expectations. Kere has changed how I shop for clothes.',
        name: 'Sarah Johnson',
        location: 'Tbilisi, Georgia',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&auto=format&fit=crop&crop=face',
        stars: 5,
    },
    {
        text: "Ordering a custom suit has never been this easy. The tailor followed every detail perfectly. I'll never buy off-the-rack again.",
        name: 'David Merabishvili',
        location: 'Batumi, Georgia',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&auto=format&fit=crop&crop=face',
        stars: 5,
    },
    {
        text: 'Fast delivery, perfect fit, and the fabric quality was outstanding. Kere exceeded all my expectations for custom clothing.',
        name: 'Nino Kvaratskhelia',
        location: 'Kutaisi, Georgia',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&auto=format&fit=crop&crop=face',
        stars: 5,
    },
];

export function GuaranteeSection() {
    const [active, setActive] = useState(0);

    const prev = () => setActive((a) => (a - 1 + testimonials.length) % testimonials.length);
    const next = () => setActive((a) => (a + 1) % testimonials.length);

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
                            Join thousands of satisfied customers who love their custom clothing
                        </p>
                    </motion.div>

                    {/* Card */}
                    <div className="relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.35 }}
                                className="bg-slate-50 rounded-2xl p-8 md:p-10"
                            >
                                <Quote className="w-10 h-10 text-slate-300 mb-4" />

                                {/* Stars */}
                                <div className="flex gap-1 mb-5">
                                    {Array.from({ length: testimonials[active].stars }).map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-xl">★</span>
                                    ))}
                                </div>

                                <p className="text-slate-700 text-lg leading-relaxed mb-8">
                                    "{testimonials[active].text}"
                                </p>

                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonials[active].avatar}
                                        alt={testimonials[active].name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-900">{testimonials[active].name}</p>
                                        <p className="text-sm text-slate-500">{testimonials[active].location}</p>
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
                            {testimonials.map((_, i) => (
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
