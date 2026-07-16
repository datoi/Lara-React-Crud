import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2, Upload, X, FileText } from 'lucide-react';
import { getAuthUser, getAuthToken, saveReturnTo } from '../hooks/useAuth';
import { saveDraft } from '../hooks/useCustomOrderDraft';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

// ─── Garment categories ───────────────────────────────────────────────────────

const CATEGORY_KEYS = [
    { key: 'shirt',    tKey: 'design.cat_shirt',    emoji: '👔' },
    { key: 'dress',    tKey: 'design.cat_dress',    emoji: '👗' },
    { key: 'trousers', tKey: 'design.cat_trousers', emoji: '👖' },
    { key: 'jacket',   tKey: 'design.cat_jacket',   emoji: '🧥' },
    { key: 'skirt',    tKey: 'design.cat_skirt',    emoji: '🩱' },
    { key: 'coat',     tKey: 'design.cat_coat',     emoji: '🧤' },
];

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
    onSelectDesign,
    onSelectUpload,
}: {
    onSelectDesign: (key: string) => void;
    onSelectUpload: () => void;
}) {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
        >
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('design.categoryTitle')}</h1>
            <p className="text-slate-500 mb-8">{t('design.categorySubtitle')}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CATEGORY_KEYS.map((cat, i) => (
                    <motion.button
                        key={cat.key}
                        onClick={() => onSelectDesign(cat.key)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        whileHover={{ scale: 1.03 }}
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all flex flex-col items-center gap-3 text-center"
                    >
                        <span className="text-4xl">{cat.emoji}</span>
                        <span className="text-sm font-semibold text-slate-800">{t(cat.tKey)}</span>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                    </motion.button>
                ))}

                {/* Upload card — always last */}
                <motion.button
                    onClick={onSelectUpload}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: CATEGORY_KEYS.length * 0.07 }}
                    whileHover={{ scale: 1.03 }}
                    className="bg-slate-900 text-white rounded-lg shadow-sm border border-slate-900 p-6 hover:bg-slate-800 hover:shadow-lg transition-all flex flex-col items-center gap-3 text-center"
                >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold">{t('design.uploadMyDesign')}</span>
                    <ArrowRight className="w-4 h-4 text-white/40" />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Step: Pick garment type for upload ───────────────────────────────────────

