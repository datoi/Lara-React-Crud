import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Sparkles, Shirt, Scissors, Wind, Star, HardHat } from 'lucide-react';

interface CategoryApi {
    id: number;
    name: string;
    slug: string;
    products_count: number;
    sample_image: string | null;
}

const CATEGORIES = [
    {
        key: 'dresses',
        label: 'Dresses',
        description: 'Mini, Midi, Maxi - designed for you',
        Icon: Sparkles,
        fallback: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    },
    {
        key: 'shirts',
        label: 'Shirts',
        description: 'Custom fit, any style',
        Icon: Shirt,
        fallback: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80',
    },
    {
        key: 'pants',
        label: 'Pants',
        description: 'Perfect fit for every occasion',
        Icon: Scissors,
        fallback: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4d2f?w=800&q=80',
    },
    {
        key: 'jackets',
        label: 'Jackets',
        description: 'Stylish and tailored',
        Icon: Wind,
        fallback: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
    },
    {
        key: 'scarves',
        label: 'Scarves',
        description: 'Unique patterns and fabrics',
        Icon: Star,
        fallback: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
    },
    {
        key: 'hats',
        label: 'Hats',
        description: 'Personalized headwear',
        Icon: HardHat,
        fallback: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80',
    },
];

export function CategoriesSection() {
    const [apiData, setApiData] = useState<CategoryApi[]>([]);

    useEffect(() => {
        fetch('/api/categories')
            .then(r => r.json())
            .then((data: CategoryApi[]) => setApiData(data))
            .catch(() => {}); // silently fall back to static data
    }, []);

    const getApi = (key: string): CategoryApi | undefined =>
        apiData.find(c => c.slug === key);

    return (
        <section id="categories" className="py-16 md:py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                        Clothing Categories
                    </h2>
                    <p className="text-slate-500">Choose from a wide range of clothing types</p>
                </motion.div>

                {/* 3×2 grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CATEGORIES.map((cat, i) => {
                        const api      = getApi(cat.key);
                        const image    = api?.sample_image ?? cat.fallback;
                        // Only mark as empty once API has responded AND the count is 0
                        const isEmpty  = apiData.length > 0 && (api?.products_count ?? 1) === 0;

                        return (
                            <motion.div
                                key={cat.key}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: i * 0.07 }}
                                className="relative rounded-2xl overflow-hidden aspect-video sm:aspect-square group cursor-pointer"
                            >
                                <img
                                    src={image}
                                    alt={cat.label}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                                {/* Coming Soon badge */}
                                {isEmpty && (
                                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                        Coming Soon
                                    </div>
                                )}

                                {/* Card content */}
                                <div className="absolute inset-0 flex flex-col justify-end p-5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <cat.Icon className="w-4 h-4 text-white/80" />
                                        <span className="text-white font-semibold text-base">{cat.label}</span>
                                    </div>
                                    <p className="text-white/70 text-xs mb-3">{cat.description}</p>

                                    {isEmpty ? (
                                        <span className="inline-flex items-center justify-center bg-white/10 border border-white/20 text-white/50 text-xs font-medium px-3 py-1.5 rounded-lg w-fit cursor-not-allowed select-none">
                                            Notify Me
                                        </span>
                                    ) : (
                                        <Link
                                            to={`/marketplace?category=${cat.key}`}
                                            className="inline-flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white hover:text-slate-900 transition-all w-fit"
                                        >
                                            Design Yours
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
