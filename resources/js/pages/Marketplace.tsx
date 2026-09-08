import { BadgeCheck, ImageOff, Palette, Search, Star, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ErrorFallback } from '../components/ErrorFallback';
import { Navigation } from '../components/landing/Navigation';
import MarketplaceFilterRail, { type Facet } from '../components/marketplace/MarketplaceFilterRail';
import { ProductCardSkeleton } from '../components/marketplace/ProductCardSkeleton';
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

const SIZE_OPTIONS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

// The value is what the API filters on and stays as it is; only the label is
// translated, so the rail stops reading English under Georgian headings.
const COLOUR_OPTIONS = [
    { key: 'black', value: '#1B1B1B' },
    { key: 'white', value: '#FFFFFF' },
    { key: 'blue', value: '#B8C4D6' },
    { key: 'burgundy', value: '#6A1722' },
    { key: 'beige', value: '#D4C7B2' },
    { key: 'brown', value: '#7D5C45' },
    { key: 'grey', value: '#898989' },
    { key: 'green', value: '#465846' },
];
const FABRIC_OPTIONS = [
    { key: 'cotton', value: 'Cotton' },
    { key: 'linen', value: 'Linen' },
    { key: 'wool', value: 'Wool' },
    { key: 'silk', value: 'Silk' },
    { key: 'denim', value: 'Denim' },
    { key: 'leather', value: 'Leather' },
    { key: 'viscose', value: 'Viscose' },
    { key: 'chiffon', value: 'Chiffon' },
    { key: 'crepe', value: 'Crepe' },
    { key: 'jersey', value: 'Jersey' },
];

