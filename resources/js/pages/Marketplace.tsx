import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, X, Palette, Star, ChevronDown, BadgeCheck, ImageOff } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ProductCardSkeleton } from '../components/skeletons/ProductCardSkeleton';
import { ErrorFallback } from '../components/ErrorFallback';
import { NotificationBell } from '../components/NotificationBell';
import { User } from 'lucide-react';
import { getAuthToken, getAuthUser } from '../hooks/useAuth';
import { getSection, setSection, type Section } from '../hooks/useSection';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = getAuthToken();
    const user  = getAuthUser(); // null unless a valid session token exists

    // Category slugs that only belong in the women's section.
    // Mirror the design studio's WOMEN_ONLY_CATEGORIES ({dress, skirt}) so both surfaces stay in sync.
    const WOMEN_ONLY_CATEGORY_SLUGS = ['dresses', 'skirts'];

    // Section split — explicit ?gender= wins, else the remembered choice.
    const genderParam = searchParams.get('gender');
    const section: Section | null =
        genderParam === 'men' || genderParam === 'women' ? genderParam : getSection('market');

    useEffect(() => {
        if (!section) {
            navigate(`/section?next=${encodeURIComponent('/marketplace')}`, { replace: true });
            return;
        }
        setSection('market', section);
        if (genderParam !== section) {
            const next = new URLSearchParams(searchParams);
            next.set('gender', section);
            setSearchParams(next, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [section, genderParam]);

    const switchSection = (s: Section) => {
        if (s === section) return;
        setSection('market', s);
        setPage(1);
        const next = new URLSearchParams(searchParams);
        next.set('gender', s);
        setSearchParams(next, { replace: true });
    };

    const [products,  setProducts]  = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [page, setPage] = useState(1);
    const isAppendRef = useRef(false);
    const newProductIdsRef = useRef<Set<number> | null>(null);

    const [search,           setSearch]           = useState('');
    const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
    const [priceMax,         setPriceMax]         = useState(500);
    const [sort,             setSort]             = useState(() => searchParams.get('sort') ?? '');
    const [showFilters,      setShowFilters]       = useState(false);
    const [showSort,         setShowSort]         = useState(false);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(val), 380);
    };

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

    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    useEffect(() => {
        fetch('/api/categories')
            .then(r => r.json())
            .then(setCategories)
            .catch(() => {});
    }, []);

    const prevFiltersRef = useRef({ selectedCategory, debouncedSearch, priceMax, sort, retryKey });

    useEffect(() => {
        if (!section) return; // awaiting redirect to the section chooser
        const prev = prevFiltersRef.current;
        const filtersChanged =
            prev.selectedCategory !== selectedCategory ||
            prev.debouncedSearch  !== debouncedSearch  ||
            prev.priceMax         !== priceMax         ||
            prev.sort             !== sort             ||
            prev.retryKey         !== retryKey;

        prevFiltersRef.current = { selectedCategory, debouncedSearch, priceMax, sort, retryKey };

        if (filtersChanged && page !== 1) {
            isAppendRef.current = false;
            setPage(1);
            return;
        }

        const append = isAppendRef.current;
        isAppendRef.current = false;

        if (append) setLoadingMore(true);
        else { setLoading(true); setFetchError(false); }

        const controller = new AbortController();
        const params = new URLSearchParams();
        if (section)           params.set('gender', section);
        if (selectedCategory) params.set('category', selectedCategory);
        if (debouncedSearch)   params.set('search', debouncedSearch);
        if (priceMax < 500)    params.set('max_price', String(priceMax));
        if (sort)              params.set('sort', sort);
        params.set('page', String(page));

        fetch(`/api/products?${params}`, { signal: controller.signal })
            .then(r => r.json())
            .then(data => {
                const incoming: ApiProduct[] = data.data ?? [];
                if (append) {
                    newProductIdsRef.current = new Set(incoming.map(p => p.id));
                    setProducts(prev => [...prev, ...incoming]);
                } else {
                    newProductIdsRef.current = null;
                    setProducts(incoming);
                }
                setTotal(data.total ?? incoming.length);
                setLoading(false);
                setLoadingMore(false);
            })
            .catch(e => {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                setLoading(false);
                setLoadingMore(false);
                setFetchError(true);
            });

        return () => controller.abort();
    }, [section, selectedCategory, debouncedSearch, priceMax, sort, page, retryKey]);

    const handleLoadMore = () => {
        isAppendRef.current = true;
        setPage(p => p + 1);
    };

    const hasActiveFilters = selectedCategory !== '' || priceMax < 500;

    const clearFilters = () => {
        setSelectedCategory('');
        setPriceMax(500);
        setSort('');
        setPage(1);
        setShowFilters(false);
        setSearchParams({}, { replace: true });
    };

    const sortOptions = [
        { value: '',           label: t('marketplace.sortRecent') },
        { value: 'popular',    label: t('marketplace.sortPopular') },
        { value: 'price_asc',  label: t('marketplace.sortPriceLow') },
        { value: 'price_desc', label: t('marketplace.sortPriceHigh') },
        { value: 'rating',     label: t('marketplace.sortRating') },
    ];
    const sortLabel = sortOptions.find(o => o.value === sort)?.label ?? t('marketplace.sortLabel');

    if (!section) return null; // awaiting redirect to the section chooser

    return (
        <div className="marketplace-catalog-page min-h-screen bg-[#E4E0D7] text-[#111111]">
            <Helmet>
                <title>{t('marketplace.pageTitle')}</title>
                <meta name="description" content="Browse handcrafted designs from local Georgian tailors. Find the perfect garment or customize one to your exact measurements." />
            </Helmet>
            <nav className="sticky top-0 z-50 border-b border-white/12 bg-[#1c1c1c] text-white">
                <div className="mx-auto flex h-12 max-w-[1180px] items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="text-xl font-semibold text-white transition-colors hover:text-white/75">
                        Kere
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center border border-white/20 p-0.5">
                            {(['women', 'men'] as Section[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => switchSection(s)}
                                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        section === s ? 'bg-white text-[#111111]' : 'text-white/65 hover:text-white'
                                    }`}
                                >
                                    {t(`section.${s}`)}
                                </button>
                            ))}
                        </div>
                        {user && (
                            <Link
                                to={user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                className="flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white"
                            >
                                <div className="flex h-7 w-7 items-center justify-center border border-white/20">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-medium hidden sm:inline">{user.first_name} {user.last_name}</span>
                            </Link>
                        )}
                        {token && <NotificationBell />}
                        <Link
                            to={section ? `/design?gender=${section}` : '/design'}
                            className="hidden items-center gap-2 border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white hover:text-[#111111] sm:flex"
                        >
                            <Palette className="w-4 h-4" />
                            {t('marketplace.createCustomDesign')}
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-7 border-b border-[#111111]/14 pb-6">
                    <h1 className="font-serif text-[clamp(2rem,4vw,4rem)] font-medium leading-[0.95] text-[#111111]">{t('marketplace.title')}</h1>
                    <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#6c625b]">{t('marketplace.subtitle')}</p>
                </div>

                <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-6 lg:items-start">
                    <div className="hidden border border-[#111111]/15 bg-[#EEEAE0] p-4 lg:block">
                        <p className="mb-3 text-[10px] font-bold uppercase text-[#111111]">{t('marketplace.categoryLabel')}</p>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleCategoryChange('')}
                                className={`block w-full px-2 py-1.5 text-left text-xs transition-colors ${!selectedCategory ? 'bg-[#111111] text-white' : 'text-[#514843] hover:bg-[#111111]/5'}`}
                            >
                                {t('marketplace.allCategories')}
                            </button>
                            {categories
                                .filter(c => section !== 'men' || !WOMEN_ONLY_CATEGORY_SLUGS.includes(c.slug))
                                .map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleCategoryChange(c.slug)}
                                    className={`block w-full px-2 py-1.5 text-left text-xs transition-colors ${selectedCategory === c.slug ? 'bg-[#111111] text-white' : 'text-[#514843] hover:bg-[#111111]/5'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 border-t border-[#111111]/12 pt-4">
                            <p className="mb-2 text-[10px] font-bold uppercase text-[#111111]">
                                {t('marketplace.maxPrice')} {priceMax < 500 ? `₾${priceMax}` : t('marketplace.maxPriceAny')}
                            </p>
                            <input
                                type="range" min={50} max={500} step={10} value={priceMax}
                                onChange={e => setPriceMax(+e.target.value)}
                                className="w-full accent-[#111111]"
                            />
                            <div className="mt-1 flex justify-between text-[10px] text-[#6c625b]">
                                <span>₾50</span><span>₾500+</span>
                            </div>
                        </div>
                        <button onClick={clearFilters} className="mt-5 w-full bg-[#111111] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333333]">
                            {t('marketplace.clearFilters')}
                        </button>
                    </div>

                    <div className="min-w-0">
                        <div className="mb-5 grid items-start gap-3 lg:grid-cols-[1fr_auto_auto]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder={t('marketplace.searchPlaceholder')}
                            className="w-full border border-[#111111]/15 bg-[#EEEAE0] py-2.5 pl-10 pr-4 text-sm text-[#111111] placeholder:text-[#6c625b]/60 focus:outline-none focus:ring-1 focus:ring-[#111111]"
                        />
                        {search && (
                            <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c625b] hover:text-[#111111]">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="relative h-fit">
                        <button
                            onClick={() => { setShowSort(v => !v); setShowFilters(false); }}
                            className={`flex items-center gap-1.5 border px-4 py-2.5 text-sm font-medium transition-colors ${
                                sort ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#111111]/15 bg-[#EEEAE0] text-[#514843] hover:bg-[#111111]/5'
                            }`}
                        >
                            <span className="hidden sm:inline">{sortLabel}</span>
                            <span className="sm:hidden">{t('marketplace.sortLabel')}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {showSort && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full z-20 mt-2 w-48 border border-[#111111]/15 bg-[#EEEAE0] p-2 shadow-lg"
                                >
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSortChange(opt.value)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                sort === opt.value ? 'bg-[#111111] text-white' : 'text-[#514843] hover:bg-[#111111]/5'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative h-fit">
                        <button
                            onClick={() => { setShowFilters(v => !v); setShowSort(false); }}
                            className={`flex items-center gap-2 border px-4 py-2.5 text-sm font-medium transition-colors lg:hidden ${
                                hasActiveFilters ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#111111]/15 bg-[#EEEAE0] text-[#514843] hover:bg-[#111111]/5'
                            }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {t('marketplace.filtersLabel')}
                            {hasActiveFilters && (
                                <span className="w-4 h-4 rounded-full bg-white text-slate-900 text-[10px] font-bold flex items-center justify-center">
                                    {(selectedCategory ? 1 : 0) + (priceMax < 500 ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full z-20 mt-2 w-full max-w-[90vw] space-y-5 border border-[#111111]/15 bg-[#EEEAE0] p-5 shadow-lg sm:w-64"
                                >
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('marketplace.categoryLabel')}</p>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => handleCategoryChange('')}
                                                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                    !selectedCategory ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {t('marketplace.allCategories')}
                                            </button>
                                            {categories
                                                .filter(c => section !== 'men' || !WOMEN_ONLY_CATEGORY_SLUGS.includes(c.slug))
                                                .map(c => (
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

                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                            {t('marketplace.maxPrice')} {priceMax < 500 ? `₾${priceMax}` : t('marketplace.maxPriceAny')}
                                        </p>
                                        <input
                                            type="range" min={50} max={500} step={10} value={priceMax}
                                            onChange={e => setPriceMax(+e.target.value)}
                                            className="w-full accent-slate-900"
                                        />
                                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                                            <span>₾50</span><span>₾500+</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button onClick={clearFilters} className="flex-1 border border-slate-200 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            {t('marketplace.clearFilters')}
                                        </button>
                                        <button onClick={() => setShowFilters(false)} className="flex-1 bg-slate-900 text-white text-xs font-medium py-2 rounded-lg hover:bg-slate-700 transition-colors">
                                            {t('marketplace.applyFilters')}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {(hasActiveFilters || sort) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                {categories.find(c => c.slug === selectedCategory)?.name ?? selectedCategory}
                                <button onClick={() => handleCategoryChange('')} className="hover:text-slate-900"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {priceMax < 500 && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                {t('marketplace.maxPrice')} ₾{priceMax}
                                <button onClick={() => setPriceMax(500)} className="hover:text-slate-900"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {sort && (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                {sortLabel}
                                <button onClick={() => handleSortChange('')} className="hover:text-slate-900"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-700 underline">
                            {t('marketplace.clearAll')}
                        </button>
                    </div>
                )}

                {!loading && (
                    <p className="mb-5 text-sm text-[#6c625b]">
                        {products.length === 1 ? t('marketplace.showingOne') : t('marketplace.showingMany', { n: products.length })}
                        {debouncedSearch && <> {t('marketplace.forSearch')} "<span className="font-medium text-[#111111]">{debouncedSearch}</span>"</>}
                    </p>
                )}

                {fetchError ? (
                    <ErrorFallback message={t('marketplace.errorLoad')} onRetry={() => { setFetchError(false); setLoading(true); setPage(1); setRetryKey(k => k + 1); }} />
                ) : loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                        {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-32 text-center">
                        <p className="mb-1 font-medium text-[#514843]">{t('marketplace.noProducts')}</p>
                        <p className="mb-4 text-sm text-[#6c625b]">{t('marketplace.noProductsHint')}</p>
                        <button
                            onClick={() => { handleSearchChange(''); clearFilters(); }}
                            className="bg-[#111111] px-4 py-2 text-sm text-white transition-colors hover:bg-[#333333]"
                        >
                            {t('marketplace.clearAllFilters')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {products.map((product, i) => {
                            const isNew = newProductIdsRef.current === null || newProductIdsRef.current.has(product.id);
                            const newBatchIndex = newProductIdsRef.current
                                ? [...newProductIdsRef.current].indexOf(product.id)
                                : i;
                            return (
                            <motion.div
                                key={product.id}
                                initial={isNew ? { opacity: 0, y: 16 } : false}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: isNew ? 0.4 : 0, delay: isNew ? newBatchIndex * 0.04 : 0 }}
                                className="group cursor-pointer overflow-hidden border border-[#111111]/18 bg-transparent transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(17,17,17,0.14)]"
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-[#EEEAE0]">
                                    {product.is_customizable && (
                                        <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#111111] shadow-sm backdrop-blur">
                                            <Palette className="w-3 h-3" />
                                            {t('marketplace.customizableBadge')}
                                        </span>
                                    )}
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[#6c625b]/28">
                                            <ImageOff className="h-10 w-10 stroke-[1.4]" />
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-[#111111]/12 px-3 py-3">
                                    <h3 className="mb-0.5 text-xs font-bold leading-tight text-[#111111] sm:text-sm">{product.name}</h3>
                                    <p className="mb-2 flex flex-wrap items-center gap-1 text-[10px] text-[#6c625b]">
                                        <span>{t('marketplace.by')}{' '}
                                        {product.tailor_id ? (
                                            <Link to={`/tailor/${product.tailor_id}`} onClick={e => e.stopPropagation()} className="transition-colors hover:text-[#111111] hover:underline">
                                                {product.tailor_name ?? ''}
                                            </Link>
                                        ) : (
                                            product.tailor_name ?? ''
                                        )}</span>
                                        {product.reviews_count > 0 && (
                                            <span className="inline-flex items-center gap-0.5 text-[#6c625b]">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-medium">{t('marketplace.verified')}</span>
                                            </span>
                                        )}
                                    </p>
                                    {product.reviews_count > 0 ? (
                                        <div className="flex items-center gap-1 mb-2">
                                            {[1,2,3,4,5].map(i => (
                                                <Star key={i} className={`h-3 w-3 ${i <= Math.round(product.average_rating ?? 0) ? 'fill-[#111111] text-[#111111]' : 'text-[#6c625b]/35'}`} />
                                            ))}
                                            <span className="ml-1 text-xs text-[#6c625b]">({product.reviews_count})</span>
                                        </div>
                                    ) : (
                                        <p className="mb-2 text-[10px] text-[#6c625b]">{t('marketplace.noReviews')}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[#111111]">₾{product.price}</span>
                                        {product.is_customizable ? (
                                            <Button
                                                size="sm"
                                                onClick={e => { e.stopPropagation(); navigate(`/product/${product.id}/customize`); }}
                                                className="gap-1.5 rounded-none bg-[#111111] px-3 text-[10px] text-white hover:bg-[#333333] active:scale-95 sm:px-4"
                                            >
                                                <Palette className="w-3.5 h-3.5" />
                                                {t('marketplace.customize')}
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={e => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
                                                className="rounded-none bg-[#111111] px-3 text-[10px] text-white hover:bg-[#333333] active:scale-95 sm:px-4"
                                            >
                                                {t('marketplace.checkProduct')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>
                )}

                {!loading && !fetchError && products.length > 0 && products.length < total && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="border border-[#111111]/18 px-6 py-2.5 text-sm font-medium text-[#111111] transition-colors hover:bg-[#111111] hover:text-white disabled:opacity-50"
                        >
                            {loadingMore ? t('marketplace.loading') : t('marketplace.loadMore', { n: total - products.length })}
                        </button>
                    </div>
                )}
                    </div>
                </div>
            </div>

            {(showFilters || showSort) && (
                <div className="fixed inset-0 z-10" onClick={() => { setShowFilters(false); setShowSort(false); }} />
            )}
        </div>
    );
}
