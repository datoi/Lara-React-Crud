import { Check, HelpCircle, Info, Loader2, Minus, Palette, Pencil, Plus, ShoppingBag, Star, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { MeasurementGuideModal, type MeasurementKey } from '../components/MeasurementGuideModal';
import { Footer } from '../components/landing/Footer';
import { Navigation } from '../components/landing/Navigation';
import { Button } from '../components/ui/button';
import {
    clearPendingOrder,
    getAuthToken,
    getAuthUser,
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
    const [reviews, setReviews] = useState<{ id: number; rating: number; comment: string; reviewer: string; created_at: string }[]>([]);
    const [avgRating, setAvgRating] = useState<number | null>(null);

    const authUser = getAuthUser();

    const openGuide = (key: string) => {
        const valid: MeasurementKey[] = ['chest', 'waist', 'hips', 'length'];
        setGuideStep(valid.includes(key as MeasurementKey) ? (key as MeasurementKey) : 'chest');
    };
    useEffect(() => {
        if (!id) return;
        fetch(`/api/products/${id}/reviews`)
            .then((r) => r.json())
            .then((d) => {
                setReviews(d.reviews ?? []);
                setAvgRating(d.average_rating ?? null);
            })
            .catch(() => {});
    }, [id]);

    useEffect(() => {
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
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#E4E0D7]">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#E4E0D7]">
                <p className="text-slate-500">{t('productCustomization.productNotFound')}</p>
                <Link to="/marketplace" className="text-sm text-slate-900 underline">
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
            setTimeout(() => navigate('/customer-dashboard'), 3000);
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

    return (
        <div className="min-h-screen bg-[#E4E0D7] text-[#111111]">
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
            <div className="h-11" />

            {ordered ? (
                <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100"
                    >
                        <Check className="h-10 w-10 text-slate-600" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <h2 className="mb-2 text-2xl font-bold text-slate-900">{t('productCustomization.orderSuccess')}</h2>
                        <p className="text-slate-500">{t('productCustomization.orderSuccessSent', { tailor: assignedTailor })}</p>
                        <p className="mt-4 text-sm text-slate-400">{t('productCustomization.orderSuccessRedirect')}</p>
                    </motion.div>
                </div>
            ) : (
                <div className="w-full">
                    <div className="grid items-start lg:grid-cols-[55%_45%]">
                        {/* Product image */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <div className="aspect-[3/4] overflow-hidden bg-[#F2F1ED] lg:aspect-auto lg:h-[calc(100vh-3rem)]">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-6xl text-slate-300">👗</div>
                                )}
                            </div>
                            <div className="border-b border-[#111111]/15 bg-[#E4E0D7] px-4 py-3 sm:px-6">
                                <p className="mb-1 text-sm text-slate-500">
                                    by{' '}
                                    {product.tailor_id ? (
                                        <Link
                                            to={`/tailor/${product.tailor_id}`}
                                            className="font-medium text-slate-800 transition-colors hover:text-slate-600 hover:underline"
                                        >
                                            {product.tailor_name}
                                        </Link>
                                    ) : (
                                        <span className="font-medium text-slate-800">{product.tailor_name}</span>
                                    )}
                                </p>
                                <div className="flex items-center gap-1">
                                    {avgRating !== null ? (
                                        <>
                                            <Star className="h-4 w-4 fill-slate-400 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{avgRating.toFixed(1)}</span>
                                            <span className="text-sm text-slate-400">
                                                ({reviews.length}{' '}
                                                {reviews.length === 1
                                                    ? t('productCustomization.reviewCount_one')
                                                    : t('productCustomization.reviewCount_other')}
                                                )
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400">{t('productCustomization.noReviewsYet')}</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Customization panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-[#E4E0D7] px-5 py-8 sm:px-8 lg:min-h-[calc(100vh-3rem)] lg:px-12 lg:py-10"
                        >
                            <div className="border-b border-[#111111]/20 pb-6">
                                <div className="mb-2 text-[10px] font-medium tracking-[0.08em] text-[#6c625b] uppercase">
                                    {product.category?.name}
                                </div>
                                <h1 className="text-lg leading-tight font-medium text-[#111111] uppercase">{product.name}</h1>
                                <p className="mt-2 text-sm font-medium text-[#111111]">₾{product.price}</p>
                                <p className="mt-5 max-w-xl text-xs leading-5 text-[#514843]">{product.description}</p>
                            </div>

                            {/* Color */}
                            {product.colors?.length > 0 && (
                                <div className="border-b border-[#111111]/20 py-6">
                                    <div className="mb-3 text-sm font-semibold text-slate-700">
                                        {t('productCustomization.colorLabel')} <span className="font-normal text-slate-500">{selectedColor}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colors.map((hex) => (
                                            <button
                                                key={hex}
                                                onClick={() => setSelectedColor(hex)}
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' || e.key === 'Enter') {
                                                        e.preventDefault();
                                                        setSelectedColor(hex);
                                                    }
                                                }}
                                                tabIndex={0}
                                                title={hex}
                                                className="relative h-7 w-7 rounded-full border transition-all hover:scale-105"
                                                style={{
                                                    backgroundColor: hex,
                                                    borderColor: selectedColor === hex ? '#0F172A' : '#E2E8F0',
                                                    boxShadow: selectedColor === hex ? '0 0 0 2px white, 0 0 0 4px #0F172A' : undefined,
                                                }}
                                            >
                                                {selectedColor === hex && (
                                                    <Check
                                                        className="absolute inset-0 m-auto h-4 w-4"
                                                        style={{ color: isLight(hex) ? '#1a1a1a' : 'white' }}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size */}
                            {showSizePicker && (
                                <div className="border-b border-[#111111]/20 py-6">
                                    <div className="mb-3 text-sm font-semibold text-slate-700">
                                        {t('productCustomization.sizeLabel')} <span className="font-normal text-slate-500">{selectedSize}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map((s) => (
                                            <Button
                                                key={s}
                                                type="button"
                                                variant={selectedSize === s ? 'default' : 'outline'}
                                                onClick={() => setSelectedSize(s)}
                                                className={`h-auto rounded-none px-4 py-2 ${
                                                    selectedSize === s
                                                        ? 'border border-slate-900 bg-slate-900 text-white hover:bg-slate-900'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-transparent hover:text-slate-600'
                                                }`}
                                            >
                                                {s}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Customization details — only when customizing */}
                            {customize && (
                                <div className="border-b border-[#111111]/20 py-6">
                                    <div className="mb-1 text-sm font-semibold text-slate-700">{t('productCustomization.customizationDetails')}</div>
                                    <p className="mb-3 text-xs text-slate-500">{t('productCustomization.customizationDetailsHint')}</p>
                                    <textarea
                                        value={customizationNote}
                                        onChange={(e) => setCustomizationNote(e.target.value.slice(0, 1000))}
                                        rows={4}
                                        maxLength={1000}
                                        placeholder={t('productCustomization.customizationPlaceholder')}
                                        className="w-full resize-none border border-[#111111]/25 px-3 py-2 text-sm text-[#111111] placeholder:text-[#6c625b]/60 focus:ring-1 focus:ring-[#111111] focus:outline-none"
                                    />
                                    <p className="mt-1 text-right text-[10px] text-slate-400">{customizationNote.length}/1000</p>
                                </div>
                            )}

                            {/* Measurements — only when customizing */}
                            {customize && (
                                <div className="border-b border-[#111111]/20 py-6">
                                    <div className="mb-1 text-sm font-semibold text-slate-700">
                                        {t('productCustomization.customMeasurements')}{' '}
                                        <span className="font-normal text-slate-400">{t('productCustomization.measurementsOptional')}</span>
                                    </div>
                                    <p className="mb-4 text-xs text-slate-500">{t('productCustomization.measurementsHint')}</p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {[
                                            { key: 'chest', label: t('productCustomization.measureChest') },
                                            { key: 'waist', label: t('productCustomization.measureWaist') },
                                            { key: 'hips', label: t('productCustomization.measureHips') },
                                            { key: 'length', label: t('productCustomization.measureLength') },
                                        ].map(({ key, label }) => {
                                            const val = measurements[key as keyof typeof measurements];
                                            const warning = measurementWarning(key, val);
                                            return (
                                                <div key={key}>
                                                    <div className="mb-1 flex items-center gap-1">
                                                        <label className="text-xs text-slate-500">{label}</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => openGuide(key)}
                                                            className="text-slate-300 transition-colors hover:text-slate-600"
                                                            aria-label={t('productCustomization.helpFor', { label })}
                                                        >
                                                            <HelpCircle className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={val}
                                                            onChange={(e) => setMeasurements((m) => ({ ...m, [key]: e.target.value }))}
                                                            className={`w-full border px-3 py-2 pr-8 text-sm focus:ring-1 focus:ring-[#111111] focus:outline-none ${warning ? 'border-[#111111]/50' : 'border-[#111111]/20'}`}
                                                        />
                                                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">cm</span>
                                                    </div>
                                                    {warning && <p className="mt-1 text-[10px] leading-tight text-slate-500">{warning}</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Customize CTA — shown on the plain product view for customizable products */}
                            {!customize && product.is_customizable && (
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/product/${product.id}/customize`)}
                                    className="my-6 h-auto w-full rounded-none border-[#111111] py-3 text-xs font-semibold tracking-[0.08em] text-[#111111] uppercase hover:bg-[#111111] hover:text-white active:scale-[0.99]"
                                >
                                    <Palette className="h-4 w-4" />
                                    {t('productCustomization.customizeThis')}
                                </Button>
                            )}

                            {/* Quantity */}
                            <div className="border-b border-[#111111]/20 py-6">
                                <div className="mb-3 text-sm font-semibold text-slate-700">{t('productCustomization.quantity')}</div>
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={quantity === 1}
                                        className="h-9 w-9 rounded-none border-[#111111]/25 text-[#514843] hover:bg-[#111111] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={1000}
                                        value={quantity}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value, 10);
                                            if (!isNaN(v) && v >= 1 && v <= 1000) setQuantity(v);
                                        }}
                                        className="w-14 border border-[#111111]/25 py-1 text-center text-sm font-medium text-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setQuantity((q) => Math.min(q + 1, 1000))}
                                        disabled={quantity >= 1000}
                                        className="h-9 w-9 rounded-none border-[#111111]/25 text-[#514843] hover:bg-[#111111] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Tailor review notice */}
                            <div className="flex items-start gap-2.5 border-b border-[#111111]/20 py-5">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <p className="text-sm leading-relaxed text-slate-600">{t('productCustomization.tailorReviewNotice')}</p>
                            </div>

                            {/* Tailor — fixed to the product's tailor */}
                            {product.tailor_name && (
                                <div className="flex items-center gap-3 border-b border-[#111111]/20 py-5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                                        <User className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">{t('productCustomization.madeby')}</p>
                                        {product.tailor_id ? (
                                            <Link
                                                to={`/tailor/${product.tailor_id}`}
                                                className="text-sm font-semibold text-slate-900 hover:underline"
                                            >
                                                {product.tailor_name}
                                            </Link>
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-900">{product.tailor_name}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Measurement sanity banner */}
                            {Object.values(measurements).some((v) => {
                                const n = parseFloat(v);
                                return v !== '' && !isNaN(n) && (n > 150 || n < 30);
                            }) && (
                                <div className="flex items-start gap-2.5 border-b border-[#111111]/20 py-5">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                    <p className="text-sm leading-relaxed text-slate-700">{t('productCustomization.measurementWarning')}</p>
                                </div>
                            )}

                            {/* Order summary */}
                            <div className="mt-6 border border-[#111111] bg-[#E4E0D7] p-5 text-[#111111]">
                                <div className="mb-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-[#6c625b]">
                                        <span>{t('productCustomization.subtotal')}</span>
                                        <span>₾{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-[#6c625b]">
                                        <span>{t('productCustomization.delivery')}</span>
                                        <span>₾{shipping}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-[#111111]/20 pt-2 text-base font-semibold text-[#111111]">
                                        <span>{t('productCustomization.total')}</span>
                                        <span>₾{total}</span>
                                    </div>
                                </div>
                                {orderError && <p className="text-destructive mb-2 text-center text-xs">{orderError}</p>}
                                <Button
                                    onClick={handleAddToCart}
                                    variant="outline"
                                    className="mb-2 h-auto w-full rounded-none border-[#111111] py-3 text-xs font-semibold tracking-[0.08em] text-[#111111] uppercase hover:bg-[#111111] hover:text-white active:scale-[0.99]"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    {t('cart.addToCart')}
                                </Button>
                                <Button
                                    onClick={handleOrder}
                                    disabled={placing}
                                    className="h-auto w-full rounded-none bg-[#111111] py-3 text-xs font-semibold tracking-[0.08em] text-white uppercase hover:bg-[#333333] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {placing && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {placing ? t('productCustomization.placingOrder') : t('productCustomization.placeOrder')}
                                </Button>
                                <p className="mt-3 text-center text-xs text-[#6c625b]">{t('productCustomization.noPaymentNow')}</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {relatedProducts.length > 0 && (
                <section className="border-t border-[#111111]/15 bg-[#F4F1E7] py-12 sm:py-16">
                    <h2 className="mb-9 text-center text-lg font-semibold tracking-[0.04em] text-[#111111] uppercase sm:text-xl">
                        {t('productCustomization.customersAlsoViewed')}
                    </h2>
                    <div className="flex snap-x overflow-x-auto">
                        {relatedProducts.map((related) => (
                            <Link
                                key={related.id}
                                to={`/product/${related.id}`}
                                className="group w-[78vw] max-w-[460px] min-w-[260px] shrink-0 snap-start border-r border-[#111111]/15 sm:w-[46vw] lg:w-[32vw]"
                            >
                                <div className="aspect-[3/4] overflow-hidden bg-[#E4E0D7]">
                                    {related.images?.[0] ? (
                                        <img
                                            src={related.images[0]}
                                            alt={related.name}
                                            className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[#111111]/20">Kere</div>
                                    )}
                                </div>
                                <div className="min-h-28 bg-[#F4F1E7] px-5 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-sm font-semibold text-[#111111] uppercase">{related.name}</h3>
                                        <span className="shrink-0 text-sm font-semibold text-[#111111]">₾{related.price}</span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6c625b]">{related.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Reviews ── */}
            <section className="border-t border-[#111111]/15 bg-[#F4F1E7] px-5 py-16 sm:px-8 sm:py-20">
                <div className="mx-auto max-w-[1100px]">
                    {reviews.length > 0 ? (
                        <div>
                        <div className="mb-5 flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-[#111111] uppercase">{t('productCustomization.customerReviews')}</h2>
                            {avgRating !== null && (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <Star
                                                key={n}
                                                className="h-4 w-4"
                                                fill={avgRating >= n ? '#fbbf24' : 'none'}
                                                stroke={avgRating >= n ? '#fbbf24' : '#cbd5e1'}
                                                strokeWidth={1.5}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">{avgRating}</span>
                                    <span className="text-xs text-slate-400">({reviews.length})</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 grid gap-6 sm:grid-cols-2">
                            {reviews.map((r, i) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    className="border-t border-[#111111]/20 py-5"
                                >
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <Star
                                                    key={n}
                                                    className="h-3.5 w-3.5"
                                                    fill={r.rating >= n ? '#fbbf24' : 'none'}
                                                    stroke={r.rating >= n ? '#fbbf24' : '#cbd5e1'}
                                                    strokeWidth={1.5}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">{r.reviewer}</span>
                                        <span className="text-xs text-slate-400">{t('productCustomization.verifiedPurchase')}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-600">{r.comment}</p>
                                </motion.div>
                            ))}
                        </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-lg text-[#111111]">{t('productCustomization.noReviewsWriteOne')}</p>
                            <Link
                                to={authUser ? '/customer-dashboard' : '/signin'}
                                className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 border border-[#111111] px-8 py-3 text-sm font-semibold text-[#111111] uppercase transition-colors hover:bg-[#111111] hover:text-white"
                            >
                                <Pencil className="h-4 w-4" />
                                {t('productCustomization.writeReview')}
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <Footer />

            {/* ── Login required prompt ── */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowLoginPrompt(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl"
                    >
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">🔒</div>
                        <h3 className="mb-2 text-lg font-bold text-slate-900">{t('productCustomization.signInToOrder')}</h3>
                        <p className="mb-6 text-sm leading-relaxed text-slate-500">{t('productCustomization.signInHint')}</p>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => navigate('/login/customer')}
                                className="h-auto w-full rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-700"
                            >
                                {t('productCustomization.signIn')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/register')}
                                className="h-auto w-full rounded-xl border-slate-200 py-3 font-medium text-slate-700 hover:bg-slate-50"
                            >
                                {t('productCustomization.createAccount')}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowLoginPrompt(false)}
                                className="h-auto pt-1 text-sm text-slate-400 hover:bg-transparent hover:text-slate-600"
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
