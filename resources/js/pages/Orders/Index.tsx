import { Head, Link } from '@inertiajs/react';
import { Shirt, Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, RotateCcw } from 'lucide-react';

interface OrderItem { id: number; product_name: string; color: string | null; size: string | null; quantity: number; price: number; }
interface Order {
    id: number; order_number: string; status: string; total: number; shipping: number; subtotal: number;
    first_name: string; last_name: string; address: string; city: string; country: string;
    created_at: string; items: OrderItem[];
}

interface Props { orders: Order[]; }

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending:    { label: 'Pending',    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Clock className="h-3.5 w-3.5" /> },
    processing: { label: 'Processing', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',     icon: <RotateCcw className="h-3.5 w-3.5" /> },
    shipped:    { label: 'Shipped',    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20',icon: <Truck className="h-3.5 w-3.5" /> },
    delivered:  { label: 'Delivered',  color: 'text-green-400 bg-green-400/10 border-green-400/20',  icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    cancelled:  { label: 'Cancelled',  color: 'text-red-400 bg-red-400/10 border-red-400/20',        icon: <XCircle className="h-3.5 w-3.5" /> },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? statusConfig['pending'];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

export default function OrdersIndex({ orders }: Props) {
    return (
        <>
            <Head title="My Orders — ThreadCraft" />
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
                            <span className="text-white">My Orders</span>
                        </div>
                    </div>
                </nav>

                <div className="mx-auto max-w-4xl px-6 pb-24 pt-24">
                    <h1 className="mb-8 text-3xl font-bold">My Orders</h1>

                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <Package className="mb-4 h-16 w-16 text-gray-700" />
                            <div className="text-xl font-semibold text-gray-400">No orders yet</div>
                            <p className="mt-2 text-gray-600">When you place orders, they'll appear here.</p>
                            <Link href="/products" className="mt-8 rounded-full bg-violet-600 px-8 py-3 font-semibold transition hover:bg-violet-700">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                    {/* Order Header */}
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">#{order.order_number}</span>
                                                <StatusBadge status={order.status} />
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                {' · '}{order.first_name} {order.last_name}
                                                {' · '}{order.city}, {order.country}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-violet-400">${order.total.toFixed(2)}</div>
                                            <div className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                                                        style={{ backgroundColor: (item.color ?? '#374151') + '33' }}
                                                    >
                                                        <Shirt className="h-5 w-5" style={{ color: item.color ?? '#6B7280' }} />
                                                    </div>
                                                    <span className="text-gray-300">{item.product_name}</span>
                                                    {item.size && <span className="text-gray-500">· {item.size}</span>}
                                                    <span className="text-gray-500">× {item.quantity}</span>
                                                </div>
                                                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-gray-500">
                                        <div className="flex gap-4">
                                            <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
                                            <span>Shipping: {order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</span>
                                        </div>
                                        <Link href="/products" className="text-violet-400 transition hover:text-violet-300">
                                            Reorder
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
