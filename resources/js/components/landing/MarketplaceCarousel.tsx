import { useState, useEffect, useRef, useCallback } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    price: number;
    images: string[];
    tailor_name: string | null;
    category: { name: string; slug: string };
    average_rating: number | null;
    reviews_count: number;
}

const INTERVAL = 3500;

function getVC(): number {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640)  return 1;
    if (window.innerWidth < 1024) return 2;
    return 4;
}

// ─── product card ────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
    const img = product.images?.[0];
    return (
        <Link to={`/product/${product.id}`} className="block group h-full">
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-100 mb-3">
                {img ? (
                    <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-10 h-10" />
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {product.category?.name}
                    </span>
                </div>
            </div>
            <div className="px-1">
                <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-600 transition-colors mb-0.5">
                    {product.name}
                </h3>
                {product.tailor_name && (
                    <p className="text-xs text-slate-400 truncate mb-1">{product.tailor_name}</p>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-slate-900 font-bold text-sm">₾{product.price}</span>
                    {product.average_rating !== null && (
                        <span className="flex items-center gap-0.5 text-xs text-slate-500">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {product.average_rating}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ─── carousel ────────────────────────────────────────────────────────────────

export function MarketplaceCarousel() {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const x             = useMotionValue(0);
    const isAnim        = useRef(false);
    const idxRef        = useRef(0);       // real index into `products`
    const cardWRef      = useRef(0);
    const vcRef         = useRef(getVC()); // visible count
    const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

    const [products,  setProducts]  = useState<Product[]>([]);
    const [cardW,     setCardW]     = useState(0);   // state copy → triggers re-render
    const [vc,        setVc]        = useState(getVC);

    // ── fetch & shuffle ──────────────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/products?per_page=20')
            .then(r => r.json())
            .then(d => {
                const list: Product[] = d.data ?? [];
                const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 16);
                setProducts(shuffled);
            })
            .catch(() => {});
    }, []);

    // ── measure container ────────────────────────────────────────────────────
    useEffect(() => {
        const measure = () => {
            if (!containerRef.current) return;
            const newVc = getVC();
            const newCW = containerRef.current.offsetWidth / newVc;
            if (newCW === 0) return;
            vcRef.current   = newVc;
            cardWRef.current = newCW;
            setVc(newVc);
            setCardW(newCW);
            x.set(-(idxRef.current + newVc) * newCW);
        };
        measure();
        // Retry after paint in case layout isn't ready yet
        const t = setTimeout(measure, 100);
        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener('resize', measure);
        return () => {
            clearTimeout(t);
            ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [x]);

    // ── set initial position when products arrive ────────────────────────────
    useEffect(() => {
        if (products.length > 0 && cardWRef.current > 0) {
            x.set(-vcRef.current * cardWRef.current);
            idxRef.current = 0;
        }
    }, [products, x]);

    const N  = products.length;

    // extended = [tail(VC), ...products, head(VC)] — enables seamless wrap
    // stripIdx = realIdx + VC
    const extended = N > 0
        ? [...products.slice(-vc), ...products, ...products.slice(0, vc)]
        : [];

    // ── advance (forward) ────────────────────────────────────────────────────
    const advance = useCallback(async () => {
        if (isAnim.current || !cardWRef.current || N <= vcRef.current) return;
        isAnim.current = true;

        const curr     = idxRef.current;
        const stripIdx = curr + vcRef.current;
        const toX      = -(stripIdx + 1) * cardWRef.current;

        await animate(x, toX, { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] });

        const next = (curr + 1) % N;
        idxRef.current = next;
        if (next === 0) {
            // Snap back to main-section start (same visual, no jump)
            x.set(-vcRef.current * cardWRef.current);
        }
        isAnim.current = false;
    }, [x, N]);

    // ── retreat (backward) ───────────────────────────────────────────────────
    const retreat = useCallback(async () => {
        if (isAnim.current || !cardWRef.current || N <= vcRef.current) return;
        isAnim.current = true;

        const curr = idxRef.current;
        let toX: number;

        if (curr === 0) {
            // We're at realIdx=0, stripIdx=VC. Going back = stripIdx VC-1 (pre-section).
            // That position already holds products[N-1] as first visible card — seamless.
            toX = -(vcRef.current - 1) * cardWRef.current;
        } else {
            toX = -(curr - 1 + vcRef.current) * cardWRef.current;
        }

        await animate(x, toX, { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] });

        const next = (curr - 1 + N) % N;
        idxRef.current = next;
        if (curr === 0) {
            // Snap to equivalent position in main section (realIdx=N-1, stripIdx=N-1+VC)
            x.set(-(next + vcRef.current) * cardWRef.current);
        }
        isAnim.current = false;
    }, [x, N]);

    // ── auto-advance ─────────────────────────────────────────────────────────
    const restartInterval = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(advance, INTERVAL);
    }, [advance]);

    useEffect(() => {
        if (N <= vc || !cardW) return;
        restartInterval();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [N, vc, cardW, restartInterval]);

    const handlePrev = useCallback(() => { restartInterval(); retreat(); }, [restartInterval, retreat]);
    const handleNext = useCallback(() => { restartInterval(); advance(); }, [restartInterval, advance]);

    if (N === 0) return null;

    return (
        <section className="py-16 md:py-24 bg-white" id="categories">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header row */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                            {t('carousel.title')}
                        </h2>
                        <p className="text-slate-500">{t('carousel.subtitle')}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={handlePrev}
                            aria-label="Previous"
                            className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <button
                            onClick={handleNext}
                            aria-label="Next"
                            className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Strip */}
                <div ref={containerRef} className="overflow-hidden">
                    {cardW > 0 && (
                        <motion.div style={{ x }} className="flex">
                            {extended.map((p, i) => (
                                <div
                                    key={`${p.id}-${i}`}
                                    style={{ width: cardW, flexShrink: 0, paddingLeft: 8, paddingRight: 8 }}
                                >
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* View all link */}
                <div className="text-center mt-10">
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {t('carousel.viewAll')}
                    </Link>
                </div>
            </div>
        </section>
    );
}
