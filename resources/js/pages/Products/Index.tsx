import { Head, Link, router } from '@inertiajs/react';
import { Search, SlidersHorizontal, X, Shirt, ChevronRight, Star } from 'lucide-react';
import { useState, useCallback } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    description: string;
    colors: string[];
    sizes: string[];
    images: string[];
    is_customizable: boolean;
    is_featured: boolean;
    category: Category;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    products: PaginatedProducts;
    categories: Category[];
    filters: {
        category?: string;
        search?: string;
        min_price?: string;
        max_price?: string;
        sort?: string;
    };
}

const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name', label: 'Name A-Z' },
];

function ProductCard({ product }: { product: Product }) {
    return (
        <Link
            href={`/products/${product.slug}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-violet-500/40 hover:bg-white/[0.07]"
        >
            <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <Shirt className="h-24 w-24 text-gray-600 transition group-hover:text-violet-500/70" />
                {product.is_customizable && (
                    <span className="absolute right-3 top-3 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white">
                        Customizable
                    </span>
                )}
                {product.is_featured && (
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                        <Star className="h-3 w-3 fill-yellow-400" /> Featured
                    </span>
                )}
            </div>
            <div className="p-4">
                <div className="mb-1 text-xs text-gray-500">{product.category?.name}</div>
                <div className="font-semibold text-white leading-tight">{product.name}</div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-400">{product.description}</p>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-violet-400">${product.price.toFixed(2)}</span>
                    <div className="flex gap-1">
                        {(product.colors ?? []).slice(0, 5).map(c => (
                            <div key={c} className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showFilters, setShowFilters] = useState(false);

    const applyFilter = useCallback((params: Record<string, string | undefined>) => {
        router.get('/products', { ...filters, ...params }, { preserveState: true, replace: true });
    }, [filters]);

    const clearFilters = () => {
        router.get('/products');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter({ search });
    };

    const activeFiltersCount = [filters.category, filters.search, filters.min_price, filters.max_price].filter(Boolean).length;

    return (
        <>
            <Head title="Shop All Products — ThreadCraft" />

            <div className="min-h-screen bg-black font-[Inter] text-white">
                {/* Top Nav */}
                <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                                <Shirt className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">ThreadCraft</span>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Link href="/" className="hover:text-white">Home</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-white">Shop</span>
                        </div>
                    </div>
                </nav>

                <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="mb-2 text-3xl font-bold">All Products</h1>
                        <p className="text-gray-400">{products.total} products available</p>
                    </div>

                    {/* Search + Sort bar */}
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500"
                            />
                        </form>
                        <select
                            value={filters.sort ?? 'newest'}
                            onChange={e => applyFilter({ sort: e.target.value })}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                        >
                            {sortOptions.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
                        </select>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs">{activeFiltersCount}</span>
                            )}
                        </button>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/20">
                                <X className="h-3 w-3" /> Clear
                            </button>
                        )}
                    </div>

                    <div className="flex gap-6">
                        {/* Sidebar Filters */}
                        {showFilters && (
                            <aside className="w-56 flex-shrink-0">
                                <div className="sticky top-24 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                                    {/* Category */}
                                    <div>
                                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Category</div>
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => applyFilter({ category: undefined })}
                                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${!filters.category ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                All Categories
                                            </button>
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => applyFilter({ category: cat.slug })}
                                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${filters.category === cat.slug ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price Range */}
                                    <div>
                                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Price Range</div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                defaultValue={filters.min_price}
                                                onBlur={e => applyFilter({ min_price: e.target.value || undefined })}
                                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                defaultValue={filters.max_price}
                                                onBlur={e => applyFilter({ max_price: e.target.value || undefined })}
                                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        )}

                        {/* Products Grid */}
                        <div className="flex-1">
                            {/* Active category chip */}
                            {filters.category && (
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Showing:</span>
                                    <span className="flex items-center gap-1 rounded-full bg-violet-600/20 px-3 py-1 text-sm text-violet-300">
                                        {categories.find(c => c.slug === filters.category)?.name}
                                        <button onClick={() => applyFilter({ category: undefined })}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                </div>
                            )}

                            {products.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <Shirt className="mb-4 h-16 w-16 text-gray-700" />
                                    <div className="text-xl font-semibold text-gray-400">No products found</div>
                                    <p className="mt-2 text-gray-600">Try adjusting your filters or search term.</p>
                                    <button onClick={clearFilters} className="mt-6 rounded-full bg-violet-600 px-6 py-2 text-sm font-medium transition hover:bg-violet-700">
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                                        {products.data.map(p => <ProductCard key={p.id} product={p} />)}
                                    </div>

                                    {/* Pagination */}
                                    {products.last_page > 1 && (
                                        <div className="mt-10 flex justify-center gap-2">
                                            {products.links.map((link, i) => (
                                                link.url ? (
                                                    <Link
                                                        key={i}
                                                        href={link.url}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                        className={`rounded-lg px-3 py-2 text-sm transition ${link.active ? 'bg-violet-600 text-white' : 'border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                                    />
                                                ) : (
                                                    <span
                                                        key={i}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                        className="rounded-lg px-3 py-2 text-sm text-gray-600"
                                                    />
                                                )
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
