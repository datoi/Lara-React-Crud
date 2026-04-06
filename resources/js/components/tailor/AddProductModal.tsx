import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Loader2, Check, ImagePlus } from 'lucide-react';
import { getAuthToken } from '../../hooks/useAuth';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: 1, name: 'Dresses' },
    { id: 2, name: 'Shirts' },
    { id: 3, name: 'Pants' },
    { id: 4, name: 'Jackets' },
    { id: 5, name: 'Scarves' },
    { id: 6, name: 'Hats' },
];

const FABRICS = ['Cotton', 'Silk', 'Linen', 'Wool', 'Denim', 'Velvet', 'Chiffon', 'Satin', 'Polyester'];
const TEXTURES = ['Smooth', 'Ribbed', 'Knit', 'Woven', 'Embroidered', 'Quilted', 'Pleated'];
const SIZES    = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

const MEASUREMENTS = [
    { key: 'chest',              label: 'Chest' },
    { key: 'waist',              label: 'Waist' },
    { key: 'hips',               label: 'Hips' },
    { key: 'length',             label: 'Length' },
    { key: 'inseam',             label: 'Inseam' },
    { key: 'shoulder',           label: 'Shoulder' },
    { key: 'head_circumference', label: 'Head Circumference' },
    { key: 'sleeve',             label: 'Sleeve Length' },
];

const PRESET_COLORS = [
    '#1E293B', '#475569', '#94A3B8', '#FFFFFF',
    '#DC2626', '#EA580C', '#EAB308', '#16A34A',
    '#2563EB', '#7C3AED', '#DB2777', '#000000',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
    return <p className="text-sm font-semibold text-slate-700 mb-2">{children}</p>;
}

