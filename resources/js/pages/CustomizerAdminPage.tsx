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
import { motion } from 'motion/react';
import {
    Plus, Trash2, Loader2, ChevronDown, ChevronUp,
    Upload, ArrowLeft, Pencil, X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { getAuthToken, getAuthUser } from '../hooks/useAuth';
import type { CustomizerProduct, LayerCategory, LayerOption, Fabric } from '../types/customizer';

// ── Types used only in this page ─────────────────────────────────────────────

interface AdminProduct extends CustomizerProduct {
    layer_categories: (LayerCategory & { options: LayerOption[] })[];
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomizerAdminPage() {
    const navigate = useNavigate();
    const user     = getAuthUser();
    const token    = getAuthToken();

    // Auth guard
    useEffect(() => {
        if (!token || user?.role !== 'admin') navigate('/');
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

function ProductsSection({ token }: { token: string }) {
    const [products, setProducts]   = useState<AdminProduct[]>([]);
    const [loading, setLoading]     = useState(true);
    const [creating, setCreating]   = useState(false);
    const [expanded, setExpanded]   = useState<number | null>(null);

    // New product form
    const [newName, setNewName]     = useState('');
    const [newSlug, setNewSlug]     = useState('');
    const [newPrice, setNewPrice]   = useState('');
    const [newDesc, setNewDesc]     = useState('');
    const [saving, setSaving]       = useState(false);

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
        if (!newName || !newSlug || !newPrice) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/customizer/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name: newName, slug: newSlug,
                    base_price: parseFloat(newPrice),
                    description: newDesc, is_active: true,
                }),
            });
            if (res.ok) { setCreating(false); setNewName(''); setNewSlug(''); setNewPrice(''); setNewDesc(''); load(); }
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
                        <FormField label="Slug" value={newSlug} onChange={setNewSlug} placeholder="classic-shirt" />
                        <FormField label="Base Price (₾)" value={newPrice} onChange={setNewPrice} placeholder="89" type="number" />
                        <FormField label="Description" value={newDesc} onChange={setNewDesc} placeholder="Optional" />
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
                <div key={product.id} className="bg-white rounded-2xl border border-slate-200">
                    {/* Product row */}
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <p className="font-semibold text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-400">/{product.slug} · ₾{product.base_price}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setExpanded(e => e === product.id ? null : product.id)} aria-label="Toggle categories">
                                {expanded === product.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} aria-label="Delete product">
                                <Trash2 className="w-4 h-4 text-slate-400" />
                            </Button>
                        </div>
                    </div>

                    {/* Expanded: categories + options */}
                    {expanded === product.id && (
                        <div className="border-t border-slate-100 p-4 space-y-4">
                            <CategoriesSection productId={product.id} token={token} categories={product.layer_categories ?? []} onRefresh={load} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Categories section (nested under product) ─────────────────────────────────

function CategoriesSection({
    productId, token, categories, onRefresh,
}: {
    productId: number;
    token: string;
    categories: (LayerCategory & { options: LayerOption[] })[];
    onRefresh: () => void;
}) {
    const [creating, setCreating] = useState(false);
    const [form, setForm]         = useState({ name: '', slug: '', z_index: '1', is_required: true, is_colorable: false, display_order: '0' });
    const [saving, setSaving]     = useState(false);
    const [expandedCat, setExpandedCat] = useState<number | null>(null);

    const handleCreate = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/customizer/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({ ...form, customizer_product_id: productId, z_index: parseInt(form.z_index), display_order: parseInt(form.display_order) }),
            });
            if (res.ok) { setCreating(false); onRefresh(); }
        } finally { setSaving(false); }
    };

    const handleDeleteCat = async (id: number) => {
        if (!window.confirm('Delete this category and all its options?')) return;
        await fetch(`/api/admin/customizer/categories/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        onRefresh();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Layer Categories</span>
                <Button variant="outline" size="sm" onClick={() => setCreating(c => !c)}>
                    <Plus className="w-3 h-3" /> Category
                </Button>
            </div>

            {creating && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                    <div className="grid grid-cols-2 gap-2">
                        <FormField label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Collar" />
                        <FormField label="Slug" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} placeholder="collar" />
                        <FormField label="z-index" value={form.z_index} onChange={v => setForm(f => ({ ...f, z_index: v }))} type="number" />
                        <FormField label="Display order" value={form.display_order} onChange={v => setForm(f => ({ ...f, display_order: v }))} type="number" />
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={form.is_required} onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))} />
                            Required
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={form.is_colorable} onChange={e => setForm(f => ({ ...f, is_colorable: e.target.checked }))} />
                            Colorable (CSS tint)
                        </label>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                        <Button variant="default" size="sm" onClick={handleCreate} disabled={saving}>
                            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
                        </Button>
                    </div>
                </div>
            )}

            {categories.map(cat => (
                <div key={cat.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                        <span className="text-xs font-medium text-slate-700">
                            {cat.name} <span className="text-slate-400">(z={cat.z_index}{cat.is_colorable ? ', colorable' : ''})</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setExpandedCat(e => e === cat.id ? null : cat.id)}>
                                {expandedCat === cat.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCat(cat.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                            </Button>
                        </div>
                    </div>
                    {expandedCat === cat.id && (
                        <div className="p-3">
                            <OptionsSection categoryId={cat.id} token={token} options={cat.options ?? []} onRefresh={onRefresh} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Options section (nested under category) ───────────────────────────────────

function OptionsSection({
    categoryId, token, options, onRefresh,
}: {
    categoryId: number;
    token: string;
    options: LayerOption[];
    onRefresh: () => void;
}) {
    const [creating, setCreating] = useState(false);
    const [form, setForm]         = useState({ name: '', slug: '', price_modifier: '0', is_default: false });
    const [file, setFile]         = useState<File | null>(null);
    const [saving, setSaving]     = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleCreate = async () => {
        if (!file) return;
        setSaving(true);
        const fd = new FormData();
        fd.append('layer_category_id', String(categoryId));
        fd.append('name', form.name);
        fd.append('slug', form.slug);
        fd.append('price_modifier', form.price_modifier);
        fd.append('is_default', form.is_default ? '1' : '0');
        fd.append('image', file);
        try {
            const res = await fetch('/api/admin/customizer/options', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: fd,
            });
            if (res.ok) { setCreating(false); setFile(null); onRefresh(); }
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        await fetch(`/api/admin/customizer/options/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        onRefresh();
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Options ({options.length})</span>
                <Button variant="ghost" size="sm" onClick={() => setCreating(c => !c)} className="h-7 text-xs">
                    <Plus className="w-3 h-3" /> Add Option
                </Button>
            </div>

            {/* Existing options */}
            <div className="grid grid-cols-2 gap-1.5">
                {options.map(opt => (
                    <div key={opt.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-1.5">
                        {/* Checkered preview */}
                        <div
                            className="w-8 h-8 rounded border border-slate-200 shrink-0 overflow-hidden"
                            style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '6px 6px' }}
                        >
                            <img src={opt.thumbnail_url} alt={opt.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{opt.name}</p>
                            {opt.price_modifier !== 0 && (
                                <p className="text-[10px] text-slate-400">+₾{opt.price_modifier}</p>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(opt.id)}>
                            <X className="w-3 h-3 text-slate-400" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Upload form */}
            {creating && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <FormField label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                        <FormField label="Slug" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} />
                        <FormField label="Price modifier (₾)" value={form.price_modifier} onChange={v => setForm(f => ({ ...f, price_modifier: v }))} type="number" />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
                        Mark as default
                    </label>
                    {/* Drag-drop file area */}
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 transition-colors"
                    >
                        {file ? (
                            <p className="text-xs text-slate-700 font-medium">{file.name}</p>
                        ) : (
                            <>
                                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                                <p className="text-xs text-slate-500">Click to upload PNG or SVG</p>
                            </>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".png,.svg"
                            className="hidden"
                            onChange={e => setFile(e.target.files?.[0] ?? null)}
                        />
                    </div>
                    {/* Preview against checkered bg */}
                    {file && (
                        <div
                            className="w-16 h-16 rounded mx-auto"
                            style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #e2e8f0 0% 50%)', backgroundSize: '8px 8px' }}
                        >
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
                        <Button variant="default" size="sm" onClick={handleCreate} disabled={saving || !file}>
                            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Upload
                        </Button>
                    </div>
                </div>
            )}
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