function UploadTypeStep({
    onSelect,
    onBack,
}: {
    onSelect: (key: string) => void;
    onBack: () => void;
}) {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('design.back')}
            </button>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('design.uploadTypeTitle')}</h1>
            <p className="text-slate-500 mb-8">{t('design.uploadTypeSubtitle')}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CATEGORY_KEYS.map((cat, i) => (
                    <motion.button
                        key={cat.key}
                        onClick={() => onSelect(cat.key)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        whileHover={{ scale: 1.03 }}
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all flex flex-col items-center gap-3 text-center"
                    >
                        <span className="text-4xl">{cat.emoji}</span>
                        <span className="text-sm font-semibold text-slate-800">{t(cat.tKey)}</span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Step: Upload panel ───────────────────────────────────────────────────────

function UploadPanel({
    category,
    onContinue,
    onBack,
}: {
    category: string;
    onContinue: (fileUrl: string, notes: string) => void;
    onBack: () => void;
}) {
    const { t } = useTranslation();
    const [fileUrl,     setFileUrl]     = useState<string | null>(null);
    const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
    const [fileName,    setFileName]    = useState<string | null>(null);
    const [notes,       setNotes]       = useState('');
    const [uploading,   setUploading]   = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
            className="max-w-2xl mx-auto"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('design.back')}
            </button>

            <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('design.uploadTitle')}</h1>
            <p className="text-slate-500 mb-8">
                {t('design.uploadGarmentType')} <span className="font-medium text-slate-700">{catLabel}</span>
            </p>

            <div className="space-y-5">
                {/* Drop zone */}
                <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleFile(file);
                    }}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center hover:border-slate-400 transition-colors cursor-pointer bg-white"
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
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                            <p className="text-sm text-slate-500">{t('design.uploading')}</p>
                        </div>
                    ) : fileName ? (
                        <div className="flex flex-col items-center gap-3">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Design preview" className="max-h-40 rounded-lg object-contain border border-slate-200" />
                            ) : (
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-slate-400" />
                                </div>
                            )}
                            <p className="text-sm font-medium text-slate-800 truncate max-w-xs">{fileName}</p>
                            {fileUrl && <p className="text-xs text-slate-700">{t('design.uploadedSuccess')}</p>}
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); clearFile(); }}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-3 h-3" /> {t('design.remove')}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">{t('design.dropZoneLabel')}</p>
                                <p className="text-xs text-slate-400 mt-1">{t('design.dropZoneFormats')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {uploadError && (
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2.5">
                        {uploadError}
                    </p>
                )}

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t('design.notesLabel')} <span className="text-slate-400 font-normal">{t('design.notesOptional')}</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value.slice(0, 500))}
                        placeholder={t('design.notesPlaceholder')}
                        rows={4}
                        maxLength={500}
                        className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    />
                    <p className={`text-xs mt-1 text-right ${notes.length > 450 ? 'text-slate-600' : 'text-slate-400'}`}>{notes.length} / 500</p>
                </div>

                <Button variant="default" disabled={!canContinue} onClick={() => onContinue(fileUrl ?? '', notes)} className="w-full">
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
    onBack,
}: {
    category: string;
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
        fetch('/api/customizer/products')
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
    }, [category]);

    const handleProductClick = (product: Product) => {
        saveDraft({ garment_type: category, customization: null, design_file_url: null, estimated_price: product.base_price ?? 0 });
        navigate(`/customize/${product.slug}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('design.back')}
            </button>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">{catLabel}</h1>
            <p className="text-slate-500 mb-8">{t('design.chooseStyle')}</p>

            {loading && (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}

            {!loading && !error && products.length === 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
                    <p className="text-slate-400 text-sm">{t('design.noStyles')}</p>
                    <p className="text-slate-300 text-xs mt-1">{t('design.checkBackSoon')}</p>
                </div>
            )}

            {!loading && !error && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((product, i) => (
                        <motion.button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-lg transition-all text-left overflow-hidden"
                        >
                            <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                                {product.preview_image_url ? (
                                    <img
                                        src={product.preview_image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
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
                                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                            {product.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">{t('design.startingFrom')}</span>
                                    <span className="text-sm font-bold text-slate-900">₾{product.base_price}</span>
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
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [flow, setFlow] = useState<FlowState>(
        searchParams.get('upload') === '1'
            ? { step: 'upload-type' }
            : { step: 'category' }
    );

    const handleUploadContinue = (fileUrl: string, notes: string) => {
        if (flow.step !== 'upload-file') return;

        saveDraft({
            garment_type:    flow.category,
            customization:   null,
            design_file_url: fileUrl || null,
            tailor_notes:    notes,
        });

        const user = getAuthUser();
        if (!user) {
            saveReturnTo('/design/tailor-select');
            navigate('/login/customer');
            return;
        }

        navigate('/design/tailor-select');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>Design Studio | Kere</title>
                <meta name="description" content="Design your custom garment — choose a style and customise it to your taste." />
            </Helmet>

            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <span className="text-xs text-slate-400 hidden sm:block">{t('design.studioLabel')}</span>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <AnimatePresence mode="wait">
                    {flow.step === 'category' && (
                        <CategoryStep
                            key="category"
                            onSelectDesign={key => setFlow({ step: 'design', category: key })}
                            onSelectUpload={() => setFlow({ step: 'upload-type' })}
                        />
                    )}

                    {flow.step === 'design' && (
                        <ProductStep
                            key={`design-${flow.category}`}
                            category={flow.category}
                            onBack={() => setFlow({ step: 'category' })}
                        />
                    )}

                    {flow.step === 'upload-type' && (
                        <UploadTypeStep
                            key="upload-type"
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
