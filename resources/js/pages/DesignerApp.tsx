import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

// ─── Garment categories ───────────────────────────────────────────────────────

const CATEGORIES = [
    { key: 'shirt',      label: 'Shirt / Top',  emoji: '👔' },
    { key: 'womens-top', label: "Woman's Top",  emoji: '👚' },
    { key: 'dress',      label: 'Dress',         emoji: '👗' },
    { key: 'trousers',   label: 'Trousers',      emoji: '👖' },
    { key: 'jacket',     label: 'Jacket',        emoji: '🧥' },
    { key: 'skirt',      label: 'Skirt',         emoji: '🩱' },
    { key: 'coat',       label: 'Coat',          emoji: '🧤' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string;
    base_price: number;
    preview_image_url: string | null;
}

// ─── Step 1: Category picker ──────────────────────────────────────────────────

function CategoryStep({ onSelect }: { onSelect: (key: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
        >
            <h1 className="text-2xl font-bold text-slate-900 mb-2">What do you want to design?</h1>
            <p className="text-slate-500 mb-8">Choose a garment type to see available styles.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CATEGORIES.map((cat, i) => (
                    <motion.button
                        key={cat.key}
                        onClick={() => onSelect(cat.key)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        whileHover={{ scale: 1.03 }}
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all flex flex-col items-center gap-3 text-center"
                    >
                        <span className="text-4xl">{cat.emoji}</span>
                        <span className="text-sm font-semibold text-slate-800">{cat.label}</span>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Step 2: Product list for chosen category ─────────────────────────────────

function ProductStep({
    category,
    onBack,
}: {
    category: string;
    onBack: () => void;
}) {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);

    const catLabel = CATEGORIES.find(c => c.key === category)?.label ?? category;

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch('/api/customizer/products')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                const all: Product[] = data.products ?? [];
                setProducts(all.filter(p => p.category === category));
            })
            .catch(err => setError(err.message ?? 'Failed to load products.'))
            .finally(() => setLoading(false));
    }, [category]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">{catLabel}</h1>
            <p className="text-slate-500 mb-8">Choose a style to start customising.</p>

            {loading && (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
            )}

            {error && (
                <p className="text-slate-500 text-sm">{error}</p>
            )}

            {!loading && !error && products.length === 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
                    <p className="text-slate-400 text-sm">No styles available yet for this category.</p>
                    <p className="text-slate-300 text-xs mt-1">Check back soon.</p>
                </div>
            )}

            {!loading && !error && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((product, i) => (
                        <motion.button
                            key={product.id}
                            onClick={() => navigate(`/customize/${product.slug}`)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-lg transition-all text-left overflow-hidden"
                        >
                            {/* Preview image */}
                            <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                                {product.preview_image_url ? (
                                    <img
                                        src={product.preview_image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl opacity-30">{CATEGORIES.find(c => c.key === category)?.emoji ?? '👕'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                            {product.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Starting from</span>
                                    <span className="text-sm font-bold text-slate-900">₾{product.base_price}</span>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DesignerApp() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>Design Studio | Kere</title>
                <meta name="description" content="Design your custom garment — choose a style and customise it to your taste." />
            </Helmet>

            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <span className="text-xs text-slate-400 hidden sm:block">Custom Design Studio</span>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <AnimatePresence mode="wait">
                    {selectedCategory === null ? (
                        <CategoryStep key="categories" onSelect={setSelectedCategory} />
                    ) : (
                        <ProductStep
                            key={selectedCategory}
                            category={selectedCategory}
                            onBack={() => setSelectedCategory(null)}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
