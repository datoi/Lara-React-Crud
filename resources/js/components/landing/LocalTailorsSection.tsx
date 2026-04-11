import { motion } from 'motion/react';
import { Award, Users, Heart, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';

interface PlatformStats {
    tailors_count: number;
    orders_count: number;
    avg_rating: number | null;
    reviews_count: number;
}

const bullets = [
    'Tbilisi-based tailors, vetted by Kere',
    'Domestic & imported fabric options',
    "Free alterations if the fit isn't right",
];

export function LocalTailorsSection() {
    const [stats, setStats] = useState<PlatformStats | null>(null);

    useEffect(() => {
        fetch('/api/platform/stats')
            .then(r => r.json())
            .then(setStats)
            .catch(() => {});
    }, []);

    const cards = [
        { icon: Award, label: stats?.tailors_count ? String(stats.tailors_count) : '—', sublabel: 'Local Tailors' },
        { icon: Users, label: stats?.orders_count  ? String(stats.orders_count)  : '—', sublabel: 'Orders Fulfilled' },
        { icon: Heart, label: stats?.avg_rating    ? `${stats.avg_rating}★`      : '—', sublabel: 'Avg. Rating' },
        { icon: Clock, label: '7–14d',                                                   sublabel: 'Avg. Turnaround' },
    ];

    return (
        <section className="py-16 md:py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left — image */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                            <img
                                src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop"
                                alt="Tailor at sewing machine"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Badge overlay */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="absolute bottom-6 left-6 bg-slate-900 text-white rounded-2xl p-4 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Master Craftsmen</p>
                                <p className="text-xs text-slate-300">Certified Experts</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right — content */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Made by Local Tailors
                        </h2>
                        <p className="text-slate-500 text-base leading-relaxed mb-8">
                            Your custom clothing is crafted by skilled local tailors who bring quality craftsmanship and attention to detail to every piece.
                        </p>

                        {/* 2x2 stat cards */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {cards.map((s, i) => (
                                <motion.div
                                    key={s.sublabel}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    className="bg-white border border-slate-200 rounded-xl p-4"
                                >
                                    <s.icon className="w-5 h-5 text-slate-700 mb-2" />
                                    <p className="font-bold text-slate-900">{s.label}</p>
                                    <p className="text-xs text-slate-500">{s.sublabel}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Bullet list */}
                        <ul className="space-y-2 mb-8">
                            {bullets.map((b) => (
                                <li key={b} className="flex items-center gap-2 text-slate-600 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                    {b}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/design"
                            className="inline-block border border-slate-900 text-slate-900 text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Start Your Design
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
