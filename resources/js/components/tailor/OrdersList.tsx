import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
    id: number;
    product_name: string;
    color: string | null;
    size: string | null;
    quantity: number;
    price: number;
    cm_measurements: Record<string, string> | null;
}

interface CustomDesign {
    clothingType: string | null;
    subcategory: string | null;
    length: string;
    sleeves: string;
    neckline: string;
    fabric: string;
    baseColor: string;
    lighterShade: string;
    darkerShade: string;
    additionalColor: string;
    textureMaterial: string;
    sizeStandard: string;
    sizeCm: Record<string, string>;
    designElements: { cuts: string[]; height: string; customNotes: string };
}

export interface TailorOrder {
    id: number;
    order_number: string;
    order_type: 'marketplace' | 'custom';
    status: 'pending' | 'processing' | 'shipped' | 'finished' | 'delivered' | 'cancelled';
    subtotal: number;
    shipping: number;
    total: number;
    created_at: string;
    customer: { name: string; email: string; phone: string };
    items: OrderItem[];
    custom_design_data: CustomDesign | null;
}

interface OrdersListProps {
    orders: TailorOrder[];
    onStatusChange?: (orderId: number, status: string) => Promise<void>;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
    pending:    { label: 'Pending',     classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    processing: { label: 'In Progress', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    shipped:    { label: 'Shipped',     classes: 'bg-purple-50 text-purple-700 border-purple-200' },
    finished:   { label: 'Finished',    classes: 'bg-green-50 text-green-700 border-green-200' },
    delivered:  { label: 'Delivered',   classes: 'bg-green-50 text-green-700 border-green-200' },
    cancelled:  { label: 'Cancelled',   classes: 'bg-red-50 text-red-700 border-red-200' },
};

// Options shown in the dropdown (tailor can set these)
const STATUS_OPTIONS = [
    { value: 'pending',    label: 'Pending' },
    { value: 'processing', label: 'In Progress' },
    { value: 'shipped',    label: 'Shipped' },
    { value: 'finished',   label: 'Finished' },
    { value: 'cancelled',  label: 'Cancelled' },
];

// ─── Spec row ─────────────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
            <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
            <span className="text-xs font-medium text-slate-900 text-right">{value}</span>
        </div>
    );
}

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onStatusChange }: {
    order: TailorOrder;
    onClose: () => void;
    onStatusChange?: (id: number, status: string) => Promise<void>;
}) {
    const status  = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
    const isCustom = order.order_type === 'custom';
    const cd = order.custom_design_data;

    // Local status state — only syncs to DB when "Save Status" is clicked
    const [localStatus, setLocalStatus] = useState(order.status);
    const [saving, setSaving]           = useState(false);
    const [saved,  setSaved]            = useState(false);

    const handleSave = async () => {
        if (!onStatusChange || saving) return;
        setSaving(true);
        await onStatusChange(order.id, localStatus);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-500">{order.order_number}</span>
                            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${status.classes}`}>
                                {status.label}
                            </span>
                            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                                isCustom
                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                                {isCustom ? 'Custom Design' : 'Marketplace'}
                            </span>
                        </div>
                        <p className="font-bold text-slate-900">{order.customer.name}</p>
                        <p className="text-xs text-slate-500">{order.customer.email}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Marketplace order details */}
                    {!isCustom && order.items.map(item => (
                        <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                Product Details
                            </div>
                            <SpecRow label="Product"  value={item.product_name} />
                            <SpecRow label="Quantity" value={String(item.quantity)} />
                            <SpecRow label="Size"     value={item.size} />
                            {item.color && (
                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-xs text-slate-500">Color</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-mono text-slate-700">{item.color}</span>
                                    </div>
                                </div>
                            )}
                            {item.cm_measurements && Object.keys(item.cm_measurements).length > 0 && (
                                <>
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-2">
                                        Measurements (cm)
                                    </div>
                                    {Object.entries(item.cm_measurements).map(([k, v]) => (
                                        <SpecRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={`${v} cm`} />
                                    ))}
                                </>
                            )}
                        </div>
                    ))}

                    {/* Custom design details */}
                    {isCustom && cd && (
                        <>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Garment Specs</div>
                                <SpecRow label="Type"        value={cd.clothingType ?? undefined} />
                                <SpecRow label="Subcategory" value={cd.subcategory ?? undefined} />
                                <SpecRow label="Fabric"      value={cd.fabric} />
                                <SpecRow label="Length"      value={cd.length} />
                                <SpecRow label="Sleeves"     value={cd.sleeves} />
                                <SpecRow label="Neckline"    value={cd.neckline} />
                                <SpecRow label="Texture"     value={cd.textureMaterial} />
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Colors</div>
                                <div className="flex gap-3 flex-wrap">
                                    {[
                                        { label: 'Base',   color: cd.baseColor },
                                        { label: 'Light',  color: cd.lighterShade },
                                        { label: 'Dark',   color: cd.darkerShade },
                                        { label: 'Accent', color: cd.additionalColor },
                                    ].filter(c => c.color).map(c => (
                                        <div key={c.label} className="flex flex-col items-center gap-1">
                                            <div className="w-10 h-10 rounded-xl border border-slate-200" style={{ backgroundColor: c.color }} />
                                            <span className="text-xs text-slate-400">{c.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Size & Measurements</div>
                                <SpecRow label="Standard Size" value={cd.sizeStandard} />
                                {Object.entries(cd.sizeCm ?? {}).map(([k, v]) => v
                                    ? <SpecRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={`${v} cm`} />
                                    : null
                                )}
                                {cd.designElements?.height && (
                                    <SpecRow label="Height" value={`${cd.designElements.height} cm`} />
                                )}
                            </div>

                            {cd.designElements?.cuts?.length > 0 && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Design Elements</div>
                                    <div className="flex flex-wrap gap-2">
                                        {cd.designElements.cuts.map(cut => (
                                            <span key={cut} className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">{cut}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cd.designElements?.customNotes && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Custom Notes</div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{cd.designElements.customNotes}</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Pricing */}
                    <div className="bg-slate-900 rounded-xl p-4 text-white">
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span><span>₾{order.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Shipping</span><span>₾{order.shipping}</span>
                            </div>
                            <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-700">
                                <span>Total</span><span>₾{order.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status update — manual save */}
                    {onStatusChange && (
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                                Update Status
                            </label>
                            <select
                                value={localStatus}
                                onChange={e => {
                                    setLocalStatus(e.target.value as TailorOrder['status']);
                                    setSaved(false);
                                }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            >
                                {STATUS_OPTIONS.map(({ value, label }) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving || localStatus === order.status}
                                    className="flex items-center gap-2"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                                    ) : (
                                        'Save Status'
                                    )}
                                </Button>

                                <AnimatePresence>
                                    {saved && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-center gap-1.5 text-xs font-medium text-green-700"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Status saved — customer notified
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrdersList({ orders, onStatusChange }: OrdersListProps) {
    const [viewing, setViewing] = useState<TailorOrder | null>(null);

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900">Active Orders</h2>
                </div>

                {orders.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 text-sm">
                        No orders yet. They'll appear here once customers place them.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                    <th className="text-left px-6 py-3 font-semibold">Order</th>
                                    <th className="text-left px-6 py-3 font-semibold">Customer</th>
                                    <th className="text-left px-6 py-3 font-semibold">Type / Product</th>
                                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                                    <th className="text-left px-6 py-3 font-semibold">Amount</th>
                                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, i) => {
                                    const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                                    const productLabel = order.order_type === 'custom'
                                        ? `Custom: ${order.custom_design_data?.clothingType ?? '—'}`
                                        : (order.items[0]?.product_name ?? '—');

                                    return (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500">{order.order_number}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.customer.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-[180px] truncate">{productLabel}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${status.classes}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">₾{order.total}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{order.created_at}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setViewing(order)}
                                                    className="text-xs font-medium text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                                >
                                                    View Order
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewing && (
                    <OrderDetailModal
                        key={viewing.id}
                        order={viewing}
                        onClose={() => setViewing(null)}
                        onStatusChange={onStatusChange
                            ? async (id, status) => {
                                await onStatusChange(id, status);
                                // Update the modal's order header badge after save
                                setViewing(v => v ? { ...v, status: status as TailorOrder['status'] } : null);
                              }
                            : undefined
                        }
                    />
                )}
            </AnimatePresence>
        </>
    );
}
