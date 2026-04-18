import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, X, Palette, Star, ChevronDown, BadgeCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ProductCardSkeleton } from '../components/skeletons/ProductCardSkeleton';
import { ErrorFallback } from '../components/ErrorFallback';
import { NotificationBell } from '../components/NotificationBell';
import { User } from 'lucide-react';
import { getAuthToken, getAuthUser } from '../hooks/useAuth';

interface ApiProduct {
    id: number;
    name: string;
    price: number;
    images: string[];
    description: string;
    is_customizable: boolean;
    tailor_id: number | null;
    tailor_name: string | null;
    category: { id: number; name: string; slug: string };
    reviews_count: number;
    average_rating: number | null;
}

interface ApiCategory {
    id: number;
    name: string;
    slug: string;
}

export default function Marketplace() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = getAuthToken();
    const user  = getAuthUser();

    const [products,  setProducts]  = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    // Filters — initialise category from URL param (?category=jackets)
    const [search,           setSearch]           = useState('');
    const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
    const [priceMax,         setPriceMax]         = useState(500);
    const [sort,             setSort]             = useState(() => searchParams.get('sort') ?? '');
    const [showFilters,      setShowFilters]       = useState(false);
    const [showSort,         setShowSort]         = useState(false);

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

    const handleSortChange = (value: string) => {
        setSort(value);
        setShowSort(false);
        const next = new URLSearchParams(searchParams);
        if (value) next.set('sort', value);
        else next.delete('sort');
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
        if (sort)              params.set('sort', sort);

        setFetchError(false);
        fetch(`/api/products?${params}`)
            .then(r => r.json())
            .then(data => {
                setProducts(data.data ?? []);
                setTotal(data.total ?? (data.data?.length ?? 0));
                setLoading(false);
            })
            .catch(() => { setLoading(false); setFetchError(true); });
    }, [selectedCategory, debouncedSearch, priceMax, sort, retryKey]);

    const hasActiveFilters = selectedCategory !== '' || priceMax < 500;

    const clearFilters = () => {
        setSelectedCategory('');
        setPriceMax(500);
        setSort('');
        setShowFilters(false);
        setSearchParams({}, { replace: true });
    };

    const sortOptions = [
        { value: '',           label: 'Most recent' },
        { value: 'popular',    label: 'Most popular' },
        { value: 'price_asc',  label: 'Price: Low → High' },
        { value: 'price_desc', label: 'Price: High → Low' },
        { value: 'rating',     label: 'Highest rated' },
    ];
    const sortLabel = sortOptions.find(o => o.value === sort)?.label ?? 'Sort';

    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>Browse Custom Clothing | Kere Marketplace</title>
                <meta name="description" content="Browse handcrafted designs from local Georgian tailors. Find the perfect garment or customize one to your exact measurements." />
            </Helmet>
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <div className="flex items-center gap-2">
                        {user && (
                            <Link
                                to={user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors"
                            >
                                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                                <span className="font-medium hidden sm:inline">{user.first_name} {user.last_name}</span>
                            </Link>
                        )}
                        {token && <NotificationBell />}
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
                <div className="flex gap-3 mb-3">
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

                    {/* Sort dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowSort(v => !v); setShowFilters(false); }}
                            className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                                sort ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className="hidden sm:inline">{sortLabel}</span>
                            <span className="sm:hidden">Sort</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {showSort && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 z-20"
                                >
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSortChange(opt.value)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                sort === opt.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => { setShowFilters(v => !v); setShowSort(false); }}
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
                                    className="absolute right-0 top-full mt-2 w-full sm:w-64 max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-lg p-5 z-20 space-y-5"
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

                {/* Active filter chips */}
                {(hasActiveFilters || sort) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                {categories.find(c => c.slug === selectedCategory)?.name ?? selectedCategory}
                                <button onClick={() => handleCategoryChange('')} className="hover:text-slate-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {priceMax < 500 && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                Max ₾{priceMax}
                                <button onClick={() => setPriceMax(500)} className="hover:text-slate-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {sort && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                {sortLabel}
                                <button onClick={() => handleSortChange('')} className="hover:text-slate-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            className="text-xs text-slate-400 hover:text-slate-700 underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Result count */}
                {!loading && (
                    <p className="text-sm text-slate-500 mb-5">
                        Showing {products.length} design{products.length !== 1 ? 's' : ''}
                        {debouncedSearch && <> for "<span className="text-slate-900 font-medium">{debouncedSearch}</span>"</>}
                    </p>
                )}

                {/* Grid */}
                {fetchError ? (
                    <ErrorFallback message="Failed to load products." onRetry={() => { setFetchError(false); setLoading(true); setRetryKey(k => k + 1); }} />
                ) : loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-32">
                        <p className="text-slate-500 font-medium mb-1">No products found</p>
                        <p className="text-slate-400 text-sm mb-4">Try different filters or search terms</p>
                        <button
                            onClick={() => { handleSearchChange(''); clearFilters(); }}
                            className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Clear all filters
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
                                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1 flex-wrap">
                                        <span>by{' '}
                                        {product.tailor_id ? (
                                            <Link
                                                to={`/tailor/${product.tailor_id}`}
                                                onClick={e => e.stopPropagation()}
                                                className="hover:text-slate-700 hover:underline transition-colors"
                                            >
                                                {product.tailor_name ?? 'Kere Tailor'}
                                            </Link>
                                        ) : (
                                            product.tailor_name ?? 'Kere Tailor'
                                        )}</span>
                                        {product.reviews_count > 0 && (
                                            <span className="inline-flex items-center gap-0.5 text-slate-500">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-medium">Verified</span>
                                            </span>
                                        )}
                                    </p>
                                    {/* Reviews */}
                                    {product.reviews_count > 0 ? (
                                        <div className="flex items-center gap-1 mb-2">
                                            {[1,2,3,4,5].map(i => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i <= Math.round(product.average_rating ?? 0) ? 'fill-slate-700 text-slate-700' : 'text-slate-300'}`}
                                                />
                                            ))}
                                            <span className="text-xs text-slate-500 ml-1">({product.reviews_count})</span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 mb-2">No reviews yet</p>
                                    )}
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

            {/* Click-away to close dropdowns */}
            {(showFilters || showSort) && (
                <div className="fixed inset-0 z-10" onClick={() => { setShowFilters(false); setShowSort(false); }} />
            )}
        </div>
    );
}
