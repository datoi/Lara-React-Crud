import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Star, SlidersHorizontal, X, Palette, Loader2 } from 'lucide-react';

interface ApiProduct {
    id: number;
    name: string;
    price: number;
    images: string[];
    description: string;
    is_customizable: boolean;
    category: { id: number; name: string; slug: string };
}

interface ApiCategory {
    id: number;
    name: string;
    slug: string;
    products_count: number;
}

const TAILORS = ['Nino Beridze', 'Giorgi Maisuradze', 'Tamar Kvanchilashvili', 'Levan Gogishvili', 'Ana Jishkariani'];
const RATINGS = [4.5, 4.6, 4.7, 4.8, 4.9, 5.0];

// Deterministic mock extras based on product id
function getTailor(id: number) { return TAILORS[id % TAILORS.length]; }
function getRating(id: number) { return RATINGS[id % RATINGS.length]; }
function getReviews(id: number) { return 10 + (id * 7) % 50; }

export default function Marketplace() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [priceMax, setPriceMax] = useState(500);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch categories once
    useEffect(() => {
        fetch('/api/categories')
            .then(r => r.json())
            .then(setCategories);
    }, []);

    // Fetch products on filter change
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (priceMax < 500) params.set('max_price', String(priceMax));
        params.set('per_page', '24');

        fetch(`/api/products?${params}`)
            .then(r => r.json())
            .then(data => {
                setProducts(data.data ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedCategory, priceMax]);

    const activeFilters = [
        selectedCategory && categories.find(c => c.slug === selectedCategory)?.name,
        priceMax < 500 && `up to ₾${priceMax}`,
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors md:hidden"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                        </button>
                        <Link
                            to="/design"
                            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <Palette className="w-4 h-4" />
                            Create Custom Design
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {loading ? 'Loading…' : `${products.length} designs from local Georgian tailors`}
                    </p>
                </div>

                {/* Active filter chips */}
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {activeFilters.map(f => (
                            <span key={String(f)} className="flex items-center gap-1 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full">
                                {String(f)}
                                <button onClick={() => {
                                    if (categories.find(c => c.name === f)) setSelectedCategory('');
                                    if (String(f).startsWith('up to')) setPriceMax(500);
                                }}>
                                    <X className="w-3 h-3 ml-0.5" />
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={() => { setSelectedCategory(''); setPriceMax(500); }}
                            className="text-xs text-slate-400 hover:text-slate-700 underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                <div className="flex gap-6">
                    {/* Sidebar filters */}
                    <aside className={`w-56 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-24 space-y-6">
                            {/* Category */}
                            <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Category</div>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        All
                                    </button>
                                    {categories.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCategory(c.slug)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === c.slug ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                    Max price: ₾{priceMax === 500 ? 'Any' : priceMax}
                                </div>
                                <input
                                    type="range"
                                    min={50}
                                    max={500}
                                    step={10}
                                    value={priceMax}
                                    onChange={e => setPriceMax(+e.target.value)}
                                    className="w-full accent-slate-900"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>₾50</span>
                                    <span>₾500</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Products grid */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-24">
                                <div className="text-slate-400 text-lg mb-2">No products match your filters</div>
                                <button onClick={() => { setSelectedCategory(''); setPriceMax(500); }} className="text-sm underline text-slate-500 hover:text-slate-900">
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {products.map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.05 }}
                                        whileHover={{ y: -4 }}
                                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    >
                                        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
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
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-900 leading-tight">{product.name}</h3>
                                                {product.is_customizable && (
                                                    <span className="flex-shrink-0 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Custom</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mb-2">by {getTailor(product.id)}</p>
                                            <div className="flex items-center gap-1 mb-3">
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-medium text-slate-700">{getRating(product.id)}</span>
                                                <span className="text-xs text-slate-400">({getReviews(product.id)})</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-slate-900">₾{product.price}</span>
                                                <button
                                                    onClick={e => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
                                                    className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors active:scale-95"
                                                >
                                                    Customize
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
