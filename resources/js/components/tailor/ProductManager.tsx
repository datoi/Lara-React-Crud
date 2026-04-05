import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

interface TailorProduct {
    id: number;
    name: string;
    category: string;
    price: number;
    orders: number;
    status: 'active' | 'paused';
}

interface ProductManagerProps {
    products: TailorProduct[];
}

export function ProductManager({ products: initialProducts }: ProductManagerProps) {
    const [products, setProducts] = useState(initialProducts);

    const toggleStatus = (id: number) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p));
    };

    const deleteProduct = (id: number) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">My Products</h2>
                <button className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>
            <div className="divide-y divide-slate-100">
                {products.map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="font-medium text-slate-900 truncate">{product.name}</div>
                                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${
                                    product.status === 'active'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {product.status === 'active' ? 'Active' : 'Paused'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span>{product.category}</span>
                                <span>·</span>
                                <span className="font-medium text-slate-600">₾{product.price}</span>
                                <span>·</span>
                                <span>{product.orders} orders</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                            <button
                                onClick={() => toggleStatus(product.id)}
                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                title={product.status === 'active' ? 'Pause' : 'Activate'}
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => deleteProduct(product.id)}
                                className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
