import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Star, Briefcase, BadgeCheck, Loader2, ArrowLeft, Package, ShieldCheck } from 'lucide-react';

interface TailorData {
    id: number;
    name: string;
    bio: string | null;
    specialty: string | null;
    years_experience: number | null;
    profile_image: string | null;
    products_count: number;
    reviews_count: number;
    avg_rating: number | null;
}

interface ProductCard {
    id: number;
    name: string;
    price: number;
    images: string[];
    category: string | null;
    tailor_name: string;
    reviews_count: number;
    average_rating: number | null;
    is_customizable: boolean;
}

export default function TailorProfile() {
    const { id }   = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [tailor,   setTailor]   = useState<TailorData | null>(null);
    const [products, setProducts] = useState<ProductCard[]>([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/tailors/${id}`)
            .then(r => r.json())
            .then(data => {
                setTailor(data.tailor);
                setProducts(data.products ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    if (!tailor) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500">Tailor not found.</p>
                <Link to="/marketplace" className="text-slate-900 underline text-sm">Back to Marketplace</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>{tailor.name} — Tailor Profile | Kere</title>
                <meta name="description" content={tailor.bio ?? `Browse handcrafted designs by ${tailor.name} on Kere.`} />
            </Helmet>

            <Navigation />
            <div className="h-16" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Back */}
                <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Marketplace
                </Link>

                {/* Profile header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-start gap-6 mb-12"
                >
                    {/* Avatar */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                        {tailor.profile_image ? (
                            <img src={tailor.profile_image} alt={tailor.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-500">
                                {tailor.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{tailor.name}</h1>
                            {(tailor.reviews_count > 0 || (tailor.years_experience ?? 0) >= 2) && (
                                <span className="inline-flex items-center gap-1 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Verified Tailor
                                </span>
                            )}
                        </div>
                        {tailor.specialty && (
                            <p className="text-slate-500 mb-3">{tailor.specialty}</p>
                        )}

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-4 text-sm mb-4">
                            {tailor.avg_rating !== null && (
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 fill-slate-700 text-slate-700" />
                                    <span className="font-semibold text-slate-900">{tailor.avg_rating}</span>
                                    <span className="text-slate-400">({tailor.reviews_count} reviews)</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Package className="w-4 h-4" />
                                <span>{tailor.products_count} designs</span>
                            </div>
                            {tailor.years_experience !== null && (
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{tailor.years_experience} years experience</span>
                                </div>
                            )}
                        </div>

                        {tailor.bio && (
                            <p className="text-slate-600 leading-relaxed max-w-2xl mb-4">{tailor.bio}</p>
                        )}

                        {/* Guarantees */}
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                                Fit Guarantee
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                                Kere-vetted
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                                Tbilisi-based
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Products grid */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6">
                        Designs by {tailor.name}
                    </h2>

                    {products.length === 0 ? (
                        <p className="text-slate-400">No designs listed yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    className="bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">👗</div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-0.5">{product.name}</h3>
                                        {product.reviews_count > 0 ? (
                                            <div className="flex items-center gap-0.5 mb-1">
                                                {[1,2,3,4,5].map(i => (
                                                    <Star key={i} className={`w-3 h-3 ${i <= Math.round(product.average_rating ?? 0) ? 'fill-slate-700 text-slate-700' : 'text-slate-300'}`} />
                                                ))}
                                                <span className="text-xs text-slate-400 ml-1">({product.reviews_count})</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 mb-1">No reviews</p>
                                        )}
                                        <p className="text-sm font-bold text-slate-900">₾{product.price}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
