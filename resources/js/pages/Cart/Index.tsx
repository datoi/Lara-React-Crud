import { Head, Link, router } from '@inertiajs/react';
import { Shirt, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Product {
    id: number; name: string; slug: string; price: number;
    category: { name: string };
}
interface CartItem {
    id: number;
    product: Product;
    color: string | null;
    size: string | null;
    quantity: number;
    custom_design: object | null;
}

interface Props { items: CartItem[]; }

export default function CartIndex({ items }: Props) {
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const shipping = subtotal > 0 ? (subtotal >= 75 ? 0 : 9.99) : 0;
    const total = subtotal + shipping;

    const updateQty = (id: number, qty: number) => {
        router.patch(`/cart/${id}`, { quantity: qty }, { preserveScroll: true });
    };

    const remove = (id: number) => {
        router.delete(`/cart/${id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="My Cart — ThreadCraft" />
            <div className="min-h-screen bg-black font-[Inter] text-white">
                {/* Nav */}
                <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                                <Shirt className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold">ThreadCraft</span>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Link href="/" className="hover:text-white">Home</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-white">Cart</span>
                        </div>
                    </div>
                </nav>

                <div className="mx-auto max-w-6xl px-6 pb-24 pt-24">
                    <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <ShoppingBag className="mb-4 h-16 w-16 text-gray-700" />
                            <div className="text-xl font-semibold text-gray-400">Your cart is empty</div>
                            <p className="mt-2 text-gray-600">Looks like you haven't added anything yet.</p>
                            <Link href="/products" className="mt-8 rounded-full bg-violet-600 px-8 py-3 font-semibold transition hover:bg-violet-700">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div
                                            className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl"
                                            style={{ backgroundColor: (item.color ?? '#374151') + '33' }}
                                        >
                                            <Shirt className="h-12 w-12" style={{ color: item.color ?? '#6B7280' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-500">{item.product.category?.name}</div>
                                            <div className="font-semibold leading-tight">{item.product.name}</div>
                                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                                                {item.color && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="h-3 w-3 rounded-full inline-block border border-white/20" style={{ backgroundColor: item.color }} />
                                                        {item.color}
                                                    </span>
                                                )}
                                                {item.size && <span>Size: {item.size}</span>}
                                                {item.custom_design && <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-xs text-violet-400">Custom</span>}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQty(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 transition hover:bg-white/10 disabled:opacity-40"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQty(item.id, item.quantity + 1)}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 transition hover:bg-white/10"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-violet-400">${(item.product.price * item.quantity).toFixed(2)}</span>
                                                    <button onClick={() => remove(item.id)} className="text-gray-600 transition hover:text-red-400">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div>
                                <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 p-6">
                                    <h2 className="mb-6 text-lg font-bold">Order Summary</h2>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                            <span>Shipping</span>
                                            <span>{shipping === 0 ? <span className="text-green-400">Free</span> : `$${shipping.toFixed(2)}`}</span>
                                        </div>
                                        {shipping > 0 && (
                                            <div className="rounded-lg bg-violet-500/10 p-3 text-xs text-violet-300">
                                                Add ${(75 - subtotal).toFixed(2)} more for free shipping
                                            </div>
                                        )}
                                        <div className="border-t border-white/10 pt-3">
                                            <div className="flex justify-between text-base font-bold">
                                                <span>Total</span>
                                                <span className="text-violet-400">${total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/checkout"
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 py-4 font-semibold transition hover:bg-violet-700"
                                    >
                                        Proceed to Checkout <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/products"
                                        className="mt-3 flex w-full items-center justify-center text-sm text-gray-400 transition hover:text-white"
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
