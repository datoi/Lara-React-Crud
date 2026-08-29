import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { AddProductModal, type TailorProductFull } from './AddProductModal';
import { getAuthToken } from '../../hooks/useAuth';

export type { TailorProductFull };

interface ProductManagerProps {
    products:          TailorProductFull[];
    onProductAdded?:   (p: TailorProductFull) => void;
    externalOpen?:     boolean;
    onExternalClose?:  () => void;
}

export function ProductManager({ products: initialProducts, onProductAdded, externalOpen, onExternalClose }: ProductManagerProps) {
    const { t } = useTranslation();
    const [products, setProducts]           = useState<TailorProductFull[]>(initialProducts);
    const [showModal, setShowModal]         = useState(false);
    const [editTarget, setEditTarget]       = useState<TailorProductFull | undefined>(undefined);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    useEffect(() => {
        if (externalOpen) setShowModal(true);
    }, [externalOpen]);

    const toggleStatus = async (id: number) => {
        const token = getAuthToken();
        if (!token) return;
        const product = products.find(p => p.id === id);
        if (!product) return;
        const newStatus = product.status === 'active' ? 'paused' : 'active';
        // Optimistic update
        setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        try {
            await fetch(`/api/tailor/products/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch {
            // Revert on failure
            setProducts(prev => prev.map(p => p.id === id ? { ...p, status: product.status } : p));
        }
    };

    const deleteProduct = async (id: number) => {
        const token = getAuthToken();
        if (!token) return;
        try {
            await fetch(`/api/tailor/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch {
            // ignore — product stays in list
        } finally {
            setConfirmDeleteId(null);
        }
    };

    const handleCreated = (product: TailorProductFull) => {
        setProducts(prev => [product, ...prev]);
        onProductAdded?.(product);
    };

    const handleUpdated = (product: TailorProductFull) => {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    };

    const openEdit = (product: TailorProductFull) => {
        setEditTarget(product);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditTarget(undefined);
        onExternalClose?.();
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">{t('tailorComponents.myProducts')}</h2>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        {t('tailorComponents.addProductBtn')}
                    </Button>
                </div>

                {products.length === 0 ? (
                    <div className="px-6 py-14 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-2xl">
                            🧵
                        </div>
                        <p className="font-semibold text-slate-900 text-sm mb-1">{t('tailorComponents.noProductsYet')}</p>
                        <Button
                            variant="default"
                            size="default"
                            onClick={() => setShowModal(true)}
                        >
                            {t('tailorComponents.addFirstProductCta')}
                        </Button>
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
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {product.status === 'active' ? t('tailorComponents.productActive') : t('tailorComponents.productPaused')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                                        <span>{product.category}</span>
                                        <span>·</span>
                                        <span className="font-medium text-slate-600">₾{product.price}</span>
                                        {product.fabric && <><span>·</span><span>{product.fabric}</span></>}
                                        <span>·</span>
                                        <span>{t('tailorComponents.ordersCount', { count: product.orders })}</span>
                                    </div>
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
                                                    {t('tailorComponents.measurementsRequired', { count: product.required_measurements.length })}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                                    {/* Confirm-delete inline prompt */}
                                    {confirmDeleteId === product.id ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-slate-500">{t('tailorComponents.confirmDeleteDesc')}</span>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => deleteProduct(product.id)}
                                                className="h-7 px-2 text-xs"
                                            >
                                                {t('tailorComponents.confirmDeleteBtn')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="h-7 px-2 text-xs"
                                            >
                                                {t('tailorComponents.cancelBtn')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => toggleStatus(product.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                                title={product.status === 'active' ? t('tailorComponents.productPaused') : t('tailorComponents.productActive')}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openEdit(product)}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(product.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <AddProductModal
                        onClose={closeModal}
                        onCreated={handleCreated}
                        editProduct={editTarget}
                        onUpdated={handleUpdated}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
