import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2, Upload, X, FileText } from 'lucide-react';
import { getAuthUser, getAuthToken, saveReturnTo } from '../hooks/useAuth';
import { getSection, setSection, type Section, type SectionScope } from '../hooks/useSection';
import { saveDraft } from '../hooks/useCustomOrderDraft';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';

// ─── Garment categories ───────────────────────────────────────────────────────

const CATEGORY_KEYS = [
    { key: 'shirt',    tKey: 'design.cat_shirt',    emoji: '👔' },
    { key: 'dress',    tKey: 'design.cat_dress',    emoji: '👗' },
    { key: 'trousers', tKey: 'design.cat_trousers', emoji: '👖' },
    { key: 'jacket',   tKey: 'design.cat_jacket',   emoji: '🧥' },
    { key: 'skirt',    tKey: 'design.cat_skirt',    emoji: '🩱' },
    { key: 'coat',     tKey: 'design.cat_coat',     emoji: '🧤' },
];

// Garment types that only belong in the women's section — never shown for men.
const WOMEN_ONLY_CATEGORIES = new Set(['dress', 'skirt']);

const CATEGORY_VISUALS: Record<string, { image: string; note: string; rotation: string; position: string; offset?: string }> = {
    shirt: {
        image: '/assets/design-categories/shirt-cutout.png',
        note: 'Top',
        rotation: '-rotate-[2deg]',
        position: 'md:col-span-4',
    },
    dress: {
        image: '/assets/design-categories/dress-cutout.png',
        note: 'Dress',
        rotation: 'rotate-[1.5deg]',
        position: 'md:col-span-4',
        offset: 'md:translate-y-7',
    },
    trousers: {
        image: '/assets/design-categories/trousers-cutout.png',
        note: 'Pants',
        rotation: '-rotate-[1deg]',
        position: 'md:col-span-4',
    },
    jacket: {
        image: '/assets/design-categories/jacket-cutout.png',
        note: 'Jacket',
        rotation: 'rotate-[1.5deg]',
        position: 'md:col-span-4',
        offset: 'md:-translate-y-5',
    },
    skirt: {
        image: '/assets/design-categories/skirt-cutout.png',
        note: 'Skirt',
        rotation: '-rotate-[2deg]',
        position: 'md:col-span-4',
    },
    coat: {
        image: '/assets/design-categories/coat-cutout.png',
        note: 'Coat',
        rotation: 'rotate-[1deg]',
        position: 'md:col-span-4',
        offset: 'md:translate-y-4',
    },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Flow state ───────────────────────────────────────────────────────────────

type FlowState =
    | { step: 'category' }
    | { step: 'design';       category: string }
    | { step: 'upload-type' }
    | { step: 'upload-file';  category: string };

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string;
    base_price: number;
    preview_image_url: string | null;
}

// ─── Step: Category picker ────────────────────────────────────────────────────

