import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { AddProductModal, type TailorProductFull } from './AddProductModal';

export type { TailorProductFull };

interface ProductManagerProps {
    products:          TailorProductFull[];
    onProductAdded?:   (p: TailorProductFull) => void;
    externalOpen?:     boolean;
    onExternalClose?:  () => void;
}

export function ProductManager({ products: initialProducts, onProductAdded, externalOpen, onExternalClose }: ProductManagerProps) {
    const [products, setProducts] = useState<TailorProductFull[]>(initialProducts);
    const [showModal, setShowModal] = useState(false);

    // Allow parent to programmatically open the modal
    useEffect(() => {
        if (externalOpen) setShowModal(true);
    }, [externalOpen]);

    const toggleStatus = (id: number) =>
        setProducts(prev => prev.map(p => p.id === id
            ? { ...p, status: p.status === 'active' ? 'paused' : 'active' }
            : p));

    const deleteProduct = (id: number) =>
        setProducts(prev => prev.filter(p => p.id !== id));

    const handleCreated = (product: TailorProductFull) => {
        setProducts(prev => [product, ...prev]);
        onProductAdded?.(product);
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">My Products</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>

                {products.length === 0 ? (
                    <div className="px-6 py-14 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-2xl">
                            🧵
                        </div>
                        <p className="font-semibold text-slate-900 text-sm mb-1">No products yet</p>
                        <p className="text-slate-400 text-xs max-w-xs mb-4 leading-relaxed">
                            Customers browse products to place custom orders. Add your first listing to appear in the marketplace.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            Add your first product
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {products.map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 mr-4">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">👗</div>
                                    )}
                                </div>

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
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                                        <span>{product.category}</span>
                                        <span>·</span>
                                        <span className="font-medium text-slate-600">₾{product.price}</span>
                                        {product.fabric && <><span>·</span><span>{product.fabric}</span></>}
                                        <span>·</span>
                                        <span>{product.orders} orders</span>
                                    </div>
                                    {/* Spec pills */}
                                    {(product.colors?.length > 0 || product.required_measurements?.length > 0) && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {product.colors?.slice(0, 5).map(hex => (
                                                <div
                                                    key={hex}
                                                    className="w-3.5 h-3.5 rounded-full border border-slate-200"
                                                    style={{ backgroundColor: hex }}
                                                    title={hex}
                                                />
                                            ))}
                                            {(product.colors?.length ?? 0) > 5 && (
                                                <span className="text-xs text-slate-400">+{product.colors.length - 5}</span>
                                            )}
                                            {product.required_measurements?.length > 0 && (
                                                <span className="text-xs text-slate-400 ml-1">
                                                    {product.required_measurements.length} measurement{product.required_measurements.length !== 1 ? 's' : ''} required
                                                </span>
                                            )}
                                        </div>
                                    )}
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
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <AddProductModal
                        onClose={() => { setShowModal(false); onExternalClose?.(); }}
                        onCreated={handleCreated}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
