import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Loader2, Check, ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { getAuthToken } from '../../hooks/useAuth';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_KEYS = [
    { id: 1, tKey: 'tailorComponents.catDresses' },
    { id: 2, tKey: 'tailorComponents.catShirts' },
    { id: 3, tKey: 'tailorComponents.catPants' },
    { id: 4, tKey: 'tailorComponents.catJackets' },
    { id: 5, tKey: 'tailorComponents.catScarves' },
    { id: 6, tKey: 'tailorComponents.catHats' },
];

const FABRIC_KEYS = [
    { key: 'Cotton',    tKey: 'tailorComponents.fabricCotton' },
    { key: 'Silk',      tKey: 'tailorComponents.fabricSilk' },
    { key: 'Linen',     tKey: 'tailorComponents.fabricLinen' },
    { key: 'Wool',      tKey: 'tailorComponents.fabricWool' },
    { key: 'Denim',     tKey: 'tailorComponents.fabricDenim' },
    { key: 'Velvet',    tKey: 'tailorComponents.fabricVelvet' },
    { key: 'Chiffon',   tKey: 'tailorComponents.fabricChiffon' },
    { key: 'Satin',     tKey: 'tailorComponents.fabricSatin' },
    { key: 'Polyester', tKey: 'tailorComponents.fabricPolyester' },
];

