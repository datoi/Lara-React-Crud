/**
 * Admin panel for the customizer engine.
 * Route: /admin/customizer (protected — user.role === 'admin')
 *
 * Sections:
 *   Products  — create / edit / delete customizer products
 *   Categories — per-product layer categories with z_index, colorable flag
 *   Options   — per-category options with PNG/SVG upload
 *   Fabrics   — color + optional texture upload
 */
import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router';
import { motion, Reorder, useDragControls } from 'motion/react';
import {
    Plus, Trash2, Loader2, ChevronDown, ChevronUp,
    Upload, ArrowLeft, X, GripVertical,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { getAuthToken, getAuthUser } from '../hooks/useAuth';
import type { CustomizerProduct, LayerCategory, LayerOption, OptionColor, Fabric } from '../types/customizer';

// ── Types used only in this page ─────────────────────────────────────────────

interface AdminProduct extends CustomizerProduct {
    layer_categories: (LayerCategory & { options: LayerOption[] })[];
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomizerAdminPage() {
    const navigate = useNavigate();
    const user     = getAuthUser();
    const token    = getAuthToken();

    // Auth guard — redirect to admin login if not authenticated as admin
    useEffect(() => {
        if (!token || user?.role !== 'admin') navigate('/admin/login', { replace: true });
    }, [token, user, navigate]);

    const [tab, setTab] = useState<'products' | 'fabrics'>('products');

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet><title>Customizer Admin | Kere</title></Helmet>

            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-900">Customizer Admin</span>
                    <Link
                        to="/admin-dashboard"
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {/* Tabs */}
                <div className="flex gap-2">
                    {(['products', 'fabrics'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={[
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                                tab === t
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-500 hover:bg-slate-100',
                            ].join(' ')}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {tab === 'products' && <ProductsSection token={token!} />}
                {tab === 'fabrics'  && <FabricsSection  token={token!} />}
            </main>
        </div>
    );
}

// ── Products section ──────────────────────────────────────────────────────────

const GENDER_OPTIONS: { key: 'men' | 'women' | 'unisex'; label: string }[] = [
    { key: 'women',  label: 'Women' },
    { key: 'men',    label: 'Men' },
    { key: 'unisex', label: 'Both (Unisex)' },
];

const GARMENT_CATEGORIES = [
    { key: 'shirt',      label: 'Shirt / Top' },
    { key: 'womens-top', label: "Woman's Top"  },
    { key: 'dress',      label: 'Dress'        },
    { key: 'trousers',   label: 'Trousers'     },
    { key: 'jacket',     label: 'Jacket'       },
    { key: 'skirt',      label: 'Skirt'        },
    { key: 'coat',       label: 'Coat'         },
];

function ProductsSection({ token }: { token: string }) {
    const [products, setProducts]   = useState<AdminProduct[]>([]);
    const [loading, setLoading]     = useState(true);
    const [creating, setCreating]   = useState(false);
    const [expanded, setExpanded]   = useState<number | null>(null);

    // New product form
    const [newName, setNewName]         = useState('');
    const [newPrice, setNewPrice]       = useState('');
    const [newDesc, setNewDesc]         = useState('');
    const [newCategory, setNewCategory] = useState('shirt');
    const [newGender, setNewGender]     = useState<'men' | 'women' | 'unisex'>('women');
    const [newPreview, setNewPreview]   = useState<File | null>(null);
    const [saving, setSaving]           = useState(false);
    const previewRef = useRef<HTMLInputElement>(null);

    const load = () => {
        setLoading(true);
        fetch('/api/admin/customizer/products', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
            .then(r => r.json())
            .then(d => setProducts(d.products ?? []))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!newName || !newPrice) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', newName);
            fd.append('base_price', newPrice);
            fd.append('description', newDesc);
            fd.append('category', newCategory);
            fd.append('gender', newGender);
            fd.append('is_active', '1');
            if (newPreview) fd.append('preview', newPreview);

            const res = await fetch('/api/admin/customizer/products', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (res.ok) {
                setCreating(false);
                setNewName(''); setNewPrice(''); setNewDesc('');
                setNewCategory('shirt'); setNewGender('women'); setNewPreview(null);
                load();
            }
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this product and ALL its categories/options?')) return;
        await fetch(`/api/admin/customizer/products/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        load();
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Products</h2>
                <Button variant="default" size="sm" onClick={() => setCreating(c => !c)}>
                    <Plus className="w-4 h-4" /> New Product
                </Button>
            </div>

            {/* New product form */}
            {creating && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
                >
                    <h3 className="text-sm font-semibold text-slate-700">New Product</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <FormField label="Name" value={newName} onChange={setNewName} placeholder="Classic Shirt" />
                        <FormField label="Base Price (₾)" value={newPrice} onChange={setNewPrice} placeholder="89" type="number" />
                        <FormField label="Description" value={newDesc} onChange={setNewDesc} placeholder="Optional" />
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Garment Category</label>
                            <select
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                            >
                                {GARMENT_CATEGORIES.map(c => (
                                    <option key={c.key} value={c.key}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Section</label>
                            <select
                                value={newGender}
                                onChange={e => setNewGender(e.target.value as 'men' | 'women' | 'unisex')}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                            >
                                {GENDER_OPTIONS.map(g => (
                                    <option key={g.key} value={g.key}>{g.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Preview image upload */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Preview Image</label>
                        <div
                            onClick={() => previewRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 transition-colors"
                        >
                            {newPreview ? (
                                <div className="flex items-center justify-center gap-2">
                                    <img
                                        src={URL.createObjectURL(newPreview)}
                                        alt="preview"
                                        className="h-16 w-16 object-cover rounded"
                                    />
                                    <p className="text-xs text-slate-700">{newPreview.name}</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                                    <p className="text-xs text-slate-500">Click to upload preview image (PNG, JPG, WebP)</p>
                                </>
                            )}
                            <input
                                ref={previewRef}
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp"
                                className="hidden"
                                onChange={e => setNewPreview(e.target.files?.[0] ?? null)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                        <Button variant="default" size="sm" onClick={handleCreate} disabled={saving}>
                            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Product list */}
            {products.map(product => (
                <ProductCard
                    key={product.id}
                    product={product}
                    token={token}
                    expanded={expanded === product.id}
                    onToggle={() => setExpanded(e => e === product.id ? null : product.id)}
                    onDelete={() => handleDelete(product.id)}
                    onRefresh={load}
                />
            ))}
        </div>
    );
}

// ── Product card (with preview image update) ──────────────────────────────────

function ProductCard({
    product, token, expanded, onToggle, onDelete, onRefresh,
}: {
    product: AdminProduct;
    token: string;
    expanded: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onRefresh: () => void;
}) {
    const imgRef  = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading]   = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue]   = useState(product.name);
    const [savingName, setSavingName] = useState(false);

    const handleImageChange = async (file: File) => {
        setUploading(true);
        const fd = new FormData();
        fd.append('preview', file);
        try {
            await fetch(`/api/admin/customizer/products/${product.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            onRefresh();
        } finally { setUploading(false); }
    };

    const handleSaveName = async () => {
        const trimmed = nameValue.trim();
        if (!trimmed || trimmed === product.name) { setEditingName(false); setNameValue(product.name); return; }
        setSavingName(true);
        try {
            await fetch(`/api/admin/customizer/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({ name: trimmed }),
            });
            onRefresh();
        } finally { setSavingName(false); setEditingName(false); }
    };

    const handleGenderChange = async (gender: string) => {
        await fetch(`/api/admin/customizer/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
            body: JSON.stringify({ gender }),
        });
        onRefresh();
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between p-4 gap-3">
                {/* Preview thumbnail */}
                <button
                    type="button"
                    onClick={() => imgRef.current?.click()}
                    className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:opacity-80 transition-opacity"
                    title="Click to change preview image"
                >
                    {product.preview_image_url ? (
                        <img src={product.preview_image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Upload className="w-4 h-4 text-slate-400" />
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                        </div>
                    )}
                    <input
                        ref={imgRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageChange(f); }}
                    />
                </button>

                <div className="flex-1 min-w-0">
                    {editingName ? (
                        <div className="flex items-center gap-1.5">
                            <input
                                ref={nameRef}
                                autoFocus
                                type="text"
                                value={nameValue}
                                onChange={e => setNameValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(product.name); } }}
                                onBlur={handleSaveName}
                                className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            {savingName && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 0); }}
                            className="font-semibold text-slate-900 hover:text-slate-600 text-left truncate w-full transition-colors"
                            title="Click to edit name"
                        >
                            {product.name}
                        </button>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">/{product.slug} · ₾{product.base_price} · {product.category}</p>
                        <select
                            value={product.gender}
                            onChange={e => handleGenderChange(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            title="Section"
                        >
                            {GENDER_OPTIONS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
                        </select>
                    </div>
                    {!product.preview_image_url && (
                        <p className="text-[10px] text-slate-500 mt-0.5">No preview image — click thumbnail to upload</p>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle categories">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete product">
                        <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                    <CategoriesSection productId={product.id} token={token} categories={product.layer_categories ?? []} onRefresh={onRefresh} />
                </div>
            )}
        </div>
    );
}

// ── Option groups section (flat, no extra expansion needed) ──────────────────

function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function CategoriesSection({
    productId, token, categories, onRefresh,
}: {
    productId: number;
    token: string;
    categories: (LayerCategory & { options: LayerOption[] })[];
    onRefresh: () => void;
}) {
    const [groupName, setGroupName]         = useState('');
    const [childrenLabel, setChildrenLabel] = useState('');
    const [savingGroup, setSavingGroup]     = useState(false);
    const [addingGroup, setAddingGroup]     = useState(false);

    const nextZIndex = categories.length > 0
        ? Math.max(...categories.map(c => c.z_index)) + 1
        : 1;

    const handleAddGroup = async () => {
        if (!groupName.trim()) return;
        setSavingGroup(true);
        try {
            const res = await fetch('/api/admin/customizer/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({
                    customizer_product_id: productId,
                    name: groupName.trim(),
                    children_label: childrenLabel.trim() || null,
                    slug: toSlug(groupName.trim()),
                    z_index: nextZIndex,
                    display_order: categories.length,
                    is_required: true,
                    is_colorable: false,
                }),
            });
            if (res.ok) { setGroupName(''); setChildrenLabel(''); setAddingGroup(false); onRefresh(); }
        } finally { setSavingGroup(false); }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!window.confirm('Delete this option group and all its styles?')) return;
        await fetch(`/api/admin/customizer/categories/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        onRefresh();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Option Groups</span>
                <Button variant="outline" size="sm" onClick={() => setAddingGroup(g => !g)}>
                    <Plus className="w-3 h-3" /> Add Group
                </Button>
            </div>

            {/* New group form */}
            {addingGroup && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Group name</label>
                            <input
                                autoFocus
                                type="text"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); }}
                                placeholder="e.g. Sleeves"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Sub-styles label <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={childrenLabel}
                                onChange={e => setChildrenLabel(e.target.value)}
                                placeholder="e.g. Collar"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setAddingGroup(false)}>Cancel</Button>
                        <Button variant="default" size="sm" onClick={handleAddGroup} disabled={savingGroup || !groupName.trim()}>
                            {savingGroup && <Loader2 className="w-3 h-3 animate-spin" />} Add
                        </Button>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {categories.length === 0 && !addingGroup && (
                <p className="text-xs text-slate-400 text-center py-4">
                    No option groups yet. Add one above — e.g. "Sleeve" or "Collar".
                </p>
            )}

            {/* Each group + its styles, all visible at once */}
            {categories.map(group => (
                <OptionGroupCard
                    key={group.id}
                    group={group}
                    token={token}
                    onDeleteGroup={() => handleDeleteGroup(group.id)}
                    onRefresh={onRefresh}
                />
            ))}
        </div>
    );
}

// ── Style card: one top-level option with its sub-styles ─────────────────────

function ViewImageSlot({
    label, url, uploading, onPick,
}: {
    label: string;
    url: string | null;
    uploading: boolean;
    onPick: (file: File) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col items-center gap-0.5">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                title={`Upload ${label.toLowerCase()} view image`}
                className="w-10 h-12 rounded-lg border border-dashed border-slate-300 hover:border-slate-500 transition-colors overflow-hidden flex items-center justify-center bg-white"
                style={url ? { backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '6px 6px' } : undefined}
            >
                {uploading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    : url
                        ? <img src={url} alt={label} className="w-full h-full object-contain" />
                        : <Plus className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <span className="text-[9px] text-slate-500">{label}</span>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) onPick(file);
                    e.target.value = '';
                }}
            />
        </div>
    );
}

function ColorVariantRow({ color, token, onRefresh, onReorderEnd }: { color: OptionColor; token: string; onRefresh: () => void; onReorderEnd: () => void }) {
    const [busyField, setBusyField] = useState<string | null>(null);
    const [error, setError]         = useState<string | null>(null);
    const dragControls = useDragControls();

    const uploadImage = async (field: 'image' | 'back_image' | 'left_image' | 'right_image', file: File) => {
        setBusyField(field);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append(field, file);
            const res = await fetch(`/api/admin/customizer/options/colors/${color.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { message?: string }).message ?? `Upload failed (HTTP ${res.status})`);
            }
            onRefresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Upload failed.');
        } finally { setBusyField(null); }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete the "${color.name}" colour?`)) return;
        setError(null);
        try {
            const res = await fetch(`/api/admin/customizer/options/colors/${color.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { message?: string }).message ?? `Delete failed (HTTP ${res.status})`);
            }
            onRefresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Delete failed.');
        }
    };

    return (
        <Reorder.Item
            as="div"
            value={color}
            dragListener={false}
            dragControls={dragControls}
            onDragEnd={onReorderEnd}
            transition={{ duration: 0.2 }}
            className="border border-slate-200 rounded-lg p-2.5 bg-white"
        >
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onPointerDown={e => dragControls.start(e)}
                    className="cursor-grab touch-none p-0.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing shrink-0"
                    title="Drag to reorder"
                    aria-label={`Drag to reorder ${color.name}`}
                >
                    <GripVertical className="w-4 h-4" />
                </button>
                <span
                    className="w-6 h-6 rounded-full border border-slate-200 shrink-0"
                    style={{ backgroundColor: color.color_hex }}
                    title={color.color_hex}
                />
                <span className="flex-1 text-xs font-semibold text-slate-700 truncate">
                    {color.name}
                    {color.is_default && <span className="ml-1.5 text-[9px] font-normal text-slate-400 uppercase">default</span>}
                </span>

                <div className="flex gap-1.5">
                    <ViewImageSlot label="Front" url={color.image_url} uploading={busyField === 'image'} onPick={f => uploadImage('image', f)} />
                    <ViewImageSlot label="Back" url={color.back_image_url} uploading={busyField === 'back_image'} onPick={f => uploadImage('back_image', f)} />
                    <ViewImageSlot label="Left" url={color.left_image_url} uploading={busyField === 'left_image'} onPick={f => uploadImage('left_image', f)} />
                    <ViewImageSlot label="Right" url={color.right_image_url} uploading={busyField === 'right_image'} onPick={f => uploadImage('right_image', f)} />
                </div>

                <button onClick={handleDelete} className="text-slate-400 hover:text-slate-700 transition-colors p-1 shrink-0" title="Delete colour">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </Reorder.Item>
    );
}

