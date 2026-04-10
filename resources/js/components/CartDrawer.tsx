import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';

export function CartDrawer() {
    const { items, isOpen, closeCart, removeItem, updateQty, total, count } = useCart();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={closeCart}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-slate-700" />
                                <span className="font-semibold text-slate-900">Your Cart</span>
                                {count > 0 && (
                                    <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {count}
                                    </span>
                                )}
                            </div>
                            <button onClick={closeCart} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-3">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                    <ShoppingBag className="w-12 h-12 text-slate-200 mb-4" />
                                    <p className="text-slate-400 text-sm">Your cart is empty</p>
                                    <Link
                                        to="/marketplace"
                                        onClick={closeCart}
                                        className="mt-4 text-sm text-slate-600 underline hover:text-slate-900"
                                    >
                                        Browse designs
                                    </Link>
                                </div>
                            ) : (
                                items.map(item => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex gap-3 bg-slate-50 rounded-xl p-3"
                                    >
                                        {/* Image / placeholder */}
                                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                                    {item.type === 'custom' ? '✂️' : '👗'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm leading-tight truncate">{item.productName}</p>
                                            {item.type === 'marketplace' && (
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {[item.color, item.size].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                            {item.type === 'custom' && (
                                                <p className="text-xs text-slate-400 mt-0.5">Custom Design — quoted by tailor</p>
                                            )}

                                            <div className="flex items-center justify-between mt-2">
                                                {item.type === 'marketplace' ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => updateQty(item.id, item.quantity - 1)}
                                                            className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                                        >
                                                            <Minus className="w-3 h-3 text-slate-600" />
                                                        </button>
                                                        <span className="text-sm font-medium text-slate-900 w-5 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQty(item.id, item.quantity + 1)}
                                                            className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3 text-slate-600" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">×1</span>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {item.price > 0 ? `₾${(item.price * item.quantity).toFixed(0)}` : 'TBD'}
                                                    </span>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Subtotal</span>
                                    <span className="font-bold text-slate-900 text-lg">
                                        {total > 0 ? `₾${total.toFixed(0)}` : 'TBD by tailor'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">Shipping calculated at checkout (₾15 flat rate)</p>
                                <Link
                                    to="/cart"
                                    onClick={closeCart}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-700 transition-colors active:scale-[0.98]"
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