const TEXTURE_KEYS = [
    { key: 'Smooth',      tKey: 'tailorComponents.texturSmooth' },
    { key: 'Ribbed',      tKey: 'tailorComponents.texturRibbed' },
    { key: 'Knit',        tKey: 'tailorComponents.texturKnit' },
    { key: 'Woven',       tKey: 'tailorComponents.texturWoven' },
    { key: 'Embroidered', tKey: 'tailorComponents.texturEmbroidered' },
    { key: 'Quilted',     tKey: 'tailorComponents.texturQuilted' },
    { key: 'Pleated',     tKey: 'tailorComponents.texturPleated' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

type ProductGender = 'men' | 'women' | 'unisex';

const GENDER_KEYS: { key: ProductGender; tKey: string }[] = [
    { key: 'women',  tKey: 'section.women' },
    { key: 'men',    tKey: 'section.men' },
    { key: 'unisex', tKey: 'tailorComponents.genderBoth' },
];

const MEASUREMENT_KEYS = [
    { key: 'chest',              tKey: 'tailorComponents.measureChest' },
    { key: 'waist',              tKey: 'tailorComponents.measureWaist' },
    { key: 'hips',               tKey: 'tailorComponents.measureHips' },
    { key: 'length',             tKey: 'tailorComponents.measureLength' },
    { key: 'inseam',             tKey: 'tailorComponents.measureInseam' },
    { key: 'shoulder',           tKey: 'tailorComponents.measureShoulder' },
    { key: 'head_circumference', tKey: 'tailorComponents.measureHead' },
    { key: 'sleeve',             tKey: 'tailorComponents.measureSleeve' },
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TailorProductFull {
    id: number;
    name: string;
    category: string;
    category_id: number;
    gender: ProductGender;
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
    gender: ProductGender;
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

const BLANK: FormState = {
    name: '',
    description: '',
    price: '',
    category_id: 1,
    gender: 'unisex',
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

function productToForm(p: TailorProductFull): FormState {
    return {
        name: p.name,
        description: p.description ?? '',
        price: String(p.price),
        category_id: p.category_id,
        gender: p.gender ?? 'unisex',
        uploading: false,
        images: [...p.images],
        colors: [...p.colors],
        customColor: '#475569',
        sizes: [...p.sizes],
        fabric: p.fabric ?? '',
        texture: p.texture ?? '',
        required_measurements: [...p.required_measurements],
        is_customizable: p.is_customizable,
    };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AddProductModalProps {
    onClose: () => void;
    onCreated: (product: TailorProductFull) => void;
    editProduct?: TailorProductFull;
    onUpdated?: (product: TailorProductFull) => void;
}

export function AddProductModal({ onClose, onCreated, editProduct, onUpdated }: AddProductModalProps) {
    const { t } = useTranslation();
    const isEdit = !!editProduct;
    const [form, setForm]       = useState<FormState>(() => editProduct ? productToForm(editProduct) : BLANK);
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
        if (!token) { setError(t('tailorComponents.mustBeSignedIn')); return; }

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
                else setError(json.message ?? t('tailorComponents.networkErrorUpload'));
            }
            // functional updater avoids stale closure on form.images
            setForm(f => ({ ...f, images: [...f.images, ...uploaded] }));
        } catch {
            setError(t('tailorComponents.networkErrorUpload'));
        } finally {
            set('uploading', false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (url: string) =>
        setForm(f => ({ ...f, images: f.images.filter((i: string) => i !== url) }));

    // ─── Color helpers ─────────────────────────────────────────────────────

    const togglePresetColor = (hex: string) => {
        setForm(f => ({
            ...f,
            colors: f.colors.includes(hex) ? f.colors.filter(c => c !== hex) : [...f.colors, hex],
        }));
    };

    const addCustomColor = () => {
        const hex = form.customColor.trim();
        if (hex && !form.colors.includes(hex)) {
            set('colors', [...form.colors, hex]);
        }
    };

    const removeColor = (hex: string) =>
        setForm(f => ({ ...f, colors: f.colors.filter(c => c !== hex) }));

    // ─── Size helpers ──────────────────────────────────────────────────────

    const toggleSize = (s: string) => {
        setForm(f => ({
            ...f,
            sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
        }));
    };

    // ─── Measurement helpers ───────────────────────────────────────────────

    const toggleMeasurement = (key: string) => {
        setForm(f => ({
            ...f,
            required_measurements: f.required_measurements.includes(key)
                ? f.required_measurements.filter(m => m !== key)
                : [...f.required_measurements, key],
        }));
    };

    // ─── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.price) {
            setError(t('tailorComponents.nameAndPriceRequired'));
            return;
        }
        const token = getAuthToken();
        if (!token) { setError(t('tailorComponents.mustBeSignedIn')); return; }

        setSaving(true);
        setError('');
        try {
            const url    = isEdit ? `/api/tailor/products/${editProduct!.id}` : '/api/tailor/products';
            const method = isEdit ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
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
                    gender:                form.gender,
                    images:                form.images,
                    colors:                form.colors,
                    sizes:                 form.is_customizable ? form.sizes : [],
                    fabric:                form.fabric || null,
                    texture:               form.texture || null,
                    required_measurements: form.required_measurements,
                    is_customizable:       form.is_customizable,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                setError(json.message ?? t('tailorComponents.networkError'));
                return;
            }
            setSuccess(true);
            setTimeout(() => {
                if (isEdit) {
                    onUpdated?.(json.product as TailorProductFull);
                } else {
                    onCreated(json.product as TailorProductFull);
                }
                onClose();
            }, 1200);
        } catch {
            setError(t('tailorComponents.networkError'));
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
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg">
                            {isEdit ? t('tailorComponents.editProduct') : t('tailorComponents.addNewProduct')}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">{t('tailorComponents.addNewProductSubtitle')}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-4 h-4" />
                    </Button>
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
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center"
                            >
                                <Check className="w-8 h-8 text-white" />
                            </motion.div>
                            <p className="font-bold text-slate-900">
                                {isEdit ? t('tailorComponents.productUpdated') : t('tailorComponents.productPublished')}
                            </p>
                            <p className="text-sm text-slate-500">
                                {isEdit ? t('tailorComponents.productUpdatedDesc') : t('tailorComponents.productPublishedDesc')}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                    {/* ── Core Info ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {t('tailorComponents.coreInfo')}
                        </p>

                        <div>
                            <Label>{t('tailorComponents.productName')}</Label>
                            <input
                                className={inputCls()}
                                placeholder={t('tailorComponents.productNamePlaceholder')}
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>{t('tailorComponents.priceLabel')}</Label>
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
                                <Label>{t('tailorComponents.categoryLabel')}</Label>
                                <select
                                    className={inputCls('bg-white')}
                                    value={form.category_id}
                                    onChange={e => set('category_id', Number(e.target.value))}
                                >
                                    {CATEGORY_KEYS.map(c => (
                                        <option key={c.id} value={c.id}>{t(c.tKey)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>{t('tailorComponents.genderLabel')}</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {GENDER_KEYS.map(g => (
                                    <button
                                        key={g.key}
                                        type="button"
                                        onClick={() => set('gender', g.key)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                            form.gender === g.key
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'
                                        }`}
                                    >
                                        {t(g.tKey)}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">{t('tailorComponents.genderHint')}</p>
                        </div>

                        <div>
                            <Label>{t('tailorComponents.descriptionLabel')}</Label>
                            <textarea
                                rows={3}
                                className={inputCls('resize-none')}
                                placeholder={t('tailorComponents.descriptionPlaceholder')}
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Product Images ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {t('tailorComponents.productImages')}
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />

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
                                {form.uploading ? t('tailorComponents.uploadingImages') : t('tailorComponents.clickToBrowse')}
                            </span>
                            <span className="text-xs text-slate-400">{t('tailorComponents.imageUploadHint')}</span>
                        </button>

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
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {t('tailorComponents.technicalSpecs')}
                        </p>

                        {/* Fabric + Texture */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>{t('tailorComponents.fabricType')}</Label>
                                <select
                                    className={inputCls('bg-white')}
                                    value={form.fabric}
                                    onChange={e => set('fabric', e.target.value)}
                                >
                                    <option value="">{t('tailorComponents.selectPlaceholder')}</option>
                                    {FABRIC_KEYS.map(f => (
                                        <option key={f.key} value={f.key}>{t(f.tKey)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>{t('tailorComponents.textureMaterial')}</Label>
                                <select
                                    className={inputCls('bg-white')}
                                    value={form.texture}
                                    onChange={e => set('texture', e.target.value)}
                                >
                                    <option value="">{t('tailorComponents.selectPlaceholder')}</option>
                                    {TEXTURE_KEYS.map(tx => (
                                        <option key={tx.key} value={tx.key}>{t(tx.tKey)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Available Colors */}
                        <div>
                            <Label>{t('tailorComponents.availableColors')}</Label>
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addCustomColor}
                                    className="flex-shrink-0 flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {t('tailorComponents.addColorBtn')}
                                </Button>
                            </div>
                            {form.colors.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {form.colors.map(hex => (
                                        <div key={hex} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-1.5 pr-2.5 py-1">
                                            <div className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: hex }} />
                                            <span className="text-xs font-mono text-slate-600">{hex}</span>
                                            <button onClick={() => removeColor(hex)} className="ml-1">
                                                <X className="w-3 h-3 text-slate-400 hover:text-slate-700 transition-colors" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* ── Measurement Requirements ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                {t('tailorComponents.measurementReqs')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{t('tailorComponents.measurementReqsDesc')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {MEASUREMENT_KEYS.map(m => {
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
                                        {t(m.tKey)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Customizable Toggle + Available Sizes ── */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{t('tailorComponents.allowCustomization')}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{t('tailorComponents.allowCustomizationDesc')}</p>
                            </div>
                            <button
                                onClick={() => set('is_customizable', !form.is_customizable)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                    form.is_customizable ? 'bg-slate-900' : 'bg-slate-300'
                                }`}
                            >
                                <motion.div
                                    initial={{ x: form.is_customizable ? 24 : 2 }}
                                    animate={{ x: form.is_customizable ? 24 : 2 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                />
                            </button>
                        </div>

                        {/* Available Sizes — only for individual (customizable) orders */}
                        {form.is_customizable && (
                            <div className="pt-4 border-t border-slate-200">
                                <Label>{t('tailorComponents.availableSizes')}</Label>
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
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
                    {error && <p className="text-xs text-destructive mb-3">{error}</p>}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="default"
                            onClick={onClose}
                            className="flex-1"
                        >
                            {t('tailorComponents.cancelBtn')}
                        </Button>
                        <Button
                            variant="default"
                            size="default"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            {saving
                                ? <><Loader2 className="w-4 h-4 animate-spin" />
                                    {isEdit ? t('tailorComponents.updatingProduct') : t('tailorComponents.publishingProduct')}</>
                                : isEdit ? t('tailorComponents.updateProduct') : t('tailorComponents.publishProduct')
                            }
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
