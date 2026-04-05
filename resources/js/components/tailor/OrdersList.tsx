import { motion } from 'motion/react';

interface Order {
    id: string;
    customer: string;
    product: string;
    status: 'pending' | 'in-progress' | 'completed';
    amount: number;
    date: string;
    dueDate: string;
}

interface OrdersListProps {
    orders: Order[];
}

const STATUS_CONFIG = {
    pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    'in-progress': { label: 'In Progress', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', classes: 'bg-green-50 text-green-700 border-green-200' },
};

export function OrdersList({ orders }: OrdersListProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Active Orders</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-6 py-3 font-semibold">Order</th>
                            <th className="text-left px-6 py-3 font-semibold">Customer</th>
                            <th className="text-left px-6 py-3 font-semibold">Product</th>
                            <th className="text-left px-6 py-3 font-semibold">Status</th>
                            <th className="text-left px-6 py-3 font-semibold">Amount</th>
                            <th className="text-left px-6 py-3 font-semibold">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, i) => {
                            const status = STATUS_CONFIG[order.status];
                            return (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{order.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.customer}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{order.product}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${status.classes}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₾{order.amount}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{order.dueDate}</td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
