import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Star, CheckCircle, Scissors } from 'lucide-react';

type Tailor = {
    id:               number;
    name:             string;
    bio:              string | null;
    specialty:        string | null;
    years_experience: number | null;
    profile_image:    string | null;
    products_count:   number;
    reviews_count:    number;
    avg_rating:       number | null;
};

function TailorSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
            <div className="bg-slate-100 h-44" />
            <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="space-y-2 pt-1">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                    <div className="h-3 bg-slate-200 rounded w-4/6" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-1/3 mt-4" />
            </div>
        </div>
    );
}

export default function OurTailors() {
    const [tailors,  setTailors]  = useState<Tailor[]>([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        fetch('/api/tailors', { headers: { 'Accept': 'application/json' } })
            .then(r => r.ok ? r.json() : null)
            .then(d => d?.tailors && setTailors(d.tailors))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">The Makers</p>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">Meet Our Tailors</h1>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                            Every piece on Kere is made by a real person with a real skill. Get to know the craftspeople
                            behind your next favourite garment.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Tailors grid */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {!loading && tailors.length === 0 ? (
                        <p className="text-center text-slate-400 py-16">No tailors yet.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {loading
                                ? Array.from({ length: 6 }).map((_, i) => <TailorSkeleton key={i} />)
                                : tailors.map((tailor, i) => (
                                    <motion.div
                                        key={tailor.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: Math.min(i * 0.07, 0.4) }}
                                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                                    >
                                        {/* Profile photo */}
                                        <div className="bg-slate-100 h-44 flex items-center justify-center shrink-0">
                                            {tailor.profile_image ? (
                                                <img
                                                    src={tailor.profile_image}
                                                    alt={tailor.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <span className="text-3xl font-bold text-slate-500">
                                                        {tailor.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            {/* Name + verified */}
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-900 text-lg truncate">{tailor.name}</h3>
                                                    {tailor.specialty && (
                                                        <p className="text-sm text-slate-500 truncate">{tailor.specialty}</p>
                                                    )}
                                                </div>
                                                <CheckCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5 ml-2" />
                                            </div>

                                            {/* Bio */}
                                            <p className="text-sm text-slate-600 leading-relaxed mt-3 flex-1 line-clamp-3">
                                                {tailor.bio ?? 'This tailor hasn\'t added a bio yet.'}
                                            </p>

                                            {/* Footer */}
                                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-3">
                                                    {tailor.years_experience != null && (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                                                            {tailor.years_experience} yrs
                                                        </span>
                                                    )}
                                                    {tailor.products_count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Scissors className="w-3.5 h-3.5 text-slate-400" />
                                                            {tailor.products_count} product{tailor.products_count !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                {tailor.avg_rating !== null && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                        <span className="font-semibold text-slate-700">{tailor.avg_rating.toFixed(1)}</span>
                                                        <span className="text-slate-400">({tailor.reviews_count})</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Link
                                                to={`/tailor/${tailor.id}`}
                                                className="mt-4 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl py-2 hover:bg-slate-50 transition-colors"
                                            >
                                                View profile
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </section>

            {/* Join CTA */}
            <section className="py-16 md:py-24 bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Are you a tailor?</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Join Kere and reach customers across Georgia. Set up your storefront, list your products,
                            and start receiving orders — all through a single dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link to="/register/tailor" className="bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors">
                                Apply as a Tailor
                            </Link>
                            <Link to="/marketplace" className="border border-slate-300 text-slate-700 font-semibold px-8 py-3 rounded-full hover:border-slate-500 transition-colors">
                                Browse the Marketplace
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
