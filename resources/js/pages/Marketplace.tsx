import { BadgeCheck, ChevronDown, ImageOff, Palette, Search, Star, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ErrorFallback } from '../components/ErrorFallback';
import { Navigation } from '../components/landing/Navigation';
import { ProductCardSkeleton } from '../components/skeletons/ProductCardSkeleton';
import { Button } from '../components/ui/button';
import { addToCart, openCart } from '../hooks/useCart';
import { getSection, setSection, type Section } from '../hooks/useSection';

interface ApiProduct {
    id: number;
    name: string;
    price: number;
    images: string[];
    sizes: string[] | null;
    colors: string[] | null;
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

type FilterMenu = 'category' | 'colour' | 'size' | 'fabric' | 'more';

const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const COLOUR_OPTIONS = [
    { label: 'Black', value: '#1B1B1B' },
    { label: 'White', value: '#FFFFFF' },
    { label: 'Blue', value: '#B8C4D6' },
    { label: 'Burgundy', value: '#6A1722' },
    { label: 'Beige', value: '#D4C7B2' },
    { label: 'Brown', value: '#7D5C45' },
    { label: 'Grey', value: '#898989' },
    { label: 'Green', value: '#465846' },
];
const FABRIC_OPTIONS = ['Cotton', 'Linen', 'Wool', 'Silk', 'Denim', 'Leather', 'Viscose', 'Chiffon', 'Crepe', 'Jersey'];

export default function Marketplace() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    // Category slugs that only belong in the women's section.
    // Mirror the design studio's WOMEN_ONLY_CATEGORIES ({dress, skirt}) so both surfaces stay in sync.
    const WOMEN_ONLY_CATEGORY_SLUGS = ['dresses', 'skirts'];

