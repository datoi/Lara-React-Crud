import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Minus, Plus, Check, Loader2 } from 'lucide-react';

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
}

const TAILORS = ['Nino Beridze', 'Giorgi Maisuradze', 'Tamar Kvanchilashvili', 'Levan Gogishvili', 'Ana Jishkariani'];
const RATINGS = [4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
function getTailor(id: number) { return TAILORS[id % TAILORS.length]; }
function getRating(id: number) { return RATINGS[id % RATINGS.length]; }
function getReviews(id: number) { return 10 + (id * 7) % 50; }

export default function ProductCustomization() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<ApiProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('M');
    const [measurements, setMeasurements] = useState({ chest: '', waist: '', hips: '', length: '' });
    const [quantity, setQuantity] = useState(1);
    const [ordered, setOrdered] = useState(false);

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then(r => r.json())
            .then(data => {
                const p: ApiProduct = data.product;
                setProduct(p);
                if (p.colors?.length) setSelectedColor(p.colors[0]);
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
    const shipping = 15;
    const total = subtotal + shipping;
    const tailor = getTailor(product.id);

    const handleOrder = () => {
        setOrdered(true);
        setTimeout(() => navigate('/'), 2500);
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
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <Link
                        to="/marketplace"
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Marketplace
                    </Link>
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
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Placed!</h2>
                        <p className="text-slate-500">Your order has been sent to {tailor}. You'll hear back within 24 hours.</p>
                        <p className="text-sm text-slate-400 mt-4">Redirecting you home…</p>
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
                                <p className="text-sm text-slate-500 mb-1">by {tailor}</p>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-medium text-slate-700">{getRating(product.id)}</span>
                                    <span className="text-sm text-slate-400">({getReviews(product.id)} reviews)</span>
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
                                <div className="text-sm font-semibold text-slate-700 mb-1">Custom Measurements (cm)</div>
                                <p className="text-xs text-slate-400 mb-4">Optional — for a perfect fit, enter your measurements.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'chest', label: 'Chest' },
                                        { key: 'waist', label: 'Waist' },
                                        { key: 'hips', label: 'Hips' },
                                        { key: 'length', label: 'Length' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={measurements[key as keyof typeof measurements]}
                                                    onChange={e => setMeasurements(m => ({ ...m, [key]: e.target.value }))}
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">cm</span>
                                            </div>
                                        </div>
                                    ))}
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
                                    <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Plus className="w-4 h-4 text-slate-600" />
                                    </button>
                                </div>
                            </div>

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
                                <button
                                    onClick={handleOrder}
                                    className="w-full bg-white text-slate-900 font-semibold py-3.5 rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.98]"
                                >
                                    Place Order
                                </button>
                                <p className="text-xs text-slate-500 text-center mt-3">
                                    Tailor will confirm within 24 hours
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
}