function inputCls(extra = '') {
    return `w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition ${extra}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AddProductModalProps {
    onClose: () => void;
    onCreated: (product: TailorProductFull) => void;
}

export interface TailorProductFull {
    id: number;
    name: string;
    category: string;
    category_id: number;
    price: number;
    description: string | null;
    images: string[];
    colors: string[];
    sizes: string[];
    fabric: string | null;
    texture: string | null;
    required_measurements: string[];
    is_customizable: boolean;
    orders: number;
    status: 'active' | 'paused';
}

interface FormState {
    name: string;
    description: string;
    price: string;
    category_id: number;
    uploading: boolean;
    images: string[];
    colors: string[];
    customColor: string;
    sizes: string[];
    fabric: string;
    texture: string;
    required_measurements: string[];
    is_customizable: boolean;
}

const INITIAL: FormState = {
    name: '',
    description: '',
    price: '',
    category_id: 1,
    uploading: false,
    images: [],
    colors: [],
    customColor: '#475569',
    sizes: [],
    fabric: '',
    texture: '',
    required_measurements: [],
    is_customizable: true,
};

export function AddProductModal({ onClose, onCreated }: AddProductModalProps) {
    const [form, setForm]       = useState<FormState>(INITIAL);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const set = (key: keyof FormState, value: unknown) =>
        setForm(f => ({ ...f, [key]: value }));

    // ─── File upload helper ────────────────────────────────────────────────

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const token = getAuthToken();
        if (!token) { setError('You must be signed in.'); return; }

        set('uploading', true);
        setError('');
        try {
            const uploaded: string[] = [];
            for (const file of files) {
                const fd = new FormData();
                fd.append('image', file);
                const res = await fetch('/api/upload/image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                    body: fd,
                });
                const json = await res.json();
                if (res.ok && json.url) uploaded.push(json.url);
                else setError(json.message ?? 'Upload failed for one file.');
            }
            set('images', [...form.images, ...uploaded]);
        } catch {
            setError('Network error during upload.');
        } finally {
            set('uploading', false);
            // Reset so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (url: string) =>
        set('images', form.images.filter((i: string) => i !== url));

    // ─── Color helpers ─────────────────────────────────────────────────────

    const togglePresetColor = (hex: string) => {
        set('colors', form.colors.includes(hex)
            ? form.colors.filter(c => c !== hex)
            : [...form.colors, hex]);
    };

    const addCustomColor = () => {
        const hex = form.customColor.trim();
        if (hex && !form.colors.includes(hex)) {
            set('colors', [...form.colors, hex]);
        }
    };

    const removeColor = (hex: string) =>
        set('colors', form.colors.filter(c => c !== hex));

    // ─── Size helpers ──────────────────────────────────────────────────────

    const toggleSize = (s: string) => {
        set('sizes', form.sizes.includes(s)
            ? form.sizes.filter(x => x !== s)
            : [...form.sizes, s]);
    };

    // ─── Measurement helpers ───────────────────────────────────────────────

    const toggleMeasurement = (key: string) => {
        set('required_measurements', form.required_measurements.includes(key)
            ? form.required_measurements.filter(m => m !== key)
            : [...form.required_measurements, key]);
    };

    // ─── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.price) {
            setError('Product name and price are required.');
            return;
        }
        const token = getAuthToken();
        if (!token) { setError('You must be signed in.'); return; }

        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/tailor/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    name:                  form.name,
                    description:           form.description || null,
                    price:                 parseFloat(form.price),
                    category_id:           form.category_id,
                    images:                form.images,
                    colors:                form.colors,
                    sizes:                 form.sizes,
                    fabric:                form.fabric || null,
                    texture:               form.texture || null,
                    required_measurements: form.required_measurements,
                    is_customizable:       form.is_customizable,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                setError(json.message ?? 'Something went wrong.');
                return;
            }
            setSuccess(true);
            setTimeout(() => {
                onCreated(json.product as TailorProductFull);
                onClose();
            }, 1200);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
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

            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg">Add New Product</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Fill in the details to list your item on the marketplace</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Success state */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-20 bg-white rounded-2xl flex flex-col items-center justify-center gap-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                            >
                                <Check className="w-8 h-8 text-green-600" />
                            </motion.div>
                            <p className="font-bold text-slate-900">Product Published!</p>
                            <p className="text-sm text-slate-500">Your listing is now live on the marketplace.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                    {/* ── Core Info ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Core Info</p>

                        <div>
                            <Label>Product Name *</Label>
                            <input
                                className={inputCls()}
                                placeholder="e.g. Floral Wrap Dress"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Price (₾) *</Label>
                                <input
                                    type="number"
                                    min="1"
                                    className={inputCls()}
                                    placeholder="0"
                                    value={form.price}
                                    onChange={e => set('price', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Category</Label>
                                <select
                                    className={inputCls('bg-white')}
                                    value={form.category_id}
                                    onChange={e => set('category_id', Number(e.target.value))}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <textarea
                                rows={3}
                                className={inputCls('resize-none')}
                                placeholder="Describe the style, fit, and occasion…"
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Product Images ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Product Images</p>

                        {/* Hidden file input — supports multiple */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Drop zone / click to browse */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={form.uploading}
                            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-8 hover:border-slate-900 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {form.uploading ? (
                                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                            ) : (
                                <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-slate-700 transition-colors" />
                            )}
                            <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors font-medium">
                                {form.uploading ? 'Uploading…' : 'Click to browse files'}
                            </span>
                            <span className="text-xs text-slate-400">JPG, PNG, WEBP — max 5 MB each</span>
                        </button>

                        {/* Uploaded previews */}
                        {form.images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {(form.images as string[]).map(url => (
                                    <div key={url} className="relative group">
                                        <img
                                            src={url}
                                            alt=""
                                            className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                                        />
                                        <button
                                            onClick={() => removeImage(url)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Technical Specs ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Technical Specs</p>

                        {/* Fabric + Texture */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Fabric Type</Label>
                                <select
                                    className={inputCls('bg-white')}
                                    value={form.fabric}
                                    onChange={e => set('fabric', e.target.value)}
                                >
                                    <option value="">— Select —</option>
                                    {FABRICS.map(f => <option key={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Texture / Material</Label>
                                <select
                                    className={inputCls('bg-white')}
                                    value={form.texture}
                                    onChange={e => set('texture', e.target.value)}
                                >
                                    <option value="">— Select —</option>
                                    {TEXTURES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Available Colors */}
                        <div>
                            <Label>Available Colors</Label>
                            {/* Preset swatches */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PRESET_COLORS.map(hex => (
                                    <button
                                        key={hex}
                                        onClick={() => togglePresetColor(hex)}
                                        title={hex}
                                        className="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: hex,
                                            borderColor: form.colors.includes(hex) ? '#0F172A' : '#E2E8F0',
                                            boxShadow: form.colors.includes(hex) ? '0 0 0 2px white, 0 0 0 4px #0F172A' : undefined,
                                        }}
                                    >
                                        {form.colors.includes(hex) && (
                                            <Check
                                                className="absolute inset-0 m-auto w-3.5 h-3.5"
                                                style={{ color: hex === '#FFFFFF' ? '#1a1a1a' : 'white' }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {/* Custom color picker */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={form.customColor}
                                    onChange={e => set('customColor', e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                />
                                <input
                                    className={inputCls('flex-1 font-mono text-xs')}
                                    value={form.customColor}
                                    onChange={e => set('customColor', e.target.value)}
                                    placeholder="#000000"
                                />
                                <button
                                    onClick={addCustomColor}
                                    className="flex items-center gap-1 border border-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                            </div>
                            {/* Selected colors */}
                            {form.colors.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {form.colors.map(hex => (
                                        <div key={hex} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-1.5 pr-2.5 py-1">
                                            <div className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: hex }} />
                                            <span className="text-xs font-mono text-slate-600">{hex}</span>
                                            <button onClick={() => removeColor(hex)} className="ml-1">
                                                <X className="w-3 h-3 text-slate-400 hover:text-red-500 transition-colors" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Available Sizes */}
                        <div>
                            <Label>Available Sizes</Label>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleSize(s)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                            form.sizes.includes(s)
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Measurement Requirements ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Measurement Requirements</p>
                            <p className="text-xs text-slate-400 mt-1">Select which CM measurements customers must provide for this item</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {MEASUREMENTS.map(m => {
                                const active = form.required_measurements.includes(m.key);
                                return (
                                    <button
                                        key={m.key}
                                        onClick={() => toggleMeasurement(m.key)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                                            active
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                            active ? 'bg-white border-white' : 'border-slate-300'
                                        }`}>
                                            {active && <Check className="w-2.5 h-2.5 text-slate-900" />}
                                        </div>
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Customizable Toggle ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Allow Customization</p>
                                <p className="text-xs text-slate-400 mt-0.5">Customers can request style changes, not just size</p>
                            </div>
                            <button
                                onClick={() => set('is_customizable', !form.is_customizable)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                    form.is_customizable ? 'bg-slate-900' : 'bg-slate-300'
                                }`}
                            >
                                <motion.div
                                    animate={{ x: form.is_customizable ? 24 : 2 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
                    {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 bg-slate-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                                : 'Publish Product'
                            }
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
