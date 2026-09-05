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
import { categoriesFor, categoryForProduct, findCategory, type GarmentCategory } from '../data/garmentTaxonomy';
import DesignerWizard, { type WizardProduct } from '../components/customizer/DesignerWizard';
import { submitDesign } from '../components/customizer/submitDesign';
import { useCategoryProducts } from '../hooks/useCategoryProducts';
import { useProductData } from '../hooks/useProductData';
import type { DesignConfiguration } from '../types/customizer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Flow state ───────────────────────────────────────────────────────────────
// The guided designer is the page. The upload branch is the one way out of it:
// a customer who already has a drawing has nothing to configure, so it keeps
// its own local step rather than a level in the rail.

type UploadStep =
    | { step: 'upload-type' }
    | { step: 'upload-file'; category: GarmentCategory };

// ─── Step: Pick garment type for upload ───────────────────────────────────────

function UploadTypeStep({
    gender,
    onSelect,
    onBack,
}: {
    gender: Section;
    onSelect: (category: GarmentCategory) => void;
    onBack: () => void;
}) {
    const { t } = useTranslation();
    const uploadCategories = categoriesFor(gender);

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
                        onClick={() => onSelect(cat)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        className="group relative block h-full text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-4 focus-visible:ring-offset-[#E4E0D7]"
                    >
                        <article className="flex h-full flex-col">
                            <div className="mb-2 flex items-start justify-between gap-3">
                                <p className="text-[10px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#111111] sm:text-[11px]">
                                    {t(cat.tKey)}
                                </p>
                            </div>

                            {gender === 'women' && cat.image ? (
                                <div className="mt-auto flex h-[132px] items-center justify-center border border-[#111111]/45 bg-[#E4E0D7] p-3 transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.035] group-hover:shadow-[0_18px_40px_rgba(17,17,17,0.14)] sm:h-[156px] sm:p-4 lg:h-[178px]">
                                    <img
                                        src={cat.image}
                                        alt={t(cat.tKey)}
                                        className="h-full w-full object-contain mix-blend-multiply"
                                    />
                                </div>
                            ) : (
                                <div className="mt-auto flex h-[112px] items-end border border-[#111111]/45 bg-[#E4E0D7] p-4 transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.035] group-hover:shadow-[0_18px_40px_rgba(17,17,17,0.14)] sm:h-[132px] sm:p-5 lg:h-[150px]">
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
    category: GarmentCategory;
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

    const catLabel = t(category.tKey);

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


// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DesignerApp() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [uploadStep, setUploadStep] = useState<UploadStep | null>(
        searchParams.get('upload') === '1' ? { step: 'upload-type' } : null
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

    // Heading and garment both live in the URL, so the browser back button walks
    // the choices and a shared link opens on the garment it names. An unknown
    // key — a stale link, or a women's heading left in the URL after switching
    // to men — resolves to undefined and falls back to the heading grid.
    const garmentSlug = searchParams.get('garment');

    // The step lives here rather than in the wizard. Choosing a garment loads a
    // new catalogue, which remounts the wizard so its selections seed from it —
    // and the customer must not be thrown back to step 01 for that. Arriving on
    // a named garment — a shared link, or "edit" from My Designs — opens on the
    // shape, since the garment step is already answered.
    const [step, setStep] = useState(() => (garmentSlug ? 1 : 0));

    const { product, layerCategories, fabrics, error: productError } = useProductData(garmentSlug ?? undefined);

    // The heading being browsed. A link that names only the garment carries no
    // heading, so the garment's own filing stands in — it is what garment_type
    // and the style list are read from.
    const activeCategory = section
        ? findCategory(section, searchParams.get('cat'))
            ?? (product ? categoryForProduct(section, product.category) : undefined)
        : undefined;

    const { products, loading: productsLoading, error: productsError } = useCategoryProducts(section, activeCategory);

    // A garment that will not load is reported where the customer is standing,
    // rather than leaving them on a step whose CTA silently does nothing. The
    // hooks report only that the request failed; the wording belongs here, where
    // it can be translated.
    const styleError = productsError || (Boolean(garmentSlug) && productError)
        ? t('designer.loadFailed')
        : null;

    /**
     * Reopening a saved design. My Designs links here with ?design=<id>; without
     * it the page behaves exactly as before. The wizard must not mount until
     * this has resolved, or it would seed from defaults and then be re-seeded,
     * flashing the wrong configuration and overwriting the session copy.
     */
    const designId = searchParams.get('design');
    const [savedConfiguration, setSavedConfiguration] = useState<DesignConfiguration | null>(null);
    const [designLoading, setDesignLoading] = useState(Boolean(designId));

    useEffect(() => {
        if (!designId) { setSavedConfiguration(null); setDesignLoading(false); return; }

        let cancelled = false;
        setDesignLoading(true);
        fetch(`/api/customizer/designs/${designId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' },
        })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then(data => {
                if (cancelled) return;
                setSavedConfiguration((data.design?.configuration ?? null) as DesignConfiguration | null);
            })
            // A design that cannot be loaded (deleted, or someone else's) falls
            // back to a fresh garment rather than blocking the page.
            .catch(() => { if (!cancelled) setSavedConfiguration(null); })
            .finally(() => { if (!cancelled) setDesignLoading(false); });

        return () => { cancelled = true; };
    }, [designId]);

    const openCategory = (category: GarmentCategory) => {
        const params = new URLSearchParams(searchParams);
        params.set('cat', category.key);
        // Changing heading abandons the garment chosen under the old one.
        params.delete('garment');
        // Pushed, not replaced, so browser back returns to the heading grid.
        setSearchParams(params);
    };

    const switchSection = (next: Section) => {
        if (next === section) return;
        setSection(scope, next);
        const params = new URLSearchParams(searchParams);
        params.set('gender', next);
        // Headings differ per section — drop the open one, and the garment under
        // it, instead of carrying keys the new section does not have.
        params.delete('cat');
        params.delete('garment');
        setSearchParams(params, { replace: true });
    };

    const openProduct = (chosen: WizardProduct) => {
        saveDraft({
            garment_type:    activeCategory?.orderKey ?? chosen.category,
            customization:   null,
            design_file_url: null,
            estimated_price: chosen.base_price ?? 0,
        });
        const params = new URLSearchParams(searchParams);
        params.set('garment', chosen.slug);
        setSearchParams(params);
    };

    const handleUploadContinue = (result: UploadResult) => {
        if (!uploadStep || uploadStep.step !== 'upload-file') return;

        const filledMeasurements = Object.fromEntries(
            Object.entries(result.measurements).filter(([, v]) => v !== '')
        );

        saveDraft({
            garment_type:          uploadStep.category.orderKey,
            customization:         null,
            design_file_url:       result.fileUrl || null,
            measurements:          filledMeasurements,
            customization_request: result.customizationRequest.trim(),
            tailor_notes:          result.notes,
        });

        if (!getAuthUser()) {
            saveReturnTo('/design/tailor-select');
            navigate('/login/customer');
            return;
        }

        navigate('/design/tailor-select');
    };

    const handleOrder = (configuration: DesignConfiguration, totalPrice: number) => {
        if (!product) return;
        submitDesign({ product, category: activeCategory, configuration, totalPrice, navigate });
    };

    if (!section) return null; // awaiting redirect to the section chooser

    const head = (
        <Helmet>
            <title>Design Studio | Kere</title>
            <meta name="description" content="Design your custom garment — choose a style and customise it to your taste." />
        </Helmet>
    );

    // The upload branch keeps the studio's own chrome: it is a form, not a
    // guided walk, so it has no steps for the rail to hold.
    if (uploadStep) {
        return (
            <div className="design-page min-h-screen bg-[#E4E0D7] text-[#261D1B]">
                {head}
                <Navigation />
                <main className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8 sm:pt-12 md:pb-10 md:pt-14 lg:px-12">
                    <AnimatePresence mode="wait">
                        {uploadStep.step === 'upload-type' && (
                            <UploadTypeStep
                                key="upload-type"
                                gender={section}
                                onSelect={category => setUploadStep({ step: 'upload-file', category })}
                                onBack={() => searchParams.get('upload') === '1' ? navigate(-1) : setUploadStep(null)}
                            />
                        )}

                        {uploadStep.step === 'upload-file' && (
                            <UploadPanel
                                key={`upload-${uploadStep.category.key}`}
                                category={uploadStep.category}
                                onContinue={handleUploadContinue}
                                onBack={() => setUploadStep({ step: 'upload-type' })}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>
        );
    }

    if (designLoading) {
        return (
            <div className="kere-designer flex min-h-screen items-center justify-center">
                {head}
                <Loader2 className="h-8 w-8 animate-spin text-[var(--kd-burgundy)]/55" />
            </div>
        );
    }

    return (
        <>
            {head}
            <DesignerWizard
                // Keyed on the garment actually loaded, and on the saved design
                // being reopened: the wizard seeds its selections when it mounts,
                // so either changing needs a new mount rather than a re-seed.
                key={`${product?.slug ?? 'browse'}:${designId ?? ''}`}
                section={section}
                category={activeCategory}
                onSelectCategory={openCategory}
                onSwitchSection={switchSection}
                onUpload={() => setUploadStep({ step: 'upload-type' })}
                products={products}
                productsLoading={productsLoading}
                productsError={styleError}
                product={product}
                selectedSlug={garmentSlug}
                layerCategories={layerCategories}
                fabrics={fabrics}
                savedConfiguration={savedConfiguration}
                onSelectProduct={openProduct}
                step={step}
                onStep={setStep}
                onExit={() => navigate('/')}
                onOrder={handleOrder}
            />
        </>
    );
}