function CategoryStep({
    gender,
    onSelectDesign,
    onSelectUpload,
}: {
    gender: Section;
    onSelectDesign: (key: string) => void;
    onSelectUpload: () => void;
}) {
    const { t } = useTranslation();
    const categories = gender === 'men'
        ? CATEGORY_KEYS.filter(c => !WOMEN_ONLY_CATEGORIES.has(c.key))
        : CATEGORY_KEYS;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-[760px]"
        >
            <div className="mx-auto mb-6 max-w-[620px] text-center">
                <h1 className="mt-3 font-serif text-[clamp(2.15rem,4vw,3.7rem)] font-medium leading-[0.92] tracking-[-0.05em] text-[#111111]">
                    {t('design.categoryTitle')}
                </h1>
                <p className="mx-auto mt-3 max-w-[520px] text-sm leading-6 text-[#776158]">
                    {t('design.categorySubtitle')}
                </p>
            </div>

            <motion.button
                onClick={onSelectUpload}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: categories.length * 0.07 }}
                className="group relative mx-auto mb-8 block w-full max-w-[300px] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F1D24] focus-visible:ring-offset-4 focus-visible:ring-offset-[#E4E0D7] sm:max-w-[340px] lg:rotate-[1deg]"
            >
                <span className="pointer-events-none absolute -top-2 left-1/2 z-20 h-4 w-16 -translate-x-1/2 rotate-[2deg] bg-white/60 shadow-sm" />
                <article className="border border-[#8A6A2B]/45 bg-[url('/assets/design-categories/gold-upload-bg.png')] bg-cover bg-center px-4 py-4 text-center text-white shadow-[0_12px_28px_rgba(88,68,29,0.18)] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[-1deg]">
                    <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-black/10 text-white">
                        <Upload className="h-3.5 w-3.5 stroke-[1.4]" />
                    </span>
                    <h2 className="mt-3 font-serif text-xl font-medium tracking-[-0.035em]">
                        {t('design.uploadMyDesign')}
                    </h2>
                </article>
            </motion.button>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 lg:gap-5">
                {categories.map((cat, i) => (
                    <motion.button
                        key={cat.key}
                        onClick={() => onSelectDesign(cat.key)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-4 focus-visible:ring-offset-[#E4E0D7]"
                    >
                        <article className="transition-transform duration-500 group-hover:-translate-y-1">
                            <p className="mb-2 text-[10px] font-semibold leading-none tracking-[-0.02em] text-[#111111] sm:text-[11px]">
                                {t(cat.tKey)}
                            </p>

                            <div className="flex h-[132px] items-center justify-center border border-[#111111]/45 bg-[#E4E0D7] p-3 sm:h-[156px] sm:p-4 lg:h-[178px]">
                                <img
                                    src={CATEGORY_VISUALS[cat.key]?.image}
                                    alt={t(cat.tKey)}
                                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.035]"
                                />
                            </div>
                        </article>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Step: Pick garment type for upload ───────────────────────────────────────

function UploadTypeStep({
    gender,
    onSelect,
    onBack,
}: {
    gender: Section;
    onSelect: (key: string) => void;
    onBack: () => void;
}) {
    const { t } = useTranslation();
    const uploadCategories = CATEGORY_KEYS.filter(cat => gender !== 'men' || !['dress', 'skirt'].includes(cat.key));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-[760px]"
        >
            <button
                onClick={onBack}
                className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#776158] transition-opacity hover:opacity-60"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('design.back')}
            </button>

            <div className="mx-auto mb-8 max-w-[620px] text-center">
                <h1 className="font-serif text-[clamp(2.05rem,4vw,3.45rem)] font-medium leading-[0.92] tracking-[-0.05em] text-[#111111]">
                    {t('design.uploadTypeTitle')}
                </h1>
                <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-[#776158]">
                    {t('design.uploadTypeSubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
                {uploadCategories.map((cat, i) => (
                    <motion.button
                        key={cat.key}
                        onClick={() => onSelect(cat.key)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        className="group relative block text-left transition-transform duration-500 hover:z-10 hover:-translate-y-2 hover:scale-[1.045] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-4 focus-visible:ring-offset-[#E4E0D7]"
                    >
                        <article className="transition-shadow duration-500 group-hover:shadow-[0_18px_40px_rgba(17,17,17,0.14)]">
                            <div className="mb-2 flex items-start justify-between gap-3">
                                <p className="text-[10px] font-semibold leading-none tracking-[-0.02em] text-[#111111] sm:text-[11px]">
                                    {t(cat.tKey)}
                                </p>
                            </div>

                            {gender === 'women' ? (
                                <div className="flex h-[132px] items-center justify-center border border-[#111111]/45 bg-[#E4E0D7] p-3 sm:h-[156px] sm:p-4 lg:h-[178px]">
                                    <img
                                        src={CATEGORY_VISUALS[cat.key]?.image}
                                        alt={t(cat.tKey)}
                                        className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.03]"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-[112px] items-end border border-[#111111]/45 bg-[#E4E0D7] p-4 sm:h-[132px] sm:p-5 lg:h-[150px]">
                                    <p className="font-serif text-[clamp(1.35rem,3vw,2rem)] font-medium leading-[0.95] tracking-[-0.04em] text-[#111111]">
                                        {t(cat.tKey)}
                                    </p>
                                </div>
                            )}
                        </article>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Step: Upload panel ───────────────────────────────────────────────────────

export interface UploadResult {
    fileUrl: string;
    measurements: Record<string, string>;
    customizationRequest: string;
    notes: string;
}

const MEASUREMENT_FIELDS = [
    { key: 'chest',  tKey: 'design.sizeChest' },
    { key: 'waist',  tKey: 'design.sizeWaist' },
    { key: 'hips',   tKey: 'design.sizeHips' },
    { key: 'length', tKey: 'design.sizeLength' },
];

function UploadPanel({
    category,
    onContinue,
    onBack,
}: {
    category: string;
    onContinue: (result: UploadResult) => void;
    onBack: () => void;
}) {
    const { t } = useTranslation();
    const [fileUrl,     setFileUrl]     = useState<string | null>(null);
    const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
    const [fileName,    setFileName]    = useState<string | null>(null);
    const [measurements, setMeasurements] = useState<Record<string, string>>({});
    const [wantsCustomization, setWantsCustomization] = useState(false);
    const [customizationRequest, setCustomizationRequest] = useState('');
    const [notes,       setNotes]       = useState('');
    const [uploading,   setUploading]   = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const setMeasurement = (key: string, value: string) => {
        // Digits with optional decimal, capped at 3 integer digits — matches backend max:999
        if (value !== '' && !/^\d{1,3}(\.\d{0,1})?$/.test(value)) return;
        setMeasurements(prev => ({ ...prev, [key]: value }));
    };

    const catEntry = CATEGORY_KEYS.find(c => c.key === category);
    const catLabel = catEntry ? t(catEntry.tKey) : category;

    const handleFile = async (file: File) => {
        setUploadError(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setUploadError(t('design.errorFileType'));
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setUploadError(t('design.errorFileSize'));
            return;
        }

        if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
        setFileName(file.name);

        const authToken = getAuthToken();
        if (!authToken) {
            return;
        }

        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/uploads', {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
                body: form,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as { message?: string }).message ?? t('design.errorUploadFailed'));
            }
            const data = await res.json() as { file_url: string };
            setFileUrl(data.file_url);
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : t('design.errorUploadFailed'));
            setFileUrl(null);
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        setFileUrl(null);
        setPreviewUrl(null);
        setFileName(null);
        setUploadError(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const canContinue = (fileUrl !== null || fileName !== null) && !uploading;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-[760px]"
        >
            <button
                onClick={onBack}
                className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#776158] transition-opacity hover:opacity-60"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('design.back')}
            </button>

            <div className="mx-auto mb-8 max-w-[620px] text-center">
                <h1 className="font-serif text-[clamp(2.05rem,4vw,3.45rem)] font-medium leading-[0.92] tracking-[-0.05em] text-[#111111]">
                    {t('design.uploadTitle')}
                </h1>
                <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-[#776158]">
                    {t('design.uploadGarmentType')} <span className="font-medium text-[#111111]">{catLabel}</span>
                </p>
            </div>

            <div className="space-y-5">
                {/* Drop zone */}
                <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleFile(file);
                    }}
                    className="cursor-pointer border border-dashed border-[#111111]/45 bg-[#E4E0D7] p-10 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.12)]"
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.svg"
                        className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                        }}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-[#111111]/55" />
                            <p className="text-sm text-[#776158]">{t('design.uploading')}</p>
                        </div>
                    ) : fileName ? (
                        <div className="flex flex-col items-center gap-3">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Design preview" className="max-h-40 object-contain border border-[#111111]/20" />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center border border-[#111111]/20 bg-[#E4E0D7]">
                                    <FileText className="h-6 w-6 text-[#111111]/45" />
                                </div>
                            )}
                            <p className="max-w-xs truncate text-sm font-medium text-[#261D1B]">{fileName}</p>
                            {fileUrl && <p className="text-xs text-[#111111]">{t('design.uploadedSuccess')}</p>}
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); clearFile(); }}
                                className="flex items-center gap-1 text-xs text-[#776158] hover:text-[#111111]"
                            >
                                <X className="w-3 h-3" /> {t('design.remove')}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center border border-[#111111]/25 bg-[#E4E0D7]">
                                <Upload className="h-6 w-6 text-[#111111]/50" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[#261D1B]">{t('design.dropZoneLabel')}</p>
                                <p className="mt-1 text-xs text-[#92615E]">{t('design.dropZoneFormats')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {uploadError && (
                    <p className="border border-[#6F1D24]/15 bg-[#FDFBF5] px-4 py-2.5 text-sm text-[#6F1D24]">
                        {uploadError}
                    </p>
                )}

                {/* Measurements */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#261D1B]">
                        {t('design.sizesLabel')} <span className="font-normal text-[#776158]">{t('design.notesOptional')}</span>
                    </label>
                    <p className="mb-3 text-xs text-[#776158]">{t('design.sizesHint')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {MEASUREMENT_FIELDS.map(field => (
                            <div key={field.key}>
                                <label className="mb-1 block text-xs text-[#776158]">{t(field.tKey)}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={measurements[field.key] ?? ''}
                                        onChange={e => setMeasurement(field.key, e.target.value)}
                                        placeholder="—"
                                        className="w-full border border-[#111111]/25 bg-[#E4E0D7] py-2.5 pl-3 pr-9 text-sm text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#776158]">{t('design.cmUnit')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customization request */}
                <div>
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={wantsCustomization}
                            onChange={e => setWantsCustomization(e.target.checked)}
                            className="mt-0.5 h-4 w-4 cursor-pointer border-[#111111]/35 bg-[#E4E0D7] accent-[#111111]"
                        />
                        <span>
                            <span className="block text-sm font-medium text-[#261D1B]">{t('design.customizeLabel')}</span>
                            <span className="mt-0.5 block text-xs text-[#776158]">{t('design.customizeHint')}</span>
                        </span>
                    </label>
                    {wantsCustomization && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mt-3"
                        >
                            <textarea
                                value={customizationRequest}
                                onChange={e => setCustomizationRequest(e.target.value.slice(0, 1000))}
                                placeholder={t('design.customizePlaceholder')}
                                rows={4}
                                maxLength={1000}
                                className="w-full resize-none border border-[#111111]/25 bg-[#E4E0D7] px-4 py-3 text-sm text-[#111111] placeholder:text-[#776158] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                            />
                            <p className={`mt-1 text-right text-xs ${customizationRequest.length > 900 ? 'text-[#111111]' : 'text-[#776158]'}`}>{customizationRequest.length} / 1000</p>
                        </motion.div>
                    )}
                </div>

                {/* Additional information */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#261D1B]">
                        {t('design.notesLabel')} <span className="font-normal text-[#776158]">{t('design.notesOptional')}</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value.slice(0, 500))}
                        placeholder={t('design.notesPlaceholder')}
                        rows={2}
                        maxLength={500}
                        className="w-full resize-none border border-[#111111]/25 bg-[#E4E0D7] px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#776158] focus:outline-none focus:ring-2 focus:ring-[#111111]"
                    />
                    <p className={`mt-1 text-right text-xs ${notes.length > 450 ? 'text-[#111111]' : 'text-[#776158]'}`}>{notes.length} / 500</p>
                </div>

                <Button
                    variant="default"
                    disabled={!canContinue}
                    onClick={() => onContinue({
                        fileUrl: fileUrl ?? '',
                        measurements,
                        customizationRequest: wantsCustomization ? customizationRequest : '',
                        notes,
                    })}
                    className="w-full rounded-none bg-[#111111] text-white hover:bg-[#333333]"
                >
                    {t('design.continueToTailor')}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
            </div>
        </motion.div>
    );
}

// ─── Step: Product list for designer path ─────────────────────────────────────

function ProductStep({
    category,
    gender,
    onBack,
}: {
    category: string;
    gender: Section;
    onBack: () => void;
}) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);

    const catEntry = CATEGORY_KEYS.find(c => c.key === category);
    const catLabel = catEntry ? t(catEntry.tKey) : category;

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/customizer/products?gender=${gender}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                const all: Product[] = (data as { products?: Product[] }).products ?? [];
                setProducts(all.filter(p => p.category === category));
            })
            .catch(err => setError((err as Error).message ?? 'Failed to load products.'))
            .finally(() => setLoading(false));
    }, [category, gender]);

    const handleProductClick = (product: Product) => {
        saveDraft({ garment_type: category, customization: null, design_file_url: null, estimated_price: product.base_price ?? 0 });
        navigate(`/customize/${product.slug}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-[1050px]"
        >
            <button
                onClick={onBack}
                className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F1D24]/55 transition-opacity hover:opacity-60"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('design.back')}
            </button>

            <h1 className="font-serif text-[clamp(2.45rem,5vw,4.7rem)] font-medium leading-[0.92] tracking-[-0.055em] text-[#6F1D24]">{catLabel}</h1>
            <p className="mb-10 mt-5 max-w-[560px] text-sm leading-7 text-[#776158]">{t('design.chooseStyle')}</p>

            {loading && (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#6F1D24]/55" />
                </div>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}

            {!loading && !error && products.length === 0 && (
                <div className="border border-[#6F1D24]/15 bg-[#FDFBF5] p-10 text-center shadow-[0_18px_45px_rgba(72,54,45,0.10)]">
                    <p className="text-sm text-[#92615E]">{t('design.noStyles')}</p>
                    <p className="mt-1 text-xs text-[#92615E]/70">{t('design.checkBackSoon')}</p>
                </div>
            )}

            {!loading && !error && products.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {products.map((product, i) => (
                        <motion.button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group bg-[#FDFBF5] p-3 pb-0 text-left shadow-[0_18px_45px_rgba(72,54,45,0.12)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_65px_rgba(72,54,45,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F1D24] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F4EBD4]"
                        >
                            <div className="w-full aspect-[4/3] overflow-hidden bg-[#E9E6E1]">
                                {product.preview_image_url ? (
                                    <img
                                        src={product.preview_image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl opacity-30">
                                            {CATEGORY_KEYS.find(c => c.key === category)?.emoji ?? '👕'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-serif text-2xl font-medium tracking-[-0.035em] text-[#6F1D24]">{product.name}</h3>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#92615E]">
                                            {product.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#6F1D24]/35 transition-transform group-hover:translate-x-1" />
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-[#6F1D24]/10 pt-3">
                                    <span className="text-xs text-[#92615E]">{t('design.startingFrom')}</span>
                                    <span className="text-sm font-bold text-[#261D1B]">₾{product.base_price}</span>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DesignerApp() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [flow, setFlow] = useState<FlowState>(
        searchParams.get('upload') === '1'
            ? { step: 'upload-type' }
            : { step: 'category' }
    );

    // Upload launched straight from the home page keeps its own section memory;
    // reaching upload from inside the design flow shares the 'design' memory.
    const scope: SectionScope = searchParams.get('upload') === '1' ? 'upload' : 'design';

    // Section split — explicit ?gender= wins, else the remembered choice.
    const genderParam = searchParams.get('gender');
    const section: Section | null =
        genderParam === 'men' || genderParam === 'women' ? genderParam : getSection(scope);

    useEffect(() => {
        if (!section) {
            // Preserve any query (e.g. ?upload=1) so intent survives the chooser hop.
            navigate(`/section?next=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
            return;
        }
        setSection(scope, section);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [section]);

    const switchSection = (s: Section) => {
        if (s === section) return;
        setSection(scope, s);
        const params = new URLSearchParams(searchParams);
        params.set('gender', s);
        setSearchParams(params, { replace: true });
    };

    const handleUploadContinue = (result: UploadResult) => {
        if (flow.step !== 'upload-file') return;

        const filledMeasurements = Object.fromEntries(
            Object.entries(result.measurements).filter(([, v]) => v !== '')
        );

        saveDraft({
            garment_type:          flow.category,
            customization:         null,
            design_file_url:       result.fileUrl || null,
            measurements:          filledMeasurements,
            customization_request: result.customizationRequest.trim(),
            tailor_notes:          result.notes,
        });

        const user = getAuthUser();
        if (!user) {
            saveReturnTo('/design/tailor-select');
            navigate('/login/customer');
            return;
        }

        navigate('/design/tailor-select');
    };

    if (!section) return null; // awaiting redirect to the section chooser

    return (
        <div className="design-page min-h-screen bg-[#E4E0D7] text-[#261D1B]">
            <Helmet>
                <title>Design Studio | Kere</title>
                <meta name="description" content="Design your custom garment — choose a style and customise it to your taste." />
            </Helmet>

            <Navigation />

            <main className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8 sm:pt-12 md:pb-10 md:pt-14 lg:px-12">
                <div className="relative z-10 mx-auto mb-4 flex max-w-[1050px] items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#776158]">{t('section.shoppingFor')}</span>
                    <div className="flex items-center rounded-full border border-[#111111]/25 p-0.5">
                        {(['women', 'men'] as Section[]).map(s => (
                            <button
                                key={s}
                                onClick={() => switchSection(s)}
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                                    section === s ? 'bg-[#111111] text-white' : 'text-[#111111]/70 hover:text-[#111111]'
                                }`}
                            >
                                {t(`section.${s}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[8%] top-0 h-full w-px bg-[#6F1D24]/8" />
                    <div className="absolute right-[8%] top-0 h-full w-px bg-[#6F1D24]/8" />
                    <div className="absolute left-0 top-[25%] h-px w-full bg-[#6F1D24]/8" />
                </div>
                <AnimatePresence mode="wait">
                    {flow.step === 'category' && (
                        <CategoryStep
                            key="category"
                            gender={section}
                            onSelectDesign={key => setFlow({ step: 'design', category: key })}
                            onSelectUpload={() => setFlow({ step: 'upload-type' })}
                        />
                    )}

                    {flow.step === 'design' && (
                        <ProductStep
                            key={`design-${flow.category}`}
                            category={flow.category}
                            gender={section}
                            onBack={() => setFlow({ step: 'category' })}
                        />
                    )}

                    {flow.step === 'upload-type' && (
                        <UploadTypeStep
                            key="upload-type"
                            gender={section}
                            onSelect={key => setFlow({ step: 'upload-file', category: key })}
                            onBack={() => searchParams.get('upload') === '1' ? navigate(-1) : setFlow({ step: 'category' })}
                        />
                    )}

                    {flow.step === 'upload-file' && (
                        <UploadPanel
                            key={`upload-${flow.category}`}
                            category={flow.category}
                            onContinue={handleUploadContinue}
                            onBack={() => setFlow({ step: 'upload-type' })}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