    // Section split — explicit ?gender= wins, else the remembered choice.
    const genderParam = searchParams.get('gender');
    const section: Section | null = genderParam === 'men' || genderParam === 'women' ? genderParam : getSection('market');

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
        setAudience(s);
        setSelectedCategory('');
        setPage(1);
        const next = new URLSearchParams(searchParams);
        next.set('gender', s);
        next.delete('category');
        setSearchParams(next, { replace: true });
        if (s !== section) setSection('market', s);
    };

    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [page, setPage] = useState(1);
    const isAppendRef = useRef(false);
    const newProductIdsRef = useRef<Set<number> | null>(null);

    const [search, setSearch] = useState('');
    const [audience, setAudience] = useState<'all' | Section>(() => section ?? 'all');
    const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') ?? '');
    const [selectedColours, setSelectedColours] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
    const [priceMax, setPriceMax] = useState(500);
    const [sort, setSort] = useState(() => searchParams.get('sort') ?? '');
    const [activeFilter, setActiveFilter] = useState<FilterMenu | null>(null);
    const [showSort, setShowSort] = useState(false);

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
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    useEffect(() => {
        fetch('/api/categories')
            .then((r) => r.json())
            .then(setCategories)
            .catch(() => {});
    }, []);

    const prevFiltersRef = useRef({ audience, selectedCategory, selectedColours, selectedSizes, selectedFabrics, debouncedSearch, priceMax, sort, retryKey });

    useEffect(() => {
        if (!section) return; // awaiting redirect to the section chooser
        const prev = prevFiltersRef.current;
        const filtersChanged =
            prev.audience !== audience ||
            prev.selectedCategory !== selectedCategory ||
            prev.selectedColours !== selectedColours ||
            prev.selectedSizes !== selectedSizes ||
            prev.selectedFabrics !== selectedFabrics ||
            prev.debouncedSearch !== debouncedSearch ||
            prev.priceMax !== priceMax ||
            prev.sort !== sort ||
            prev.retryKey !== retryKey;

        prevFiltersRef.current = { audience, selectedCategory, selectedColours, selectedSizes, selectedFabrics, debouncedSearch, priceMax, sort, retryKey };

        if (filtersChanged && page !== 1) {
            isAppendRef.current = false;
            setPage(1);
            return;
        }

        const append = isAppendRef.current;
        isAppendRef.current = false;

        if (append) setLoadingMore(true);
        else {
            setLoading(true);
            setFetchError(false);
        }

        const controller = new AbortController();
        const params = new URLSearchParams();
        if (audience !== 'all') params.set('gender', audience);
        if (selectedCategory) params.set('category', selectedCategory);
        selectedColours.forEach((colour) => params.append('colour[]', colour));
        selectedSizes.forEach((size) => params.append('size[]', size));
        selectedFabrics.forEach((fabric) => params.append('fabric[]', fabric));
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (priceMax < 500) params.set('max_price', String(priceMax));
        if (sort) params.set('sort', sort);
        params.set('page', String(page));

        fetch(`/api/products?${params}`, { signal: controller.signal })
            .then((r) => r.json())
            .then((data) => {
                const incoming: ApiProduct[] = data.data ?? [];
                if (append) {
                    newProductIdsRef.current = new Set(incoming.map((p) => p.id));
                    setProducts((prev) => [...prev, ...incoming]);
                } else {
                    newProductIdsRef.current = null;
                    setProducts(incoming);
                }
                setTotal(data.total ?? incoming.length);
                setLoading(false);
                setLoadingMore(false);
            })
            .catch((e) => {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                setLoading(false);
                setLoadingMore(false);
                setFetchError(true);
            });

        return () => controller.abort();
    }, [section, audience, selectedCategory, selectedColours, selectedSizes, selectedFabrics, debouncedSearch, priceMax, sort, page, retryKey]);

    const handleLoadMore = () => {
        isAppendRef.current = true;
        setPage((p) => p + 1);
    };

    const addProductToCart = (product: ApiProduct, size: string) => {
        addToCart({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] ?? null,
            size,
            // The grid strip only picks a size. Colours are stored as hex, so
            // defaulting to colors[0] would show a customer "#1E293B" — the
            // colour is chosen on the product page instead.
            color: null,
            tailorId: product.tailor_id,
            tailorName: product.tailor_name,
        });
        openCart();
    };

    const hasActiveFilters =
        selectedCategory !== '' || selectedColours.length > 0 || selectedSizes.length > 0 || selectedFabrics.length > 0 || priceMax < 500;

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedColours([]);
        setSelectedSizes([]);
        setSelectedFabrics([]);
        setPriceMax(500);
        setSort('');
        setPage(1);
        setActiveFilter(null);
        setSearchParams({}, { replace: true });
    };

    const sortOptions = [
        { value: '', label: t('marketplace.sortRecent') },
        { value: 'popular', label: t('marketplace.sortPopular') },
        { value: 'price_asc', label: t('marketplace.sortPriceLow') },
        { value: 'price_desc', label: t('marketplace.sortPriceHigh') },
        { value: 'rating', label: t('marketplace.sortRating') },
    ];
    const sortLabel = sortOptions.find((o) => o.value === sort)?.label ?? t('marketplace.sortLabel');

    const toggleListValue = (value: string, values: string[], setValues: (next: string[]) => void) => {
        setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    };

    const filterLabel = (menu: FilterMenu) =>
        ({
            category: t('marketplace.categoryFilter'),
            colour: t('marketplace.colourFilter'),
            size: t('marketplace.sizeFilter'),
            fabric: t('marketplace.fabricFilter'),
            more: t('marketplace.moreFilters'),
        })[menu];

    const resetFilter = (menu: FilterMenu) => {
        if (menu === 'category') handleCategoryChange('');
        if (menu === 'colour') setSelectedColours([]);
        if (menu === 'size') setSelectedSizes([]);
        if (menu === 'fabric') setSelectedFabrics([]);
        if (menu === 'more') setPriceMax(500);
    };

    const filterIsActive = (menu: FilterMenu) =>
        (menu === 'category' && selectedCategory !== '') ||
        (menu === 'colour' && selectedColours.length > 0) ||
        (menu === 'size' && selectedSizes.length > 0) ||
        (menu === 'fabric' && selectedFabrics.length > 0) ||
        (menu === 'more' && priceMax < 500);

    const checkboxRow = (label: string, checked: boolean, onClick: () => void, swatch?: string) => (
        <button onClick={onClick} className="flex w-full items-center gap-4 py-2.5 text-left text-sm font-semibold text-[#2c2926] hover:opacity-60">
            <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center border ${checked ? 'border-[#111111] bg-[#111111]' : 'border-[#111111]/60'}`}
            >
                {checked && <span className="h-2 w-2 bg-white" />}
            </span>
            {swatch && <span className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: swatch }} />}
            <span>{label}</span>
        </button>
    );

    const renderFilterContent = (menu: FilterMenu) => {
        if (menu === 'category') {
            return (
                <>
                    {checkboxRow(t('marketplace.allCategories'), !selectedCategory, () => handleCategoryChange(''))}
                    {categories
                        .filter((category) => audience !== 'men' || !WOMEN_ONLY_CATEGORY_SLUGS.includes(category.slug))
                        .map((category) => checkboxRow(category.name, selectedCategory === category.slug, () => handleCategoryChange(category.slug)))}
                </>
            );
        }
        if (menu === 'colour') {
            return (
                <>
                    {COLOUR_OPTIONS.map((colour) =>
                        checkboxRow(
                            colour.label,
                            selectedColours.includes(colour.value),
                            () => toggleListValue(colour.value, selectedColours, setSelectedColours),
                            colour.value,
                        ),
                    )}
                </>
            );
        }
        if (menu === 'size') {
            return (
                <>
                    {SIZE_OPTIONS.map((size) =>
                        checkboxRow(size, selectedSizes.includes(size), () => toggleListValue(size, selectedSizes, setSelectedSizes)),
                    )}
                </>
            );
        }
        if (menu === 'fabric') {
            return (
                <>
                    {FABRIC_OPTIONS.map((fabric) =>
                        checkboxRow(fabric, selectedFabrics.includes(fabric), () => toggleListValue(fabric, selectedFabrics, setSelectedFabrics)),
                    )}
                </>
            );
        }
        return (
            <div className="py-2">
                <p className="mb-4 text-sm font-semibold text-[#2c2926]">
                    {t('marketplace.maxPrice')} {priceMax < 500 ? `₾${priceMax}` : t('marketplace.maxPriceAny')}
                </p>
                <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={priceMax}
                    onChange={(event) => setPriceMax(+event.target.value)}
                    className="w-full accent-[#111111]"
                />
                <div className="mt-2 flex justify-between text-xs text-[#6c625b]">
                    <span>₾50</span>
                    <span>₾500+</span>
                </div>
            </div>
        );
    };

    if (!section) return null; // awaiting redirect to the section chooser

    return (
        <div className="marketplace-catalog-page min-h-screen bg-[#E4E0D7] text-[#111111]">
            <Helmet>
                <title>{t('marketplace.pageTitle')}</title>
                <meta
                    name="description"
                    content="Browse handcrafted designs from local Georgian tailors. Find the perfect garment or customize one to your exact measurements."
                />
            </Helmet>
            <Navigation />

            <div className="w-full px-2 pt-11 pb-8 sm:px-3 lg:px-4">
                <div className="px-4 py-12 text-center sm:py-16 lg:py-20">
                    <p className="mx-auto max-w-[620px] text-sm leading-6 text-[#6c625b]">{t('marketplace.subtitle')}</p>
                    <div className="relative mx-auto mt-8 w-full max-w-[620px]">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#6c625b]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={t('marketplace.searchPlaceholder')}
                        className="w-full border border-[#111111]/20 bg-[#EEEAE0] py-3 pr-10 pl-10 text-sm text-[#111111] placeholder:text-[#6c625b]/60 focus:ring-1 focus:ring-[#111111] focus:outline-none"
                    />
                    {search && <button onClick={() => handleSearchChange('')} className="absolute top-1/2 right-3 -translate-y-1/2 text-[#6c625b] hover:text-[#111111]"><X className="h-4 w-4" /></button>}
                    </div>
                </div>

                <div className="mb-10 overflow-x-auto">
                    <div className="flex min-w-max items-center justify-start gap-2 px-2 lg:min-w-0 lg:justify-center">
                        <button
                            onClick={() => {
                                setAudience('all');
                                handleCategoryChange('');
                                setPage(1);
                            }}
                            className={`inline-flex min-h-11 items-center px-5 py-3 text-[11px] font-semibold uppercase transition-colors ${
                                audience === 'all' ? 'bg-[#111111] text-white' : 'bg-[#EEEAE0] text-[#111111] hover:bg-[#111111]/10'
                            }`}
                        >
                            {t('marketplace.allCategories')}
                        </button>
                        {(['women', 'men'] as Section[]).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => switchSection(option)}
                                className={`inline-flex min-h-11 items-center px-5 py-3 text-[11px] font-semibold uppercase transition-colors ${
                                    audience === option ? 'bg-[#111111] text-white' : 'bg-[#EEEAE0] text-[#111111] hover:bg-[#111111]/10'
                                }`}
                            >
                                {t(`section.${option}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-y border-[#111111]/20 py-3">
                    <div className="relative order-1 h-fit w-full max-w-[280px] justify-self-start">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder={t('marketplace.searchPlaceholder')}
                            className="w-full border border-[#111111]/15 bg-[#EEEAE0] py-2.5 pr-4 pl-10 text-sm text-[#111111] placeholder:text-[#6c625b]/60 focus:ring-1 focus:ring-[#111111] focus:outline-none"
                        />
                        {search && (
                            <button
                                onClick={() => handleSearchChange('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#6c625b] hover:text-[#111111]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <p className="order-2 hidden justify-self-center text-xs font-semibold whitespace-nowrap text-[#111111] uppercase sm:block">
                        {products.length === 1 ? t('marketplace.showingOne') : t('marketplace.showingMany', { n: products.length })}
                    </p>

                    <div className="relative order-3 h-fit justify-self-end">
                        <button
                            onClick={() => {
                                setShowSort((v) => !v);
                                setActiveFilter(null);
                            }}
                            className={`flex min-h-11 items-center gap-1.5 border px-4 py-2.5 text-sm font-medium transition-colors ${
                                sort
                                    ? 'border-[#111111] bg-[#111111] text-white'
                                    : 'border-[#111111]/15 bg-[#EEEAE0] text-[#514843] hover:bg-[#111111]/5'
                            }`}
                        >
                            <span className="hidden sm:inline">{sortLabel}</span>
                            <span className="sm:hidden">{t('marketplace.sortLabel')}</span>
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        <AnimatePresence>
                            {showSort && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full right-0 z-20 mt-2 w-48 border border-[#111111]/15 bg-[#EEEAE0] p-2 shadow-lg"
                                >
                                    {sortOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSortChange(opt.value)}
                                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
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

                    <div className="relative order-1 min-w-0">
                        <div className="flex min-h-11 max-w-full flex-wrap items-center gap-x-4 gap-y-1 overflow-visible pr-3">
                            {(['category', 'colour', 'size', 'fabric', 'more'] as FilterMenu[]).map((menu) => (
                                <div key={menu} className="relative shrink-0">
                                    <button
                                        onClick={() => {
                                            setActiveFilter((current) => (current === menu ? null : menu));
                                            setShowSort(false);
                                        }}
                                        className={`inline-flex items-center gap-1 border-b py-2 text-[11px] font-semibold uppercase transition-colors ${
                                            activeFilter === menu || filterIsActive(menu)
                                                ? 'border-[#111111] text-[#111111]'
                                                : 'border-transparent text-[#514843] hover:border-[#111111]/40 hover:text-[#111111]'
                                        }`}
                                    >
                                        {filterLabel(menu)}
                                        <ChevronDown className={`h-3 w-3 transition-transform ${activeFilter === menu ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {activeFilter === menu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full left-0 z-20 mt-2 w-[min(440px,90vw)] border border-[#111111]/15 bg-[#F4F1E7] px-8 py-7 shadow-[0_18px_48px_rgba(17,17,17,0.16)]"
                                            >
                                                <h3 className="border-b border-[#111111]/15 pb-5 text-xl font-medium text-[#6c625b]">
                                                    {t('marketplace.filterPrefix')} {filterLabel(menu)}
                                                </h3>
                                                <div className="max-h-[54vh] overflow-y-auto py-5 pr-3">{renderFilterContent(menu)}</div>
                                                <button
                                                    onClick={() => resetFilter(menu)}
                                                    className="border-t border-[#111111]/15 pt-5 text-sm font-semibold text-[#111111] underline underline-offset-4"
                                                >
                                                    {t('marketplace.resetFilter')}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {(hasActiveFilters || sort) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                                {categories.find((c) => c.slug === selectedCategory)?.name ?? selectedCategory}
                                <button onClick={() => handleCategoryChange('')} className="hover:text-slate-900">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {priceMax < 500 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                                {t('marketplace.maxPrice')} ₾{priceMax}
                                <button onClick={() => setPriceMax(500)} className="hover:text-slate-900">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {sort && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                                {sortLabel}
                                <button onClick={() => handleSortChange('')} className="hover:text-slate-900">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <button onClick={clearFilters} className="text-xs text-slate-400 underline hover:text-slate-700">
                            {t('marketplace.clearAll')}
                        </button>
                    </div>
                )}

                {!loading && (
                    <p className="mb-5 text-sm text-[#6c625b] lg:hidden">
                        {products.length === 1 ? t('marketplace.showingOne') : t('marketplace.showingMany', { n: products.length })}
                        {debouncedSearch && (
                            <>
                                {' '}
                                {t('marketplace.forSearch')} "<span className="font-medium text-[#111111]">{debouncedSearch}</span>"
                            </>
                        )}
                    </p>
                )}

                {fetchError ? (
                    <ErrorFallback
                        message={t('marketplace.errorLoad')}
                        onRetry={() => {
                            setFetchError(false);
                            setLoading(true);
                            setPage(1);
                            setRetryKey((k) => k + 1);
                        }}
                    />
                ) : loading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-32 text-center">
                        <p className="mb-1 font-medium text-[#514843]">{t('marketplace.noProducts')}</p>
                        <p className="mb-4 text-sm text-[#6c625b]">{t('marketplace.noProductsHint')}</p>
                        <button
                            onClick={() => {
                                handleSearchChange('');
                                clearFilters();
                            }}
                            className="bg-[#111111] px-4 py-2 text-sm text-white transition-colors hover:bg-[#333333]"
                        >
                            {t('marketplace.clearAllFilters')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                        {products.map((product, i) => {
                            const isNew = newProductIdsRef.current === null || newProductIdsRef.current.has(product.id);
                            const newBatchIndex = newProductIdsRef.current ? [...newProductIdsRef.current].indexOf(product.id) : i;
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
                                            <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#111111] shadow-sm backdrop-blur">
                                                <Palette className="h-3 w-3" />
                                                {t('marketplace.customizableBadge')}
                                            </span>
                                        )}
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[#6c625b]/28">
                                                <ImageOff className="h-10 w-10 stroke-[1.4]" />
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 z-10 flex translate-y-0 items-center overflow-x-auto border-t border-[#111111]/15 bg-[#F4F1E7]/96 transition-transform duration-300 md:translate-y-full md:group-hover:translate-y-0">
                                            {(product.sizes?.length ? product.sizes : ['XS', 'S', 'M', 'L', 'XL']).map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        addProductToCart(product, size);
                                                    }}
                                                    className="min-w-14 flex-1 px-3 py-3 text-center text-[11px] font-semibold text-[#111111] transition-colors hover:bg-[#111111] hover:text-white sm:text-xs"
                                                    aria-label={`${t('marketplace.chooseSize')} ${size}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-[#111111]/12 px-3 py-3">
                                        <h3 className="mb-0.5 text-xs leading-tight font-bold text-[#111111] sm:text-sm">{product.name}</h3>
                                        <p className="mb-2 flex flex-wrap items-center gap-1 text-[10px] text-[#6c625b]">
                                            <span>
                                                {t('marketplace.by')}{' '}
                                                {product.tailor_id ? (
                                                    <Link
                                                        to={`/tailor/${product.tailor_id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="transition-colors hover:text-[#111111] hover:underline"
                                                    >
                                                        {product.tailor_name ?? ''}
                                                    </Link>
                                                ) : (
                                                    (product.tailor_name ?? '')
                                                )}
                                            </span>
                                            {product.reviews_count > 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-[#6c625b]">
                                                    <BadgeCheck className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-medium">{t('marketplace.verified')}</span>
                                                </span>
                                            )}
                                        </p>
                                        {product.reviews_count > 0 ? (
                                            <div className="mb-2 flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-3 w-3 ${i <= Math.round(product.average_rating ?? 0) ? 'fill-[#111111] text-[#111111]' : 'text-[#6c625b]/35'}`}
                                                    />
                                                ))}
                                                <span className="ml-1 text-xs text-[#6c625b]">({product.reviews_count})</span>
                                            </div>
                                        ) : (
                                            <p className="mb-2 text-[10px] text-[#6c625b]">{t('marketplace.noReviews')}</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-[#111111]">₾{product.price}</span>
                                            {!product.is_customizable && (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/product/${product.id}`);
                                                    }}
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

            {(activeFilter || showSort) && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => {
                        setActiveFilter(null);
                        setShowSort(false);
                    }}
                />
            )}

        </div>
    );
}
