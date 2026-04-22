import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Minus, Plus, Check, Loader2, HelpCircle, User, Info } from 'lucide-react';
import { MeasurementGuideModal, type MeasurementKey } from '../components/MeasurementGuideModal';
import { measurementWarning } from '../utils/measurementSanity';
import { TailorSelector } from '../components/TailorSelector';
import {
    getAuthToken,
    getAuthUser,
    saveReturnTo,
    savePendingOrder,
    getPendingOrder,
    clearPendingOrder,
    type PendingMarketplaceOrder,
} from '../hooks/useAuth';

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

export default function ProductCustomization() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<ApiProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('M');
    const [measurements, setMeasurements] = useState({ chest: '', waist: '', hips: '', length: '' });
    const [quantity, setQuantity] = useState(1);
    const [shippingCost, setShippingCost]         = useState(15);
    const [assignedTailor, setAssignedTailor]     = useState('');
    const [selectedTailorId, setSelectedTailorId] = useState<number | null>(null);
    const [ordered, setOrdered]       = useState(false);
    const [placing, setPlacing]       = useState(false);
    const [orderError, setOrderError] = useState('');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [guideStep, setGuideStep] = useState<MeasurementKey | null>(null);
    const [reviews, setReviews]     = useState<{ id: number; rating: number; comment: string; reviewer: string; created_at: string }[]>([]);
    const [avgRating, setAvgRating] = useState<number | null>(null);

    const authUser = getAuthUser();

    const openGuide = (key: string) => {
        const valid: MeasurementKey[] = ['chest', 'waist', 'hips', 'length'];
        setGuideStep(valid.includes(key as MeasurementKey) ? (key as MeasurementKey) : 'chest');
    };
    useEffect(() => {
        if (!id) return;
        fetch(`/api/products/${id}/reviews`)
            .then(r => r.json())
            .then(d => {
                setReviews(d.reviews ?? []);
                setAvgRating(d.average_rating ?? null);
            })
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then(r => r.json())
            .then(data => {
                const p: ApiProduct = data.product;
                setProduct(p);
                if (typeof data.shipping_cost === 'number') setShippingCost(data.shipping_cost);

                // ── Thaw: restore selections saved before login redirect ──
                const pending = getPendingOrder();
                if (pending?.type === 'marketplace' && pending.productId === p.id) {
                    setSelectedColor(pending.color  || (p.colors?.[0] ?? ''));
                    setSelectedSize(pending.size    || 'M');
                    setQuantity(pending.quantity    || 1);
                    setMeasurements({
                        chest:  pending.measurements?.chest  ?? '',
                        waist:  pending.measurements?.waist  ?? '',
                        hips:   pending.measurements?.hips   ?? '',
                        length: pending.measurements?.length ?? '',
                    });
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500">Product not found.</p>
                <Link to="/marketplace" className="text-slate-900 underline text-sm">Back to Marketplace</Link>
            </div>
        );
    }

    const subtotal = product.price * quantity;
    const shipping = shippingCost;
    const total = subtotal + shipping;

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
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    order_type: 'marketplace',
                    product_id: product!.id,
                    color: selectedColor,
                    size: selectedSize,
                    quantity,
                    cm_measurements: Object.fromEntries(
                        Object.entries(measurements).filter(([, v]) => v !== '')
                    ),
                    tailor_id: selectedTailorId,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                setOrderError(err.message ?? 'Something went wrong.');
                return;
            }
            const data = await res.json();
            clearPendingOrder();
            setAssignedTailor(data.tailor_name ?? product!.tailor_name ?? 'Your tailor');
            setOrdered(true);
            setTimeout(() => navigate('/customer-dashboard'), 3000);
        } catch {
            setOrderError('Network error. Please try again.');
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
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>{product.name} — Custom {product.category?.name ?? 'Garment'} | Kere</title>
                <meta name="description" content={product.description ? product.description.slice(0, 160) : `Order a custom ${product.name.toLowerCase()} handcrafted by a local Georgian tailor on Kere.`} />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": product.name,
                    "description": product.description ?? undefined,
                    "image": product.images?.[0] ?? undefined,
                    "offers": {
                        "@type": "Offer",
                        "price": product.price,
                        "priceCurrency": "GEL",
                        "availability": "https://schema.org/InStock"
                    }
                })}</script>
            </Helmet>
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <div className="flex items-center gap-4">
                        {authUser && (
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                                <span className="font-medium hidden sm:inline">{authUser.first_name} {authUser.last_name}</span>
                            </div>
                        )}
                        <Link
                            to="/marketplace"
                            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Marketplace
                        </Link>
                    </div>
                </div>
            </nav>

            {ordered ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
                    >
                        <Check className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Order submitted successfully!</h2>
                        <p className="text-slate-500">Sent to {assignedTailor}. Your tailor will review it and contact you within 24 hours.</p>
                        <p className="text-sm text-slate-400 mt-4">Taking you to your dashboard…</p>
                    </motion.div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid lg:grid-cols-2 gap-10">
                        {/* Product image */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-slate-100">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl">👗</div>
                                )}
                            </div>
                            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-500 mb-1">
                                    by{' '}
                                    {product.tailor_id ? (
                                        <Link
                                            to={`/tailor/${product.tailor_id}`}
                                            className="font-medium text-slate-800 hover:text-slate-600 hover:underline transition-colors"
                                        >
                                            {tailor}
                                        </Link>
                                    ) : (
                                        <span className="font-medium text-slate-800">{tailor}</span>
                                    )}
                                </p>
                                <div className="flex items-center gap-1">
                                    {avgRating !== null ? (
                                        <>
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            <span className="text-sm font-medium text-slate-700">{avgRating.toFixed(1)}</span>
                                            <span className="text-sm text-slate-400">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400">No reviews yet</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Customization panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="space-y-6"
                        >
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{product.category?.name}</div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
                                <p className="text-slate-500 leading-relaxed">{product.description}</p>
                            </div>

                            {/* Color */}
                            {product.colors?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                    <div className="text-sm font-semibold text-slate-700 mb-3">
                                        Color: <span className="font-normal text-slate-500">{selectedColor}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colors.map(hex => (
                                            <button
                                                key={hex}
                                                onClick={() => setSelectedColor(hex)}
                                                title={hex}
                                                className="relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110"
                                                style={{
                                                    backgroundColor: hex,
                                                    borderColor: selectedColor === hex ? '#0F172A' : '#E2E8F0',
                                                    boxShadow: selectedColor === hex ? '0 0 0 2px white, 0 0 0 4px #0F172A' : undefined,
                                                }}
                                            >
                                                {selectedColor === hex && (
                                                    <Check
                                                        className="absolute inset-0 m-auto w-4 h-4"
                                                        style={{ color: isLight(hex) ? '#1a1a1a' : 'white' }}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size */}
                            {product.sizes?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                    <div className="text-sm font-semibold text-slate-700 mb-3">
                                        Size: <span className="font-normal text-slate-500">{selectedSize}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setSelectedSize(s)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                                    selectedSize === s
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Measurements */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <div className="text-sm font-semibold text-slate-700 mb-1">Custom Measurements <span className="font-normal text-slate-400">(optional)</span></div>
                                <p className="text-xs text-slate-500 mb-4">Skip this for now and use standard sizing — or enter your measurements for a perfect fit. Your tailor can also take measurements when they contact you.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { key: 'chest', label: 'Chest' },
                                        { key: 'waist', label: 'Waist' },
                                        { key: 'hips', label: 'Hips' },
                                        { key: 'length', label: 'Length' },
                                    ].map(({ key, label }) => {
                                        const val = measurements[key as keyof typeof measurements];
                                        const warning = measurementWarning(key, val);
                                        return (
                                            <div key={key}>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <label className="text-xs text-slate-500">{label}</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => openGuide(key)}
                                                        className="text-slate-300 hover:text-slate-600 transition-colors"
                                                        aria-label={`Help for ${label}`}
                                                    >
                                                        <HelpCircle className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={val}
                                                        onChange={e => setMeasurements(m => ({ ...m, [key]: e.target.value }))}
                                                        className={`w-full border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900 ${warning ? 'border-amber-400' : 'border-slate-200'}`}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                                                </div>
                                                {warning && (
                                                    <p className="text-[10px] text-amber-600 mt-1 leading-tight">{warning}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <div className="text-sm font-semibold text-slate-700 mb-3">Quantity</div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Minus className="w-4 h-4 text-slate-600" />
                                    </button>
                                    <span className="text-lg font-bold text-slate-900 w-8 text-center">{quantity}</span>
                                    <button onClick={() => setQuantity(q => Math.min(q + 1, 1000))} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Plus className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Tailor review notice */}
                            <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Your tailor will review your order and may contact you before production begins.
                                </p>
                            </div>

                            {/* Tailor selector */}
                            <TailorSelector
                                selectedTailorId={selectedTailorId}
                                onChange={setSelectedTailorId}
                                category={product.category?.slug}
                            />

                            {/* Order summary */}
                            <div className="bg-slate-900 rounded-2xl p-5 text-white">
                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal</span>
                                        <span>₾{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Delivery</span>
                                        <span>₾{shipping}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-slate-700">
                                        <span>Total</span>
                                        <span>₾{total}</span>
                                    </div>
                                </div>
                                {orderError && (
                                    <p className="text-xs text-red-400 text-center mb-2">{orderError}</p>
                                )}
                                <button
                                    onClick={handleOrder}
                                    disabled={placing}
                                    className="w-full bg-white text-slate-900 font-semibold py-3.5 rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {placing ? 'Placing Order…' : 'Place Order'}
                                </button>
                                <p className="text-xs text-slate-400 text-center mt-3">
                                    No payment required now — you'll confirm details with the tailor first
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* ── Reviews ── */}
            {(reviews.length > 0 || avgRating !== null) && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <h3 className="font-bold text-slate-900 text-lg">Customer Reviews</h3>
                            {avgRating !== null && (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex">
                                        {[1,2,3,4,5].map(n => (
                                            <Star key={n} className="w-4 h-4" fill={avgRating >= n ? '#fbbf24' : 'none'} stroke={avgRating >= n ? '#fbbf24' : '#cbd5e1'} strokeWidth={1.5} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">{avgRating}</span>
                                    <span className="text-xs text-slate-400">({reviews.length})</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            {reviews.map((r, i) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    className="border-b border-slate-50 last:border-0 pb-4 last:pb-0"
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="flex">
                                            {[1,2,3,4,5].map(n => (
                                                <Star key={n} className="w-3.5 h-3.5" fill={r.rating >= n ? '#fbbf24' : 'none'} stroke={r.rating >= n ? '#fbbf24' : '#cbd5e1'} strokeWidth={1.5} />
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">{r.reviewer}</span>
                                        <span className="text-xs text-slate-400">· Verified Purchase</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Login required prompt ── */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setShowLoginPrompt(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-8 text-center"
                    >
                        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
                            🔒
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Sign in to place an order</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            You need to be signed in to complete your purchase. It only takes a minute.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/signin')}
                                className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full border border-slate-200 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Create an Account
                            </button>
                            <button
                                onClick={() => setShowLoginPrompt(false)}
                                className="text-sm text-slate-400 hover:text-slate-600 transition-colors pt-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <MeasurementGuideModal
                open={guideStep !== null}
                onClose={() => setGuideStep(null)}
                initialStep={guideStep ?? 'chest'}
            />
        </div>
    );
}
