import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Star, Briefcase, BadgeCheck, Loader2, ArrowLeft, Package, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t }    = useTranslation();

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
            <div className="min-h-screen bg-[#F4EBD4] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#631E26] animate-spin" />
            </div>
        );
    }

    if (!tailor) {
        return (
            <div className="tailor-profile-page kere-landing min-h-screen bg-[#F4EBD4] flex flex-col items-center justify-center gap-4">
                <p className="text-[#92615E]">{t('tailorProfile.notFound')}</p>
                <Link to="/marketplace" className="border-b border-[#631E26] text-sm font-semibold text-[#631E26]">{t('tailorProfile.backToMarketplace')}</Link>
            </div>
        );
    }

    return (
        <div className="tailor-profile-page kere-landing min-h-screen bg-[#F4EBD4]">
            <Helmet>
                <title>{tailor.name} — Tailor Profile | Kere</title>
                <meta name="description" content={tailor.bio ?? `Browse handcrafted designs by ${tailor.name} on Kere.`} />
            </Helmet>

            <Navigation />
            <div className="h-16" />

            <main className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <Link to="/marketplace" className="inline-flex items-center gap-2 border border-[#631E26]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#631E26] transition-colors hover:bg-[#631E26] hover:text-[#F4EBD4] mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    {t('tailorProfile.backToMarketplace')}
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid gap-8 border-y border-[#631E26]/20 py-10 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12 md:py-14"
                >
                    <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden border border-[#631E26]/20 bg-[#E9DCC4] md:max-w-none">
                        {tailor.profile_image ? (
                            <img src={tailor.profile_image} alt={tailor.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-serif text-7xl font-medium text-[#631E26]/35">
                                {tailor.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="mb-5 flex flex-wrap items-center gap-3">
                            <h1 className="font-serif text-[clamp(2.4rem,5vw,5rem)] font-medium leading-[0.95] tracking-normal text-[#111111]">{tailor.name}</h1>
                            {(tailor.reviews_count > 0 || (tailor.years_experience ?? 0) >= 2) && (
                                <span className="inline-flex items-center gap-1 border border-[#631E26]/25 bg-[#631E26] px-3 py-1.5 text-xs font-semibold text-[#F4EBD4]">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    {t('tailorProfile.verifiedTailor')}
                                </span>
                            )}
                        </div>
                        {tailor.specialty && <p className="mb-5 max-w-xl text-sm font-medium text-[#92615E]">{tailor.specialty}</p>}

                        <div className="mb-6 grid gap-3 border-y border-[#631E26]/15 py-5 text-sm sm:grid-cols-3">
                            {tailor.avg_rating !== null && (
                                <div className="flex items-center gap-2 text-[#631E26]">
                                    <Star className="w-4 h-4 fill-[#631E26] text-[#631E26]" />
                                    <span className="font-semibold text-[#111111]">{tailor.avg_rating}</span>
                                    <span className="text-[#92615E]">({tailor.reviews_count} {t('tailorProfile.reviews')})</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-[#92615E]">
                                <Package className="w-4 h-4" />
                                <span>{tailor.products_count} {t('tailorProfile.designs')}</span>
                            </div>
                            {tailor.years_experience !== null && (
                                <div className="flex items-center gap-2 text-[#92615E]">
                                    <Briefcase className="w-4 h-4" />
                                    <span>{tailor.years_experience} {t('tailorProfile.yearsExp')}</span>
                                </div>
                            )}
                        </div>

                        {tailor.bio && <p className="mb-6 max-w-2xl text-base leading-8 text-[#92615E]">{tailor.bio}</p>}

                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 border border-[#631E26]/20 bg-[#F4EBD4]/70 px-3 py-1.5 text-xs font-medium text-[#631E26]">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#92615E]" />
                                {t('tailorProfile.fitGuarantee')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 border border-[#631E26]/20 bg-[#F4EBD4]/70 px-3 py-1.5 text-xs font-medium text-[#631E26]">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#92615E]" />
                                {t('tailorProfile.kereVetted')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 border border-[#631E26]/20 bg-[#F4EBD4]/70 px-3 py-1.5 text-xs font-medium text-[#631E26]">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#92615E]" />
                                {t('tailorProfile.tbilisiBased')}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <section className="py-10 md:py-14">
                    <h2 className="mb-8 font-serif text-[clamp(1.6rem,3vw,2.8rem)] font-medium leading-tight text-[#111111]">
                        {t('tailorProfile.designsBy', { name: tailor.name })}
                    </h2>

                    {products.length === 0 ? (
                        <p className="border-y border-[#631E26]/15 py-10 text-center text-[#92615E]">{t('tailorProfile.noDesigns')}</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                            {products.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    className="group cursor-pointer overflow-hidden border border-[#631E26]/18 bg-[#F4EBD4]/80 transition-all duration-300 hover:-translate-y-1 hover:border-[#631E26]/35 hover:shadow-[0_24px_70px_rgba(99,30,38,0.14)]"
                                >
                                    <div className="aspect-[3/4] overflow-hidden bg-[#E9DCC4]">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">👗</div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="mb-1 font-serif text-base font-medium leading-tight text-[#111111]">{product.name}</h3>
                                        {product.reviews_count > 0 ? (
                                            <div className="flex items-center gap-0.5 mb-1">
                                                {[1,2,3,4,5].map(i => (
                                                    <Star key={i} className={`w-3 h-3 ${i <= Math.round(product.average_rating ?? 0) ? 'fill-[#631E26] text-[#631E26]' : 'text-[#C3A69A]'}`} />
                                                ))}
                                                <span className="text-xs text-[#92615E] ml-1">({product.reviews_count})</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[#92615E] mb-1">{t('tailorProfile.noReviews')}</p>
                                        )}
                                        <p className="text-sm font-bold text-slate-900">₾{product.price}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