function AddColorForm({ optionId, token, onRefresh }: { optionId: number; token: string; onRefresh: () => void }) {
    const [open, setOpen]       = useState(false);
    const [name, setName]       = useState('');
    const [hex, setHex]         = useState('#ffffff');
    const [file, setFile]       = useState<File | null>(null);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        if (!name.trim() || !file || saving) return;
        setSaving(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append('name', name.trim());
            fd.append('color_hex', hex);
            fd.append('image', file);
            const res = await fetch(`/api/admin/customizer/options/${optionId}/colors`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { message?: string }).message ?? `Save failed (HTTP ${res.status})`);
            }
            setOpen(false);
            setName('');
            setHex('#ffffff');
            setFile(null);
            onRefresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Save failed.');
        } finally { setSaving(false); }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full border border-dashed border-slate-300 rounded-lg py-2 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-700 transition-colors"
            >
                + Add Colour
            </button>
        );
    }

    return (
        <div className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-2">
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={hex}
                    onChange={e => setHex(e.target.value)}
                    title="Colour dot customers will click"
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer bg-white p-0.5 shrink-0"
                />
                <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Colour name (e.g. Navy)"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
            </div>

            <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-slate-400 transition-colors"
            >
                {file ? (
                    <div className="flex items-center gap-2 p-2">
                        <div
                            className="w-10 h-12 rounded overflow-hidden shrink-0"
                            style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '6px 6px' }}
                        >
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[10px] text-slate-600 truncate">{file.name}</p>
                    </div>
                ) : (
                    <div className="p-3 text-center">
                        <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-500">Front photo of this colour (PNG, JPG, WebP)</p>
                    </div>
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setOpen(false); setError(null); }} className="text-xs">
                    Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={saving || !name.trim() || !file} className="text-xs flex-1">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Colour'}
                </Button>
            </div>
        </div>
    );
}

