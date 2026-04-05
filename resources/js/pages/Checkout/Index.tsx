import { Head, Link, useForm } from '@inertiajs/react';
import { Shirt, ChevronRight, Check, Lock } from 'lucide-react';

interface Product { id: number; name: string; price: number; }
interface CartItem { id: number; product: Product; color: string | null; size: string | null; quantity: number; custom_design: object | null; }

interface Props {
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
}

export default function CheckoutIndex({ items, subtotal, shipping, total }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/checkout');
    };

    return (
        <>
            <Head title="Checkout — ThreadCraft" />
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
                            <Link href="/cart" className="hover:text-white">Cart</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-white">Checkout</span>
                        </div>
                    </div>
                </nav>

                <div className="mx-auto max-w-6xl px-6 pb-24 pt-24">
                    <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

                    <form onSubmit={submit}>
                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Form */}
                            <div className="space-y-8 lg:col-span-2">
                                {/* Contact Info */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                    <h2 className="mb-5 text-lg font-bold">Contact Information</h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">First Name *</label>
                                            <input
                                                value={data.first_name}
                                                onChange={e => setData('first_name', e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                placeholder="John"
                                            />
                                            {errors.first_name && <p className="mt-1 text-xs text-red-400">{errors.first_name}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">Last Name *</label>
                                            <input
                                                value={data.last_name}
                                                onChange={e => setData('last_name', e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                placeholder="Doe"
                                            />
                                            {errors.last_name && <p className="mt-1 text-xs text-red-400">{errors.last_name}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">Email *</label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">Phone</label>
                                            <input
                                                value={data.phone}
                                                onChange={e => setData('phone', e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                placeholder="+1 555 000 0000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                    <h2 className="mb-5 text-lg font-bold">Shipping Address</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">Address *</label>
                                            <input
                                                value={data.address}
                                                onChange={e => setData('address', e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                placeholder="123 Main Street"
                                            />
                                            {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address}</p>}
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-300">City *</label>
                                                <input
                                                    value={data.city}
                                                    onChange={e => setData('city', e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                    placeholder="New York"
                                                />
                                                {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-300">State / Province</label>
                                                <input
                                                    value={data.state}
                                                    onChange={e => setData('state', e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                    placeholder="NY"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-300">ZIP / Postal Code *</label>
                                                <input
                                                    value={data.zip}
                                                    onChange={e => setData('zip', e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                    placeholder="10001"
                                                />
                                                {errors.zip && <p className="mt-1 text-xs text-red-400">{errors.zip}</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-gray-300">Country *</label>
                                                <select
                                                    value={data.country}
                                                    onChange={e => setData('country', e.target.value)}
                                                    className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                >
                                                    <option value="US">United States</option>
                                                    <option value="CA">Canada</option>
                                                    <option value="GB">United Kingdom</option>
                                                    <option value="AU">Australia</option>
                                                    <option value="DE">Germany</option>
                                                    <option value="FR">France</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">Order Notes</label>
                                            <textarea
                                                value={data.notes}
                                                onChange={e => setData('notes', e.target.value)}
                                                rows={3}
                                                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-500"
                                                placeholder="Any special instructions..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment notice */}
                                <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                                    <Lock className="h-5 w-5 flex-shrink-0 text-green-400" />
                                    <p className="text-sm text-green-300">
                                        This is a demo store. No real payment is processed. Place the order to see the order confirmation.
                                    </p>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div>
                                <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 p-6">
                                    <h2 className="mb-5 text-lg font-bold">Order Summary</h2>

                                    <div className="mb-5 space-y-3">
                                        {items.map(item => (
                                            <div key={item.id} className="flex gap-3">
                                                <div
                                                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                                                    style={{ backgroundColor: (item.color ?? '#374151') + '33' }}
                                                >
                                                    <Shirt className="h-7 w-7" style={{ color: item.color ?? '#6B7280' }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="truncate text-sm font-medium">{item.product.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {item.size && `${item.size} · `}Qty {item.quantity}
                                                        {item.custom_design && ' · Custom'}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-violet-400">
                                                    ${(item.product.price * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                            <span>Shipping</span>
                                            <span>{shipping === 0 ? <span className="text-green-400">Free</span> : `$${shipping.toFixed(2)}`}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold">
                                            <span>Total</span>
                                            <span className="text-violet-400">${total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 py-4 font-semibold transition hover:bg-violet-700 disabled:opacity-60"
                                    >
                                        {processing ? 'Placing Order...' : <><Check className="h-4 w-4" /> Place Order</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
