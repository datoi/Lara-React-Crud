import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, X, Loader2, Palette, ShoppingBag } from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';
import { useCart } from '../context/CartContext';
import { getAuthToken } from '../hooks/useAuth';

interface ApiProduct {
    id: number;
    name: string;
    price: number;
    images: string[];
    description: string;
    is_customizable: boolean;
    tailor_name: string | null;
    category: { id: number; name: string; slug: string };
}

interface ApiCategory {
    id: number;
    name: string;
    slug: string;
}

export default function Marketplace() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { count: cartCount, openCart } = useCart();
    const token = getAuthToken();

    const [products,  setProducts]  = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filters — initialise category from URL param (?category=jackets)
    const [search,           setSearch]           = useState('');
    const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
    const [priceMax,         setPriceMax]         = useState(500);
    const [showFilters,      setShowFilters]       = useState(false);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(val), 380);
    };

    // Keep URL in sync so the link is shareable and the back-button works
    const handleCategoryChange = (slug: string) => {
        setSelectedCategory(slug);
        const next = new URLSearchParams(searchParams);
        if (slug) next.set('category', slug);
        else next.delete('category');
        setSearchParams(next, { replace: true });
    };

    // Load categories once
    useEffect(() => {
        fetch('/api/categories')
            .then(r => r.json())
            .then(setCategories);
    }, []);

    // Fetch products
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (debouncedSearch)   params.set('search', debouncedSearch);
        if (priceMax < 500)    params.set('max_price', String(priceMax));

        fetch(`/api/products?${params}`)
            .then(r => r.json())
            .then(data => {
                setProducts(data.data ?? []);
                setTotal(data.total ?? (data.data?.length ?? 0));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedCategory, debouncedSearch, priceMax]);

    const hasActiveFilters = selectedCategory !== '' || priceMax < 500;

    const clearFilters = () => {
        setSelectedCategory('');
        setPriceMax(500);
        setShowFilters(false);
        setSearchParams({}, { replace: true });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <div className="flex items-center gap-2">
                        {token && <NotificationBell />}
                        <button
                            onClick={openCart}
                            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <Link
                            to="/design"
                            className="flex items-center gap-2 border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Palette className="w-4 h-4" />
                            Create Custom Design
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Marketplace</h1>
                    <p className="text-slate-500 mt-1">Browse designs from local Georgian tailors</p>
                </div>

                {/* Search + Filters row */}
                <div className="flex gap-3 mb-5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder="Search designs or tailors..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                        />
                        {search && (
                            <button
                                onClick={() => handleSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                                hasActiveFilters
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-4 h-4 rounded-full bg-white text-slate-900 text-[10px] font-bold flex items-center justify-center">
                                    {(selectedCategory ? 1 : 0) + (priceMax < 500 ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        {/* Filters dropdown */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-lg p-5 z-20 space-y-5"
                                >
                                    {/* Category */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</p>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => handleCategoryChange('')}
                                                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                    !selectedCategory ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                All
                                            </button>
                                            {categories.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => handleCategoryChange(c.slug)}
                                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                        selectedCategory === c.slug ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Max price */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                            Max Price: {priceMax < 500 ? `₾${priceMax}` : 'Any'}
                                        </p>
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
                                            <span>₾50</span><span>₾500+</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={clearFilters}
                                            className="flex-1 border border-slate-200 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="flex-1 bg-slate-900 text-white text-xs font-medium py-2 rounded-lg hover:bg-slate-700 transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Result count */}
                {!loading && (
                    <p className="text-sm text-slate-500 mb-5">
                        Showing {products.length} design{products.length !== 1 ? 's' : ''}
                        {debouncedSearch && <> for "<span className="text-slate-900 font-medium">{debouncedSearch}</span>"</>}
                    </p>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-32">
                        <p className="text-slate-400 mb-3">No designs found</p>
                        <button
                            onClick={() => { handleSearchChange(''); clearFilters(); }}
                            className="text-sm text-slate-600 underline hover:text-slate-900"
                        >
                            Clear search & filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                {/* Image */}
                                <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl">👗</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-900 leading-tight mb-0.5">{product.name}</h3>
                                    <p className="text-xs text-slate-400 mb-3">
                                        by {product.tailor_name ?? 'Kere Tailor'}
                                    </p>
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

            {/* Click-away to close filters */}
            {showFilters && (
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
            )}
        </div>
    );
}
