import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getAuthToken, saveReturnTo } from '../hooks/useAuth';
import { NotificationBell } from '../components/NotificationBell';

export default function CartPage() {
    const navigate = useNavigate();
    const token = getAuthToken();
    const { items, removeItem, updateQty, total, count, clear } = useCart();

    const [placing, setPlacing]   = useState(false);
    const [success, setSuccess]   = useState(false);
    const [error, setError]       = useState('');

    const handleCheckout = async () => {
        if (!token) {
            saveReturnTo('/cart');
            navigate('/signin');
            return;
        }

        setPlacing(true);
        setError('');

        try {
            for (const item of items) {
                const body = item.type === 'custom'
                    ? { order_type: 'custom', custom_design_data: item.customDesign }
                    : {
                        order_type:      'marketplace',
                        product_id:      item.productId,
                        color:           item.color,
                        size:            item.size,
                        quantity:        item.quantity,
                        cm_measurements: item.measurements,
                    };

                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message ?? 'Failed to place order');
                }
            }

            clear();
            setSuccess(true);
            setTimeout(() => navigate('/customer-dashboard'), 2500);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Something went wrong.');
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-white border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                    </div>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <h1 className="text-2xl font-bold text-slate-900 mb-6">Your Cart</h1>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <Check className="w-10 h-10 text-green-600" />
                            </motion.div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Orders Placed!</h2>
                            <p className="text-slate-500">Your tailors have been notified. Redirecting to your dashboard…</p>
                        </motion.div>
                    ) : count === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 mb-4">Your cart is empty</p>
                            <Link
                                to="/marketplace"
                                className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                Browse Designs
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="space-y-3 mb-6">
                                <AnimatePresence>
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            exit={{ opacity: 0, x: -20 }}
                                            className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4"
                                        >
                                            <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl">
                                                        {item.type === 'custom' ? '✂️' : '👗'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900">{item.productName}</p>
                                                {item.type === 'marketplace' && (
                                                    <p className="text-sm text-slate-400 mt-0.5">
                                                        {[item.color, item.size].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                                {item.type === 'custom' && (
                                                    <p className="text-sm text-slate-400 mt-0.5">Custom Design — tailor will quote</p>
                                                )}

                                                <div className="flex items-center justify-between mt-3">
                                                    {item.type === 'marketplace' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateQty(item.id, item.quantity - 1)}
                                                                className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                                            >
                                                                <Minus className="w-3.5 h-3.5 text-slate-600" />
                                                            </button>
                                                            <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQty(item.id, item.quantity + 1)}
                                                                className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 text-slate-600" />
                                                            </button>
                                                        </div>
                                                    ) : <span />}

                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-slate-900">
                                                            {item.price > 0 ? `₾${(item.price * item.quantity).toFixed(0)}` : 'TBD'}
                                                        </span>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Summary */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal ({count} item{count !== 1 ? 's' : ''})</span>
                                    <span className="font-medium text-slate-900">{total > 0 ? `₾${total.toFixed(0)}` : 'TBD'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Shipping</span>
                                    <span className="font-medium text-slate-900">₾15</span>
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex justify-between">
                                    <span className="font-semibold text-slate-900">Total</span>
                                    <span className="font-bold text-slate-900 text-lg">
                                        {total > 0 ? `₾${(total + 15).toFixed(0)}` : 'TBD by tailor'}
                                    </span>
                                </div>

                                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                                <button
                                    onClick={handleCheckout}
                                    disabled={placing}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-4 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                >
                                    {placing
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Orders…</>
                                        : 'Place Order'
                                    }
                                </button>
                                <p className="text-xs text-slate-400 text-center">
                                    Your tailor will be notified immediately after checkout
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
