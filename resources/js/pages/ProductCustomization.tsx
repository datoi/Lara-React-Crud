import { Check, HelpCircle, ImageOff, Info, Loader2, Minus, Palette, Plus, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { ErrorFallback } from '../components/ErrorFallback';
import { MeasurementGuideModal, type MeasurementKey } from '../components/MeasurementGuideModal';
import { Footer } from '../components/landing/Footer';
import { Navigation } from '../components/landing/Navigation';
import { Button } from '../components/ui/button';
import {
    clearPendingOrder,
    getAuthToken,
    getPendingOrder,
    savePendingOrder,
    saveReturnTo,
    type PendingMarketplaceOrder,
} from '../hooks/useAuth';
import { addToCart, openCart } from '../hooks/useCart';
import { measurementWarning } from '../utils/measurementSanity';

interface ApiProduct {
    id: number;
    name: string;
    price: number;
    description: string;
    images: string[];
    colors: string[];
    sizes: string[];
    is_customizable: boolean;
    category: { id: number; name: string; slug: string };
    tailor_id: number | null;
    tailor_name: string | null;
}

/**
 * The label keys ship with a trailing colon ("ფერი:"), which read as a typo
 * once the labels are set as uppercase eyebrows rather than inline prefixes.
 */
const stripColon = (label: string) => label.replace(/\s*[:：]\s*$/, '');

/** Shared by the detail column's blocks, each ruled off from the next. */
const BLOCK = 'border-b border-[var(--kd-rule)] py-[22px]';
const EYEBROW = 'text-[11px] tracking-[0.14em] text-[var(--kd-muted)] uppercase';

/**
 * Cormorant Garamond has no ₾ glyph — measured, the symbol advances 21.25px
 * against a digit's 11.26px, identical to the generic serif fallback it drops
 * through to. Set the sign in the UI face at the digits' optical size so the
 * display prices stop mixing two faces mid-string.
 */
function Lari() {
    return <span className="font-sans text-[0.66em] tracking-normal">₾</span>;
}

export default function ProductCustomization({ customize = false }: { customize?: boolean }) {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<ApiProduct | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('M');
    const [measurements, setMeasurements] = useState({ chest: '', waist: '', hips: '', length: '' });
    const [customizationNote, setCustomizationNote] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [shippingCost, setShippingCost] = useState(15);
    const [assignedTailor, setAssignedTailor] = useState('');
    const [selectedTailorId, setSelectedTailorId] = useState<number | null>(null);
    const [ordered, setOrdered] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [guideStep, setGuideStep] = useState<MeasurementKey | null>(null);
    // The review list came off the page with the redesign; only the summary the
    // gallery strip shows is still needed. null means the call has not landed
    // (or failed) — distinct from a product that genuinely has no reviews, which
    // would otherwise be asserted on the strength of a failed request.
    const [rating, setRating] = useState<{ average: number | null; count: number } | null>(null);
    const [fetchError, setFetchError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (redirectRef.current) clearTimeout(redirectRef.current);
    }, []);

    const openGuide = (key: string) => {
        const valid: MeasurementKey[] = ['chest', 'waist', 'hips', 'length'];
        setGuideStep(valid.includes(key as MeasurementKey) ? (key as MeasurementKey) : 'chest');
    };

    useEffect(() => {
        if (!id) return;
        fetch(`/api/products/${id}/reviews`)
            .then((r) => r.json())
            .then((d) => {
                setRating({ average: d.average_rating ?? null, count: (d.reviews ?? []).length });
            })
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        setLoading(true);
        setFetchError(false);
        fetch(`/api/products/${id}`)
            .then((r) => {
                if (r.status === 404) {
                    setLoading(false);
                    return null;
                }
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                if (!data) return;
                const p: ApiProduct = data.product;
                setProduct(p);
                setRelatedProducts(data.related ?? []);
                if (typeof data.shipping_cost === 'number') setShippingCost(data.shipping_cost);

                // Auto-assign the product's tailor for marketplace orders
                if (p.tailor_id) setSelectedTailorId(p.tailor_id);

                // ── Thaw: restore selections saved before login redirect ──
                const pending = getPendingOrder();
                if (pending?.type === 'marketplace' && pending.productId === p.id) {
                    setSelectedColor(pending.color || (p.colors?.[0] ?? ''));
                    setSelectedSize(pending.size || 'M');
                    setQuantity(pending.quantity || 1);
                    setMeasurements({
                        chest: pending.measurements?.chest ?? '',
                        waist: pending.measurements?.waist ?? '',
                        hips: pending.measurements?.hips ?? '',
                        length: pending.measurements?.length ?? '',
                    });
                    setCustomizationNote(pending.customizationNote ?? '');
                    // State restored — don't clear yet; clear only after order succeeds
                } else if (!pending || pending.type !== 'marketplace') {
                    // No saved state for this product — use defaults
                    if (p.colors?.length) setSelectedColor(p.colors[0]);
                }

                setLoading(false);
            })
            .catch(() => {
                // A 500, a timeout or a dropped connection is not "no such
                // product" — the 404 branch below says that, and only that.
                setFetchError(true);
                setLoading(false);
            });
    }, [id, retryKey]);

    if (loading) {
        return (
            <div className="kere-product flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--kd-muted)]" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="kere-product flex min-h-screen flex-col items-center justify-center px-4">
                <ErrorFallback
                    message={t('productCustomization.errorSomethingWrong')}
                    onRetry={() => setRetryKey((k) => k + 1)}
                />
                <Link
                    to="/marketplace"
                    className="mt-4 text-[14px] text-[var(--kd-body)] underline underline-offset-4 transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                >
                    {t('productCustomization.backToMarketplace')}
                </Link>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="kere-product flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
                <p className="kd-display text-[24px] text-[var(--kd-ink)]">{t('productCustomization.productNotFound')}</p>
                <Link
                    to="/marketplace"
                    className="text-[14px] text-[var(--kd-body)] underline underline-offset-4 transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                >
                    {t('productCustomization.backToMarketplace')}
                </Link>
            </div>
        );
    }

    const subtotal = product.price * quantity;
    const shipping = shippingCost;
    const total = subtotal + shipping;

    // Sizes are offered only on individual (customizable) orders.
    const showSizePicker = product.is_customizable && (product.sizes?.length ?? 0) > 0;

    const handleAddToCart = () => {
        if (!product) return;
        addToCart(
            {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] ?? null,
                size: showSizePicker ? selectedSize : null,
                color: selectedColor || null,
                tailorId: product.tailor_id,
                tailorName: product.tailor_name ?? null,
            },
            quantity
        );
        openCart();
    };

    const handleOrder = async () => {
        const token = getAuthToken();
        if (!token) {
            // Freeze current selections so they survive the login redirect
            if (product) {
                savePendingOrder({
                    type: 'marketplace',
                    productId: product.id,
                    color: selectedColor,
                    size: selectedSize,
                    quantity,
                    measurements,
                    customizationNote,
                } satisfies PendingMarketplaceOrder);
            }
            saveReturnTo(window.location.pathname);
            setShowLoginPrompt(true);
            return;
        }
        setPlacing(true);
        setOrderError('');
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    order_type: 'marketplace',
                    product_id: product!.id,
                    color: selectedColor,
                    size: showSizePicker ? selectedSize : null,
                    quantity,
                    cm_measurements: customize ? Object.fromEntries(Object.entries(measurements).filter(([, v]) => v !== '')) : {},
                    customization_note: customize ? customizationNote.trim() || null : null,
                    tailor_id: selectedTailorId,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                setOrderError(err.message ?? t('productCustomization.errorSomethingWrong'));
                return;
            }
            const data = await res.json();
            clearPendingOrder();
            setAssignedTailor(data.tailor_name ?? product!.tailor_name ?? t('productCustomization.yourTailorFallback'));
            setOrdered(true);
            redirectRef.current = setTimeout(() => navigate('/customer-dashboard'), 3000);
        } catch {
            setOrderError(t('productCustomization.errorConnection'));
        } finally {
            setPlacing(false);
        }
    };

    // Determine text color for color swatch check icon
    const isLight = (hex: string) => {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 180;
    };

    const measurementFields = [
        { key: 'chest', label: t('productCustomization.measureChest') },
        { key: 'waist', label: t('productCustomization.measureWaist') },
        { key: 'hips', label: t('productCustomization.measureHips') },
        { key: 'length', label: t('productCustomization.measureLength') },
    ];

    // The banner used to run its own flat 30–150 rule while each field ran the
    // per-garment ranges in measurementSanity, and the two disagreed in both
    // directions: a 160cm chest raised the banner with no field flagged, a 50cm
    // one flagged the field and said nothing. Both now read the same function.
    // Gated on `customize` too — the inputs only exist there, and a thawed
    // pending order used to raise the banner on a page with no fields on it.
    const showMeasurementBanner = customize && Object.entries(measurements).some(([key, value]) => measurementWarning(key, value) !== '');

    return (
        <div className="kere-product min-h-screen pt-[46px] sm:pt-[50px]">
            <Helmet>
                <title>
                    {product.name} — Custom {product.category?.name ?? 'Garment'} | Kere
                </title>
                <meta
                    name="description"
                    content={
                        product.description
                            ? product.description.slice(0, 160)
                            : `Order a custom ${product.name.toLowerCase()} handcrafted by a local Georgian tailor on Kere.`
                    }
                />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: product.name,
                        description: product.description ?? undefined,
                        image: product.images?.[0] ?? undefined,
                        offers: {
                            '@type': 'Offer',
                            price: product.price,
                            priceCurrency: 'GEL',
                            availability: 'https://schema.org/InStock',
                        },
                    })}
                </script>
            </Helmet>
            <Navigation />

            {ordered ? (
                <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 flex h-20 w-20 items-center justify-center border border-[var(--kd-burgundy)] bg-[var(--kd-tile)]"
                    >
                        <Check className="h-9 w-9 text-[var(--kd-burgundy)]" strokeWidth={1.6} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <h2 className="kd-display text-[clamp(28px,4vw,40px)] leading-tight text-[var(--kd-burgundy)]">
                            {t('productCustomization.orderSuccess')}
                        </h2>
                        <p className="mt-3 text-[15px] text-[var(--kd-body)]">{t('productCustomization.orderSuccessSent', { tailor: assignedTailor })}</p>
                        <p className="mt-4 text-[13px] text-[var(--kd-muted)]">{t('productCustomization.orderSuccessRedirect')}</p>
                    </motion.div>
                </div>
            ) : (
                <>
                    <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3vw,40px)] pt-[18px]">
                        <Link
                            to="/marketplace"
                            className="inline-flex items-center gap-2 text-[13px] text-[var(--kd-body)] transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                        >
                            ← {t('tailorProfile.backToMarketplace')}
                        </Link>
                    </div>

                    <div className="mx-auto grid w-full max-w-[1440px] items-start gap-[clamp(24px,4vw,56px)] px-[clamp(16px,3vw,40px)] pt-[18px] pb-[clamp(40px,6vw,72px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                        {/* Gallery */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="min-w-0 lg:sticky lg:top-[74px]"
                        >
                            <div className="relative aspect-[4/5] overflow-hidden border border-[var(--kd-rule)] bg-[var(--kd-stage)]">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="h-full w-full object-contain p-[clamp(16px,3vw,46px)]"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[var(--kd-muted)]/40">
                                        <ImageOff className="h-12 w-12 stroke-[1.4]" />
                                    </div>
                                )}
                                {product.is_customizable && (
                                    <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 border border-[rgba(111,29,36,0.18)] bg-[rgba(255,252,248,0.94)] px-2.5 py-1.5 text-[10px] tracking-[0.07em] text-[var(--kd-burgundy)] uppercase">
                                        <Palette className="h-[11px] w-[11px]" />
                                        {t('marketplace.customizableBadge')}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-x-[18px] gap-y-2.5 px-0.5 pt-3.5">
                                <span className="flex items-center gap-[7px] text-[13px] text-[var(--kd-body)]">
                                    <span className="text-[var(--kd-muted)]">{t('productCustomization.madeby')}</span>
                                    {product.tailor_id ? (
                                        <Link
                                            to={`/tailor/${product.tailor_id}`}
                                            className="border-b border-[rgba(111,29,36,0.3)] pb-px transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                                        >
                                            {product.tailor_name}
                                        </Link>
                                    ) : (
                                        <span>{product.tailor_name}</span>
                                    )}
                                </span>

                                {rating && (
                                    <span className="flex items-center gap-1.5 text-[13px] text-[var(--kd-body)]">
                                        {rating.average !== null ? (
                                            <>
                                                <Star className="h-3.5 w-3.5 fill-[var(--kd-burgundy)] text-[var(--kd-burgundy)]" />
                                                <span className="tabular-nums">
                                                    {rating.average.toFixed(1)} ({rating.count}{' '}
                                                    {rating.count === 1
                                                        ? t('productCustomization.reviewCount_one')
                                                        : t('productCustomization.reviewCount_other')}
                                                    )
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[var(--kd-muted)]">{t('productCustomization.noReviewsYet')}</span>
                                        )}
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        {/* Detail */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="min-w-0"
                        >
                            <div className="border-b border-[var(--kd-rule)] pb-[22px]">
                                <div className="text-[11px] tracking-[0.18em] text-[var(--kd-muted)] uppercase">
                                    {product.category ? t(`marketplace.categories.${product.category.slug}`, { defaultValue: product.category.name }) : ''}
                                </div>
                                <h1 className="kd-display mt-1.5 text-[clamp(34px,5vw,52px)] leading-[1.02] tracking-[-0.02em] text-[var(--kd-burgundy)] [text-wrap:pretty]">
                                    {product.name}
                                </h1>
                                <div className="kd-display mt-3 text-[28px] text-[var(--kd-ink)] tabular-nums">
                                    <Lari />
                                    {product.price}
                                </div>
                                {product.description && (
                                    <p className="mt-3.5 max-w-[44ch] text-[15px] leading-[1.55] text-[var(--kd-body)] [text-wrap:pretty]">
                                        {product.description}
                                    </p>
                                )}
                            </div>

                            {/* Colour */}
                            {product.colors?.length > 0 && (
                                <div className={BLOCK}>
                                    <div className="flex items-baseline justify-between gap-3.5 pb-3">
                                        <span className={EYEBROW}>{stripColon(t('productCustomization.colorLabel'))}</span>
                                        <span className="text-[13px] text-[var(--kd-body)] tabular-nums">{selectedColor}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {product.colors.map((hex) => {
                                            const selected = selectedColor === hex;
                                            return (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    onClick={() => setSelectedColor(hex)}
                                                    title={hex}
                                                    aria-label={`${stripColon(t('productCustomization.colorLabel'))} ${hex}`}
                                                    aria-pressed={selected}
                                                    className={`flex h-11 w-11 items-center justify-center border bg-[var(--kd-tile)] p-[3px] transition-colors duration-150 ${
                                                        selected
                                                            ? 'border-[var(--kd-ink)]'
                                                            : 'border-[var(--kd-rule)] hover:border-[var(--kd-burgundy)]'
                                                    }`}
                                                >
                                                    <span
                                                        className="flex h-full w-full items-center justify-center rounded-full border border-black/[0.14]"
                                                        style={{ backgroundColor: hex }}
                                                    >
                                                        {selected && (
                                                            <Check
                                                                className="h-3.5 w-3.5"
                                                                strokeWidth={3}
                                                                style={{ color: isLight(hex) ? '#1a1a1a' : '#ffffff' }}
                                                            />
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Size */}
                            {showSizePicker && (
                                <div className={BLOCK}>
                                    <div className="flex items-baseline justify-between gap-3.5 pb-3">
                                        <span className={EYEBROW}>{stripColon(t('productCustomization.sizeLabel'))}</span>
                                        <span className="text-[13px] text-[var(--kd-body)]">{selectedSize}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSelectedSize(s)}
                                                aria-pressed={selectedSize === s}
                                                className={`inline-flex h-12 min-w-14 items-center justify-center border px-3 text-[14px] transition-colors duration-150 ${
                                                    selectedSize === s
                                                        ? 'border-[var(--kd-ink)] bg-[var(--kd-ink)] text-[var(--kd-rail-text)]'
                                                        : 'border-[var(--kd-hairline)] bg-[var(--kd-tile)] text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)]'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Customize CTA — shown on the plain product view for customizable products */}
                            {!customize && product.is_customizable && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-[22px] h-[54px] w-full rounded-none border-[var(--kd-burgundy)] bg-[var(--kd-tile)] px-5 text-[14px] font-normal tracking-[0.02em] text-[var(--kd-burgundy)] hover:bg-[var(--kd-burgundy)] hover:text-[var(--kd-rail-text)]"
                                >
                                    <Link to={`/product/${product.id}/customize`}>
                                        <Palette className="h-[15px] w-[15px]" />
                                        {t('productCustomization.customizeThis')}
                                    </Link>
                                </Button>
                            )}

                            {/* Customization note — only when customizing */}
                            {customize && (
                                <div className={BLOCK}>
                                    <div className={`${EYEBROW} pb-1.5`}>{t('productCustomization.customizationDetails')}</div>
                                    <p className="pb-3 text-[13px] text-[var(--kd-muted)]">{t('productCustomization.customizationDetailsHint')}</p>
                                    <textarea
                                        value={customizationNote}
                                        onChange={(e) => setCustomizationNote(e.target.value.slice(0, 1000))}
                                        rows={4}
                                        maxLength={1000}
                                        placeholder={t('productCustomization.customizationPlaceholder')}
                                        className="w-full resize-none border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-3 py-2.5 text-[14px] text-[var(--kd-ink)] placeholder:text-[var(--kd-muted)] focus:border-[var(--kd-burgundy)] focus:ring-1 focus:ring-[var(--kd-burgundy)] focus:outline-none"
                                    />
                                    <p className="pt-1 text-right text-[11px] text-[var(--kd-muted)] tabular-nums">{customizationNote.length}/1000</p>
                                </div>
                            )}

                            {/* Measurements — only when customizing */}
                            {customize && (
                                <div className={BLOCK}>
                                    <div className={`${EYEBROW} pb-1.5`}>
                                        {t('productCustomization.customMeasurements')}{' '}
                                        <span className="normal-case">{t('productCustomization.measurementsOptional')}</span>
                                    </div>
                                    <p className="pb-4 text-[13px] text-[var(--kd-muted)]">{t('productCustomization.measurementsHint')}</p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {measurementFields.map(({ key, label }) => {
                                            const val = measurements[key as keyof typeof measurements];
                                            const warning = measurementWarning(key, val);
                                            return (
                                                <div key={key}>
                                                    <div className="flex items-center gap-1.5 pb-1.5">
                                                        <label htmlFor={`measure-${key}`} className="text-[11px] tracking-[0.14em] text-[var(--kd-muted)] uppercase">
                                                            {label}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => openGuide(key)}
                                                            className="text-[var(--kd-muted)] transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                                                            aria-label={t('productCustomization.helpFor', { label })}
                                                        >
                                                            <HelpCircle className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            id={`measure-${key}`}
                                                            type="number"
                                                            placeholder="0"
                                                            value={val}
                                                            onChange={(e) => setMeasurements((m) => ({ ...m, [key]: e.target.value }))}
                                                            className={`h-12 w-full border bg-[var(--kd-tile)] px-3 pr-9 text-[14px] text-[var(--kd-ink)] tabular-nums focus:border-[var(--kd-burgundy)] focus:ring-1 focus:ring-[var(--kd-burgundy)] focus:outline-none ${
                                                                warning ? 'border-[var(--kd-burgundy)]' : 'border-[var(--kd-hairline)]'
                                                            }`}
                                                        />
                                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[12px] text-[var(--kd-muted)]">cm</span>
                                                    </div>
                                                    {warning && <p className="pt-1 text-[11px] leading-tight text-[var(--kd-body)]">{t(warning)}</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className={BLOCK}>
                                <div className={`${EYEBROW} pb-3`}>{t('productCustomization.quantity')}</div>
                                <div className="flex w-max border border-[var(--kd-hairline)] bg-[var(--kd-tile)]">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        aria-label={t('cart.decrease')}
                                        className="flex h-12 w-12 items-center justify-center text-[var(--kd-ink)] transition-colors duration-150 hover:bg-[rgba(111,29,36,0.07)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={1000}
                                        value={quantity}
                                        aria-label={t('productCustomization.quantity')}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value, 10);
                                            // Ignore a mid-edit empty field; clamp anything else, so typing
                                            // 2000 lands on the ceiling instead of being silently dropped.
                                            if (Number.isNaN(v)) return;
                                            setQuantity(Math.min(1000, Math.max(1, v)));
                                        }}
                                        className="kd-display h-12 w-[54px] border-x border-[var(--kd-rule)] bg-transparent text-center text-[22px] text-[var(--kd-ink)] tabular-nums focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.min(q + 1, 1000))}
                                        disabled={quantity >= 1000}
                                        aria-label={t('cart.increase')}
                                        className="flex h-12 w-12 items-center justify-center text-[var(--kd-ink)] transition-colors duration-150 hover:bg-[rgba(111,29,36,0.07)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Tailor review notice */}
                            <div className="flex items-start gap-[11px] border-b border-[var(--kd-rule)] py-[18px]">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--kd-muted)]" />
                                <p className="max-w-[48ch] text-[14px] leading-[1.5] text-[var(--kd-body)] [text-wrap:pretty]">
                                    {t('productCustomization.tailorReviewNotice')}
                                </p>
                            </div>

                            {/* Measurement sanity banner */}
                            {showMeasurementBanner && (
                                <div className="flex items-start gap-[11px] border-b border-[var(--kd-rule)] py-[18px]">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--kd-burgundy)]" />
                                    <p className="max-w-[48ch] text-[14px] leading-[1.5] text-[var(--kd-body)] [text-wrap:pretty]">
                                        {t('productCustomization.measurementWarning')}
                                    </p>
                                </div>
                            )}

                            {/* Order summary */}
                            <div className="mt-[22px] border border-[var(--kd-hairline)] bg-[var(--kd-tile)] p-5">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-[14px] text-[var(--kd-body)]">
                                        <span>{t('productCustomization.subtotal')}</span>
                                        <span className="tabular-nums">₾{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] text-[var(--kd-body)]">
                                        <span>{t('productCustomization.delivery')}</span>
                                        <span className="tabular-nums">₾{shipping}</span>
                                    </div>
                                    <div className="mt-1 flex items-baseline justify-between border-t border-[var(--kd-rule)] pt-3">
                                        <span className="text-[15px] font-semibold text-[var(--kd-ink)]">{t('productCustomization.total')}</span>
                                        <span className="kd-display text-[26px] text-[var(--kd-burgundy)] tabular-nums">
                                            <Lari />
                                            {total}
                                        </span>
                                    </div>
                                </div>

                                {orderError && <p className="mt-3 text-center text-[12px] text-[var(--kd-burgundy)]">{orderError}</p>}

                                <div className="mt-[18px] flex flex-wrap gap-2.5">
                                    <Button
                                        onClick={handleOrder}
                                        disabled={placing}
                                        className="h-auto min-h-[52px] flex-[1_1_220px] rounded-none bg-[var(--kd-burgundy)] px-5 text-[15px] font-medium text-[var(--kd-rail-text)] hover:bg-[var(--kd-ink)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {placing && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {placing ? t('productCustomization.placingOrder') : t('productCustomization.placeOrder')}
                                    </Button>
                                    <Button
                                        onClick={handleAddToCart}
                                        variant="outline"
                                        className="h-auto min-h-[52px] rounded-none border-[rgba(111,29,36,0.28)] bg-transparent px-5 text-[14px] font-normal text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)] hover:bg-transparent hover:text-[var(--kd-ink)]"
                                    >
                                        <ShoppingBag className="h-[15px] w-[15px]" />
                                        {t('cart.addToCart')}
                                    </Button>
                                </div>

                                <p className="mt-3.5 text-[12px] text-[var(--kd-muted)]">{t('productCustomization.noPaymentNow')}</p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}

            {relatedProducts.length > 0 && (
                <section className="border-t border-[var(--kd-rule)] bg-[var(--kd-stage)]">
                    <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3vw,40px)] py-[clamp(32px,5vw,60px)]">
                        <div className="text-[11px] tracking-[0.18em] text-[var(--kd-muted)] uppercase">
                            {t('productCustomization.customersAlsoViewed')}
                        </div>
                        <div className="mt-5 grid gap-[clamp(14px,2vw,22px)] grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))]">
                            {relatedProducts.map((related) => (
                                <Link
                                    key={related.id}
                                    to={`/product/${related.id}`}
                                    className="flex flex-col border border-[var(--kd-rule)] bg-[var(--kd-tile)] transition-colors duration-150 hover:border-[var(--kd-burgundy)]"
                                >
                                    <div className="aspect-[4/5] bg-[var(--kd-stage)]">
                                        {related.images?.[0] ? (
                                            <img src={related.images[0]} alt={related.name} className="h-full w-full object-contain p-3.5" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[var(--kd-muted)]/40">
                                                <ImageOff className="h-9 w-9 stroke-[1.4]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-baseline justify-between gap-3 border-t border-[var(--kd-rule-soft)] px-4 py-3.5">
                                        <span className="kd-display text-[19px] leading-[1.15] text-[var(--kd-ink)] [text-wrap:pretty]">
                                            {related.name}
                                        </span>
                                        <span className="shrink-0 text-[14px] text-[var(--kd-burgundy)] tabular-nums">₾{related.price}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />

            {/* ── Login required prompt ── */}
            {showLoginPrompt && (
                <div className="kere-product fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
                    <div className="absolute inset-0 bg-[#2A1418]/55" onClick={() => setShowLoginPrompt(false)} />
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('productCustomization.signInToOrder')}
                        className="relative z-10 w-full max-w-sm border border-[var(--kd-hairline)] bg-[var(--kd-tile)] p-8 text-center"
                    >
                        <h3 className="kd-display text-[26px] leading-tight text-[var(--kd-burgundy)]">{t('productCustomization.signInToOrder')}</h3>
                        <p className="mt-2.5 text-[14px] leading-[1.5] text-[var(--kd-body)]">{t('productCustomization.signInHint')}</p>
                        <div className="mt-6 flex flex-col gap-2.5">
                            <Button
                                onClick={() => navigate('/login/customer')}
                                className="h-[52px] rounded-none bg-[var(--kd-burgundy)] text-[15px] font-medium text-[var(--kd-rail-text)] hover:bg-[var(--kd-ink)]"
                            >
                                {t('productCustomization.signIn')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/register')}
                                className="h-[52px] rounded-none border-[rgba(111,29,36,0.28)] bg-transparent text-[14px] font-normal text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)] hover:bg-transparent hover:text-[var(--kd-ink)]"
                            >
                                {t('productCustomization.createAccount')}
                            </Button>
                            <Button
                                variant="link"
                                onClick={() => setShowLoginPrompt(false)}
                                className="h-auto pt-1 text-[13px] font-normal text-[var(--kd-muted)] no-underline hover:text-[var(--kd-burgundy)]"
                            >
                                {t('productCustomization.cancel')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            <MeasurementGuideModal open={guideStep !== null} onClose={() => setGuideStep(null)} initialStep={guideStep ?? 'chest'} />
        </div>
    );
}