/** The grid, and the skeleton standing in for it, lay out on the same track. */
const GRID_COLUMNS = 'grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))]';

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
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoriesError, setCategoriesError] = useState(false);
    const [categoriesKey, setCategoriesKey] = useState(0);
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
        let cancelled = false;
        setCategoriesError(false);
        fetch('/api/categories')
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                if (!cancelled) setCategories(data);
            })
            .catch(() => {
                // Swallowing this used to leave the rail's category block as a
                // heading with nothing under it, which reads as broken rather
                // than as a failure the customer can retry.
                if (!cancelled) setCategoriesError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [categoriesKey]);

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
        // Only the params this page owns. ?gender= belongs to the section split,
        // and dropping it here made the effect above put it straight back.
        const next = new URLSearchParams(searchParams);
        next.delete('category');
        next.delete('sort');
        setSearchParams(next, { replace: true });
    };

    const sortOptions = [
        { value: '', label: t('marketplace.sortRecent') },
        { value: 'popular', label: t('marketplace.sortPopular') },
        { value: 'price_asc', label: t('marketplace.sortPriceLow') },
        { value: 'price_desc', label: t('marketplace.sortPriceHigh') },
        { value: 'rating', label: t('marketplace.sortRating') },
    ];

    const toggleListValue = (value: string, values: string[], setValues: (next: string[]) => void) => {
        setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    };

    const audienceTabs: { value: 'all' | Section; label: string }[] = [
        { value: 'all', label: t('marketplace.allCategories') },
        { value: 'women', label: t('section.women') },
        { value: 'men', label: t('section.men') },
    ];

    const facets: Facet[] = [
        {
            key: 'category',
            label: t('marketplace.categoryFilter'),
            options: categories
                .filter((category) => audience !== 'men' || !WOMEN_ONLY_CATEGORY_SLUGS.includes(category.slug))
                // Category names arrive from /api/categories in English. Map by
                // slug and fall back to whatever the API said for any slug the
                // locales have not caught up with.
                .map((category) => ({
                    value: category.slug,
                    label: t(`marketplace.categories.${category.slug}`, { defaultValue: category.name }),
                })),
            selected: selectedCategory ? [selectedCategory] : [],
            // One at a time: the API takes a single `category` and the page
            // mirrors it into ?category=. Re-picking the open one clears it,
            // which is what "nothing selected means all" comes to here.
            onToggle: (value) => handleCategoryChange(value === selectedCategory ? '' : value),
            columns: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-1',
            onRetry: categoriesError ? () => setCategoriesKey((k) => k + 1) : undefined,
        },
        {
            key: 'colour',
            label: t('marketplace.colourFilter'),
            options: COLOUR_OPTIONS.map((colour) => ({ value: colour.value, label: t(`marketplace.colours.${colour.key}`), swatch: colour.value })),
            selected: selectedColours,
            onToggle: (value) => toggleListValue(value, selectedColours, setSelectedColours),
            // Full rows at the rail's width, unlike the design's two columns: a
            // swatch plus "Burgundy" needs 64px of a 59px label box, and it is a
            // 22px outlier over every other colour, so tightening the row buys
            // one pixel. Two columns again once the rail runs the page width.
            columns: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-1',
            variant: 'swatch',
        },
        {
            key: 'size',
            label: t('marketplace.sizeFilter'),
            options: SIZE_OPTIONS.map((size) => ({ value: size, label: size })),
            selected: selectedSizes,
            onToggle: (value) => toggleListValue(value, selectedSizes, setSelectedSizes),
            columns: 'grid-cols-4 sm:grid-cols-8 lg:grid-cols-4',
            variant: 'chip',
        },
        {
            key: 'fabric',
            label: t('marketplace.fabricFilter'),
            options: FABRIC_OPTIONS.map((fabric) => ({ value: fabric.value, label: t(`marketplace.fabrics.${fabric.key}`) })),
            selected: selectedFabrics,
            onToggle: (value) => toggleListValue(value, selectedFabrics, setSelectedFabrics),
            columns: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-2',
        },
    ];

    // Chips read off the same facets the rail draws, so a selection can never be
    // shown in one place and missing from the other.
    const activeChips = [
        ...facets.flatMap((facet) =>
            facet.selected.map((value) => ({
                id: `${facet.key}:${value}`,
                label: facet.options.find((option) => option.value === value)?.label ?? value,
                onRemove: () => facet.onToggle(value),
            })),
        ),
        ...(priceMax < 500
            ? [{ id: 'price', label: `${t('marketplace.maxPrice')} ₾${priceMax}`, onRemove: () => setPriceMax(500) }]
            : []),
    ];

    if (!section) return null; // awaiting redirect to the section chooser

    return (
        <div className="kere-market marketplace-catalog-page min-h-screen pt-[46px] sm:pt-[50px]">
            <Helmet>
                <title>{t('marketplace.pageTitle')}</title>
                <meta
                    name="description"
                    content="Browse handcrafted designs from local Georgian tailors. Find the perfect garment or customize one to your exact measurements."
                />
            </Helmet>
            <Navigation />

            <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3vw,40px)] pt-[clamp(24px,4vw,52px)]">
                <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
                    <div>
                        <div className="text-[11px] tracking-[0.18em] text-[var(--kd-muted)] uppercase">{t('marketplace.title')}</div>
                        <h1 className="kd-display mt-1.5 text-[clamp(38px,6vw,60px)] leading-none tracking-[-0.02em] text-[var(--kd-burgundy)]">
                            {t('marketplace.allClothing')}
                        </h1>
                        <p className="mt-3.5 max-w-[40ch] text-[15px] leading-[1.5] text-[var(--kd-body)] [text-wrap:pretty]">
                            {t('marketplace.subtitle')}
                        </p>
                    </div>

                    <label className="flex h-[52px] max-w-[420px] flex-1 basis-[300px] cursor-text items-center gap-3 border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-4">
                        <Search className="h-[17px] w-[17px] flex-none text-[var(--kd-muted)]" aria-hidden="true" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder={t('marketplace.searchPlaceholder')}
                            className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[var(--kd-ink)] outline-none placeholder:text-[var(--kd-muted)]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => handleSearchChange('')}
                                aria-label={t('marketplace.clearFilters')}
                                className="flex-none text-[var(--kd-muted)] transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </label>
                </div>

                <div className="mt-7 flex flex-wrap gap-1.5">
                    {audienceTabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => {
                                if (tab.value === 'all') {
                                    setAudience('all');
                                    handleCategoryChange('');
                                    setPage(1);
                                } else {
                                    switchSection(tab.value);
                                }
                            }}
                            aria-pressed={audience === tab.value}
                            className={`inline-flex min-h-[46px] items-center px-6 text-[14px] transition-colors duration-150 ${
                                audience === tab.value
                                    ? 'border border-[var(--kd-burgundy)] bg-[var(--kd-burgundy)] text-[var(--kd-rail-text)]'
                                    : 'border border-[var(--kd-hairline)] text-[var(--kd-body)] hover:border-[var(--kd-burgundy)]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-[1440px] items-start gap-[clamp(22px,3vw,44px)] px-[clamp(16px,3vw,40px)] pt-[22px] pb-[clamp(44px,6vw,76px)] lg:grid-cols-[252px_minmax(0,1fr)]">
                <MarketplaceFilterRail
                    facets={facets}
                    priceMax={priceMax}
                    onPriceChange={setPriceMax}
                    hasActiveFilters={hasActiveFilters}
                    onClear={clearFilters}
                />

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3.5 border-b border-[var(--kd-rule)] pb-4">
                        <span className="text-[14px] text-[var(--kd-body)]">
                            {loading || fetchError
                                ? ''
                                : products.length === 1
                                  ? t('marketplace.showingOne')
                                  : t('marketplace.showingMany', { n: products.length })}
                        </span>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-[11px] tracking-[0.14em] text-[var(--kd-muted)] uppercase">{t('marketplace.sortLabel')}</span>
                            <div className="flex flex-wrap gap-1.5">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSortChange(option.value)}
                                        aria-pressed={sort === option.value}
                                        className={`inline-flex min-h-[38px] items-center px-[13px] text-[13px] transition-colors duration-150 ${
                                            sort === option.value
                                                ? 'border border-[var(--kd-ink)] bg-[var(--kd-ink)] text-[var(--kd-rail-text)]'
                                                : 'border border-[var(--kd-hairline)] bg-[var(--kd-tile)] text-[var(--kd-body)] hover:border-[var(--kd-burgundy)]'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {activeChips.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-4">
                            {activeChips.map((chip) => (
                                <button
                                    key={chip.id}
                                    type="button"
                                    onClick={chip.onRemove}
                                    className="inline-flex h-[34px] items-center gap-[9px] bg-[var(--kd-burgundy)] px-3 text-[13px] text-[var(--kd-rail-text)]"
                                >
                                    <span>{chip.label}</span>
                                    <X className="h-[11px] w-[11px] opacity-75" />
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="h-[34px] px-1 text-[13px] text-[var(--kd-muted)] underline underline-offset-[3px] transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                            >
                                {t('marketplace.clearAll')}
                            </button>
                        </div>
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
                        <div className={`grid gap-[clamp(14px,2vw,24px)] pt-5 ${GRID_COLUMNS}`}>
                            {[...Array(8)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="py-24 text-center">
                            <p className="kd-display text-[24px] text-[var(--kd-ink)]">{t('marketplace.noProducts')}</p>
                            <p className="mt-2 text-[14px] text-[var(--kd-body)]">{t('marketplace.noProductsHint')}</p>
                            <Button
                                variant="default"
                                size="default"
                                onClick={() => {
                                    handleSearchChange('');
                                    clearFilters();
                                }}
                                className="mt-6 h-11 rounded-none bg-[var(--kd-burgundy)] px-6 text-[14px] font-normal text-[var(--kd-rail-text)] hover:bg-[var(--kd-ink)]"
                            >
                                {t('marketplace.clearAllFilters')}
                            </Button>
                        </div>
                    ) : (
                        <div className={`grid gap-[clamp(14px,2vw,24px)] pt-5 ${GRID_COLUMNS}`}>
                            {products.map((product, i) => {
                                const isNew = newProductIdsRef.current === null || newProductIdsRef.current.has(product.id);
                                const newBatchIndex = newProductIdsRef.current ? [...newProductIdsRef.current].indexOf(product.id) : i;
                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={isNew ? { opacity: 0, y: 16 } : false}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: isNew ? 0.5 : 0, delay: isNew ? newBatchIndex * 0.04 : 0 }}
                                        className="group relative flex flex-col border border-[var(--kd-rule)] bg-[var(--kd-tile)] transition-colors duration-150 hover:border-[var(--kd-burgundy)] focus-within:border-[var(--kd-burgundy)]"
                                    >
                                        <div className="relative aspect-[4/5] bg-[var(--kd-stage)]">
                                            {product.is_customizable && (
                                                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 border border-[rgba(111,29,36,0.18)] bg-[rgba(255,252,248,0.94)] px-2.5 py-[5px] text-[10px] tracking-[0.06em] text-[var(--kd-burgundy)] uppercase">
                                                    <Palette className="h-[11px] w-[11px]" />
                                                    {t('marketplace.customizableBadge')}
                                                </span>
                                            )}
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain p-3.5" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[var(--kd-muted)]/40">
                                                    <ImageOff className="h-10 w-10 stroke-[1.4]" />
                                                </div>
                                            )}

                                            {/* Sibling of the card's link, not a child of it: buttons inside an
                                                anchor are invalid, and this strip is the only add-to-cart the
                                                grid offers. Pointer-less viewports get the product page instead. */}
                                            <div className="invisible absolute inset-x-0 bottom-0 z-[2] hidden items-center overflow-x-auto border-t border-[var(--kd-rule)] bg-[var(--kd-tile)]/95 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 md:flex">
                                                {(product.sizes?.length ? product.sizes : ['XS', 'S', 'M', 'L', 'XL']).map((size) => (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        onClick={() => addProductToCart(product, size)}
                                                        className="min-w-14 flex-1 px-3 py-3 text-center text-[12px] text-[var(--kd-ink)] transition-colors duration-150 hover:bg-[var(--kd-burgundy)] hover:text-[var(--kd-rail-text)]"
                                                        aria-label={`${t('marketplace.chooseSize')} ${size}`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-[var(--kd-rule-soft)] px-4 pt-3.5 pb-4">
                                            <h3 className="kd-display text-[21px] leading-[1.15] tracking-[-0.01em] text-[var(--kd-ink)] [text-wrap:pretty]">
                                                {/* Stretched link: the whole card is the target, and the
                                                    product name is what a screen reader announces for it. */}
                                                <Link
                                                    to={`/product/${product.id}`}
                                                    className="before:absolute before:inset-0 before:z-[1] before:content-['']"
                                                >
                                                    {product.name}
                                                </Link>
                                            </h3>

                                            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-1.5 text-[12px] text-[var(--kd-muted)]">
                                                <span>
                                                    {t('marketplace.by')}{' '}
                                                    {product.tailor_id ? (
                                                        <Link
                                                            to={`/tailor/${product.tailor_id}`}
                                                            className="relative z-[2] transition-colors duration-150 hover:text-[var(--kd-burgundy)] hover:underline"
                                                        >
                                                            {product.tailor_name ?? ''}
                                                        </Link>
                                                    ) : (
                                                        (product.tailor_name ?? '')
                                                    )}
                                                </span>
                                                {product.reviews_count > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <BadgeCheck className="h-3.5 w-3.5" />
                                                        {t('marketplace.verified')}
                                                    </span>
                                                )}
                                            </p>

                                            <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-[var(--kd-rule-soft)] pt-2.5">
                                                {product.reviews_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--kd-muted)] tabular-nums">
                                                        <Star className="h-3 w-3 fill-[var(--kd-burgundy)] text-[var(--kd-burgundy)]" />
                                                        {(product.average_rating ?? 0).toFixed(1)} ({product.reviews_count})
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] text-[var(--kd-muted)]">{t('marketplace.noReviews')}</span>
                                                )}
                                                <span className="text-[16px] text-[var(--kd-burgundy)] tabular-nums">₾{product.price}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {!loading && !fetchError && products.length > 0 && products.length < total && (
                        <div className="flex justify-center pt-[clamp(26px,4vw,42px)]">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="h-[52px] rounded-none border-[var(--kd-hairline)] bg-transparent px-[30px] text-[14px] font-normal text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)] hover:bg-transparent hover:text-[var(--kd-ink)]"
                            >
                                {loadingMore ? t('marketplace.loading') : t('marketplace.loadMore', { n: total - products.length })}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
