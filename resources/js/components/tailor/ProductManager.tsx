import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageOff, Loader2, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
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
    const [deletingId, setDeletingId]       = useState<number | null>(null);
    const [deleteFailedId, setDeleteFailedId] = useState<number | null>(null);

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
        setDeletingId(id);
        setDeleteFailedId(null);
        try {
            const res = await fetch(`/api/tailor/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            // 404: already gone, so the list should not show it either
            if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
            setProducts(prev => prev.filter(p => p.id !== id));
            setConfirmDeleteId(null);
        } catch {
            setDeleteFailedId(id);
        } finally {
            setDeletingId(null);
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
                <div className="px-4 py-4 sm:px-6 border-b border-slate-100 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-bold text-slate-900">{t('tailorComponents.myProducts')}</h2>
                    {products.length > 0 && <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowModal(true)}
                        className="flex h-auto min-h-10 max-w-full items-center gap-1.5 whitespace-normal py-2 text-left"
                    >
                        <Plus className="w-4 h-4" />
                        {t('tailorComponents.addProductBtn')}
                    </Button>}
                </div>

                {products.length === 0 ? (
                    <div className="px-4 py-6 sm:px-6 flex flex-col items-start gap-2 text-left">
                        <p className="font-semibold text-slate-900 text-sm mb-1">{t('tailorComponents.noProductsYet')}</p>
                        <p className="mb-3 max-w-sm text-xs leading-6 text-[var(--store-muted)]">{t('tailorComponents.emptyProductsHint')}</p>
                        <Button
                            variant="default"
                            size="default"
                            className="h-auto min-h-10 w-full sm:w-auto max-w-sm whitespace-normal px-3 py-2 text-xs leading-5"
                            onClick={() => setShowModal(true)}
                        >
                            {t('tailorComponents.addProductBtn')}
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
                                className="studio-product-row flex items-center justify-between px-6 py-4 transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="w-10 h-10 rounded-none overflow-hidden bg-[#eee6dd] flex-shrink-0 mr-4">
                                    {product.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg"><ImageOff className="h-4 w-4 text-slate-400" aria-hidden="true" /></div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="font-medium text-slate-900 truncate">{product.name}</div>
                                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${
                                            product.status === 'active'
                                                ? 'studio-product-active'
                                                : 'studio-product-paused'
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

                                {/* The prompt takes its own line: on a phone it did not fit
                                    beside the product and its Delete button was clipped off. */}
                                <div className={confirmDeleteId === product.id ? 'basis-full' : 'flex items-center gap-1 ml-4 flex-shrink-0'}>
                                    {confirmDeleteId === product.id ? (
                                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                                            <span className="text-xs text-slate-500">{t('tailorComponents.confirmDeleteDesc')}</span>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                disabled={deletingId === product.id}
                                                onClick={() => deleteProduct(product.id)}
                                                className="h-7 px-2 text-xs"
                                            >
                                                {deletingId === product.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                                {t('tailorComponents.confirmDeleteBtn')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={deletingId === product.id}
                                                onClick={() => { setConfirmDeleteId(null); setDeleteFailedId(null); }}
                                                className="h-7 px-2 text-xs"
                                            >
                                                {t('tailorComponents.cancelBtn')}
                                            </Button>
                                            {deleteFailedId === product.id && (
                                                <p role="alert" className="basis-full text-right text-xs text-destructive">{t('tailorComponents.deleteFailed')}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => toggleStatus(product.id)}
                                                className="inline-flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:bg-[#e9d8cf] hover:text-[#631e26] transition-colors"
                                                title={product.status === 'active' ? t('tailorComponents.productPaused') : t('tailorComponents.productActive')}
                                            >
                                                <Eye className="w-4 h-4" aria-hidden="true" /><span>{t(product.status === 'active' ? 'studio.pauseProduct' : 'studio.resumeProduct')}</span>
                                            </button>
                                            <button
                                                onClick={() => openEdit(product)}
                                                className="inline-flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:bg-[#e9d8cf] hover:text-[#631e26] transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" aria-hidden="true" /><span>{t('tailorComponents.editProduct')}</span>
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(product.id)}
                                                className="inline-flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:bg-[#e9d8cf] hover:text-[#631e26] transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" aria-hidden="true" /><span>{t('studio.deleteProduct')}</span>
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