function StyleCard({
    option, categoryId, token, onDelete, onRefresh,
}: {
    option: LayerOption;
    categoryId: number;
    token: string;
    onDelete: () => void;
    onRefresh: () => void;
}) {
    const [addingSubStyle, setAddingSubStyle] = useState(false);
    const [subName, setSubName]               = useState('');
    const [subFile, setSubFile]               = useState<File | null>(null);
    const [saving, setSaving]                 = useState(false);
    const [uploadingView, setUploadingView]   = useState<string | null>(null);
    const [saveError, setSaveError]           = useState<string | null>(null);
    const subFileRef = useRef<HTMLInputElement>(null);

    // Local, drag-reorderable copy of the colours; re-synced whenever the server data changes.
    const [colors, setColors] = useState<OptionColor[]>(option.colors ?? []);
    const colorsRef = useRef(colors);
    useEffect(() => { setColors(option.colors ?? []); }, [option.colors]);
    useEffect(() => { colorsRef.current = colors; }, [colors]);

    const persistColorOrder = async () => {
        setSaveError(null);
        try {
            const res = await fetch(`/api/admin/customizer/options/${option.id}/colors/reorder`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ order: colorsRef.current.map(c => c.id) }),
            });
            if (!res.ok) throw new Error();
        } catch { setSaveError('Could not save colour order.'); }
    };

    const children: LayerOption[] = option.children ?? [];

    const handleUploadView = async (field: 'back_image' | 'left_image' | 'right_image', file: File) => {
        setUploadingView(field);
        setSaveError(null);
        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append(field, file);
            const res = await fetch(`/api/admin/customizer/options/${option.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { message?: string }).message ?? `Upload failed (HTTP ${res.status})`);
            }
            onRefresh();
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : 'Upload failed.');
        } finally { setUploadingView(null); }
    };


    const handleAddSubStyle = async () => {
        if (!subName.trim() || !subFile) return;
        setSaving(true);
        const fd = new FormData();
        fd.append('layer_category_id', String(categoryId));
        fd.append('parent_option_id', String(option.id));
        fd.append('name', subName.trim());
        fd.append('slug', toSlug(subName.trim() + '-' + option.id));
        fd.append('price_modifier', '0');
        fd.append('is_default', children.length === 0 ? '1' : '0');
        fd.append('display_order', String(children.length));
        fd.append('image', subFile);
        try {
            const res = await fetch('/api/admin/customizer/options', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (res.ok) { setAddingSubStyle(false); setSubName(''); setSubFile(null); onRefresh(); }
        } finally { setSaving(false); }
    };

    const handleDeleteSubStyle = async (id: number) => {
        await fetch(`/api/admin/customizer/options/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        onRefresh();
    };

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Top-level option header */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border-b border-slate-100">
                <div
                    className="w-12 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200"
                    style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '8px 8px' }}
                >
                    <img src={option.thumbnail_url} alt={option.name} className="w-full h-full object-contain" />
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-800">{option.name}</span>
                <button onClick={onDelete} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Sub-styles section */}
            <div className="p-3 space-y-2">
                {/* Colours — variants of this style; customers pick them as colour dots */}
                <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Colours
                        <span className="text-slate-400 font-normal ml-1 normal-case">(same style, different colour — shown as dots to customers)</span>
                    </p>

                    <div className="mt-2 space-y-2">
                        <Reorder.Group as="div" axis="y" values={colors} onReorder={setColors} className="space-y-2">
                            {colors.map(color => (
                                <ColorVariantRow
                                    key={color.id}
                                    color={color}
                                    token={token}
                                    onRefresh={onRefresh}
                                    onReorderEnd={persistColorOrder}
                                />
                            ))}
                        </Reorder.Group>

                        <AddColorForm optionId={option.id} token={token} onRefresh={onRefresh} />
                    </div>
                </div>

                {saveError && (
                    <p className="text-xs text-destructive">{saveError}</p>
                )}

                {/* Rotation views — optional back/side photos enable the preview's rotate control */}
                <div className="flex items-start gap-2.5">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide pt-1 shrink-0">
                        Rotation views
                    </p>
                    <div className="flex gap-1.5">
                        <ViewImageSlot
                            label="Back"
                            url={option.back_image_url}
                            uploading={uploadingView === 'back_image'}
                            onPick={file => handleUploadView('back_image', file)}
                        />
                        <ViewImageSlot
                            label="Left"
                            url={option.left_image_url}
                            uploading={uploadingView === 'left_image'}
                            onPick={file => handleUploadView('left_image', file)}
                        />
                        <ViewImageSlot
                            label="Right"
                            url={option.right_image_url}
                            uploading={uploadingView === 'right_image'}
                            onPick={file => handleUploadView('right_image', file)}
                        />
                    </div>
                </div>

                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Sub-styles for "{option.name}"
                    <span className="text-slate-400 font-normal ml-1">(e.g. collar variants)</span>
                </p>

                {/* Existing sub-styles */}
                {children.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5">
                        {children.map(child => (
                            <div key={child.id} className="relative group/sub rounded-lg overflow-hidden border border-slate-200 bg-white">
                                <div
                                    className="aspect-[3/4] w-full overflow-hidden"
                                    style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '8px 8px' }}
                                >
                                    <img src={child.thumbnail_url} alt={child.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="px-1.5 py-1 text-center">
                                    <p className="text-[10px] font-medium text-slate-600 truncate">{child.name}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteSubStyle(child.id)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center opacity-0 group-hover/sub:opacity-100 transition-opacity hover:bg-slate-100"
                                >
                                    <X className="w-2.5 h-2.5 text-slate-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add sub-style */}
                {addingSubStyle ? (
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-white space-y-2">
                        <input
                            autoFocus
                            type="text"
                            value={subName}
                            onChange={e => setSubName(e.target.value)}
                            placeholder={`e.g. Classic Collar (${option.name})`}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <div
                            onClick={() => subFileRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-slate-400 transition-colors"
                        >
                            {subFile ? (
                                <div className="flex items-center gap-2 p-2">
                                    <div
                                        className="w-10 h-12 rounded overflow-hidden shrink-0"
                                        style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '6px 6px' }}
                                    >
                                        <img src={URL.createObjectURL(subFile)} alt="preview" className="w-full h-full object-contain" />
                                    </div>
                                    <p className="text-[10px] text-slate-600 truncate">{subFile.name}</p>
                                </div>
                            ) : (
                                <div className="p-4 text-center">
                                    <Upload className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                                    <p className="text-[10px] text-slate-500">Upload image</p>
                                </div>
                            )}
                            <input ref={subFileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" className="hidden"
                                onChange={e => setSubFile(e.target.files?.[0] ?? null)} />
                        </div>
                        <div className="flex gap-1.5 justify-end">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setAddingSubStyle(false); setSubName(''); setSubFile(null); }}>
                                Cancel
                            </Button>
                            <Button variant="default" size="sm" className="h-7 text-xs" onClick={handleAddSubStyle} disabled={saving || !subName.trim() || !subFile}>
                                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setAddingSubStyle(true)}
                        className="w-full border border-dashed border-slate-200 rounded-lg py-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors flex items-center justify-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Sub-style
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Single option group card ──────────────────────────────────────────────────

function OptionGroupCard({
    group, token, onDeleteGroup, onRefresh,
}: {
    group: LayerCategory & { options: LayerOption[] };
    token: string;
    onDeleteGroup: () => void;
    onRefresh: () => void;
}) {
    const [addingStyle, setAddingStyle]       = useState(false);
    const [styleName, setStyleName]           = useState('');
    const [styleFile, setStyleFile]           = useState<File | null>(null);
    const [saving, setSaving]                 = useState(false);
    const [childrenLabel, setChildrenLabel]   = useState(group.children_label ?? '');
    const [savingLabel, setSavingLabel]       = useState(false);
    const [editingGroupName, setEditingGroupName] = useState(false);
    const [groupNameValue, setGroupNameValue]     = useState(group.name);
    const [savingGroupName, setSavingGroupName]   = useState(false);
    const groupNameRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSaveGroupName = async () => {
        const trimmed = groupNameValue.trim();
        if (!trimmed || trimmed === group.name) { setEditingGroupName(false); setGroupNameValue(group.name); return; }
        setSavingGroupName(true);
        try {
            await fetch(`/api/admin/customizer/categories/${group.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({ name: trimmed }),
            });
            onRefresh();
        } finally { setSavingGroupName(false); setEditingGroupName(false); }
    };

    const handleSaveLabel = async () => {
        setSavingLabel(true);
        try {
            await fetch(`/api/admin/customizer/categories/${group.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({ children_label: childrenLabel.trim() || null }),
            });
            onRefresh();
        } finally { setSavingLabel(false); }
    };

    const handleAddStyle = async () => {
        if (!styleName.trim() || !styleFile) return;
        setSaving(true);
        const fd = new FormData();
        fd.append('layer_category_id', String(group.id));
        fd.append('name', styleName.trim());
        fd.append('slug', toSlug(styleName.trim()));
        fd.append('price_modifier', '0');
        fd.append('is_default', group.options.length === 0 ? '1' : '0');
        fd.append('display_order', String(group.options.length));
        fd.append('image', styleFile);
        try {
            const res = await fetch('/api/admin/customizer/options', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (res.ok) {
                setAddingStyle(false);
                setStyleName('');
                setStyleFile(null);
                onRefresh();
            }
        } finally { setSaving(false); }
    };

    const handleDeleteStyle = async (id: number) => {
        await fetch(`/api/admin/customizer/options/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        onRefresh();
    };

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
            {/* Group header */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    {editingGroupName ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                                ref={groupNameRef}
                                autoFocus
                                type="text"
                                value={groupNameValue}
                                onChange={e => setGroupNameValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveGroupName(); if (e.key === 'Escape') { setEditingGroupName(false); setGroupNameValue(group.name); } }}
                                onBlur={handleSaveGroupName}
                                className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            {savingGroupName && <Loader2 className="w-3 h-3 animate-spin text-slate-400 shrink-0" />}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setEditingGroupName(true); setTimeout(() => groupNameRef.current?.select(), 0); }}
                            className="text-sm font-semibold text-slate-800 hover:text-slate-600 text-left transition-colors"
                            title="Click to edit group name"
                        >
                            {group.name}
                        </button>
                    )}
                    <button onClick={onDeleteGroup} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded shrink-0" title="Delete group">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
                {/* Sub-styles label */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 shrink-0">Sub-styles label:</span>
                    <input
                        type="text"
                        value={childrenLabel}
                        onChange={e => setChildrenLabel(e.target.value)}
                        onBlur={handleSaveLabel}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveLabel(); }}
                        placeholder="e.g. Collar"
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    />
                    {savingLabel && <Loader2 className="w-3 h-3 animate-spin text-slate-400 shrink-0" />}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Existing styles — each with its own sub-styles section */}
                {group.options.map(opt => (
                    <StyleCard
                        key={opt.id}
                        option={opt}
                        categoryId={group.id}
                        token={token}
                        onDelete={() => handleDeleteStyle(opt.id)}
                        onRefresh={onRefresh}
                    />
                ))}

                {/* Add style form */}
                {addingStyle ? (
                    <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
                        <p className="text-xs font-semibold text-slate-700">Add a style to "{group.name}"</p>

                        <input
                            autoFocus
                            type="text"
                            value={styleName}
                            onChange={e => setStyleName(e.target.value)}
                            placeholder="Style name (e.g. Short Sleeve)"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />

                        {/* Image upload */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-400 transition-colors overflow-hidden"
                        >
                            {styleFile ? (
                                <div className="flex items-center gap-3 p-3">
                                    <div
                                        className="w-16 h-20 rounded-lg overflow-hidden shrink-0"
                                        style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '8px 8px' }}
                                    >
                                        <img src={URL.createObjectURL(styleFile)} alt="preview" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">{styleFile.name}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Click to change</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 font-medium">Upload image for this style</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG — max 4 MB</p>
                                </div>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".png,.jpg,.jpeg,.svg,.webp"
                                className="hidden"
                                onChange={e => setStyleFile(e.target.files?.[0] ?? null)}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => { setAddingStyle(false); setStyleName(''); setStyleFile(null); }}>
                                Cancel
                            </Button>
                            <Button variant="default" size="sm" onClick={handleAddStyle} disabled={saving || !styleName.trim() || !styleFile}>
                                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save Style
                            </Button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setAddingStyle(true)}
                        className="w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-xs font-medium text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Style
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Fabrics section ───────────────────────────────────────────────────────────

function FabricsSection({ token }: { token: string }) {
    const [fabrics, setFabrics]   = useState<Fabric[]>([]);
    const [loading, setLoading]   = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm]         = useState({ name: '', color_hex: '#ffffff', price_modifier: '0' });
    const [texture, setTexture]   = useState<File | null>(null);
    const [saving, setSaving]     = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const load = () => {
        fetch('/api/admin/customizer/fabrics', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        })
            .then(r => r.json())
            .then(d => setFabrics(d.fabrics ?? []))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        setSaving(true);
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('color_hex', form.color_hex);
        fd.append('price_modifier', form.price_modifier);
        if (texture) fd.append('texture', texture);
        try {
            const res = await fetch('/api/admin/customizer/fabrics', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (res.ok) { setCreating(false); setTexture(null); load(); }
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this fabric?')) return;
        await fetch(`/api/admin/customizer/fabrics/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        load();
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Fabrics</h2>
                <Button variant="default" size="sm" onClick={() => setCreating(c => !c)}>
                    <Plus className="w-4 h-4" /> New Fabric
                </Button>
            </div>

            {creating && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                        <FormField label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Navy" />
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
                            <input
                                type="color"
                                value={form.color_hex}
                                onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))}
                                className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer px-1"
                            />
                        </div>
                        <FormField label="Price modifier (₾)" value={form.price_modifier} onChange={v => setForm(f => ({ ...f, price_modifier: v }))} type="number" />
                    </div>
                    {/* Optional texture */}
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:border-slate-400 transition-colors"
                    >
                        <Upload className="w-4 h-4 text-slate-400 mx-auto mb-0.5" />
                        <p className="text-xs text-slate-500">{texture ? texture.name : 'Optional: upload tileable texture PNG'}</p>
                        <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg" className="hidden"
                            onChange={e => setTexture(e.target.files?.[0] ?? null)} />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                        <Button variant="default" size="sm" onClick={handleCreate} disabled={saving || !form.name}>
                            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3">
                {fabrics.map(fabric => (
                    <div key={fabric.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                            style={{ backgroundColor: fabric.color_hex }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{fabric.name}</p>
                            <p className="text-xs text-slate-400">{fabric.color_hex}{fabric.price_modifier ? ` · +₾${fabric.price_modifier}` : ''}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fabric.id)}>
                            <Trash2 className="w-4 h-4 text-slate-400" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Small reusable form field ─────────────────────────────────────────────────

function FormField({
    label, value, onChange, placeholder = '', type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
        </div>
    );
}
