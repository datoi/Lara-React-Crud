import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { Navigation } from '../components/landing/Navigation';
import { getAuthUser, getAuthToken, saveReturnTo } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES = 6;

interface UploadedImage {
    url: string;
    preview: string;
}

const inputClass =
    'w-full border border-[#111111]/25 bg-[#E4E0D7] px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#776158] focus:outline-none focus:ring-2 focus:ring-[#111111]';

export default function RemodelRequest() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = getAuthUser();

    const [images, setImages] = useState<UploadedImage[]>([]);
    const [changeRequest, setChangeRequest] = useState('');
    const [firstName, setFirstName] = useState(user?.first_name ?? user?.name ?? '');
    const [lastName, setLastName] = useState(user?.last_name ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('თბილისი');
    const [zip, setZip] = useState('');
    const [expectedPrice, setExpectedPrice] = useState('');

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadError(null);

        const token = getAuthToken();
        if (!token) {
            saveReturnTo('/remodel');
            navigate('/login/customer');
            return;
        }

        const remaining = MAX_IMAGES - images.length;
        const toUpload = Array.from(files).slice(0, remaining);
        if (Array.from(files).length > remaining) {
            setUploadError(t('remodel.errorMaxImages', { max: MAX_IMAGES }));
        }

        setUploading(true);
        try {
            for (const file of toUpload) {
                if (!ALLOWED_TYPES.includes(file.type)) {
                    setUploadError(t('remodel.errorFileType'));
                    continue;
                }
                if (file.size > MAX_FILE_SIZE) {
                    setUploadError(t('remodel.errorFileSize'));
                    continue;
                }

                const form = new FormData();
                form.append('file', file);
                const res = await fetch('/api/uploads', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    body: form,
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error((err as { message?: string }).message ?? t('remodel.errorUploadFailed'));
                }
                const data = (await res.json()) as { file_url: string };
                setImages(prev => [...prev, { url: data.file_url, preview: URL.createObjectURL(file) }]);
            }
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : t('remodel.errorUploadFailed'));
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const canSubmit =
        images.length > 0 &&
        changeRequest.trim().length > 0 &&
        firstName.trim().length > 0 &&
        phone.trim().length > 0 &&
        address.trim().length > 0 &&
        city.trim().length > 0 &&
        !uploading &&
        !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        const token = getAuthToken();
        if (!user || !token) {
            saveReturnTo('/remodel');
            navigate('/login/customer');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        const body = {
            order_type: 'remodel',
            expected_price: expectedPrice.trim() !== '' ? Number(expectedPrice) : null,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            zip: zip.trim(),
            custom_design_data: {
                change_request: changeRequest.trim(),
                remodel_images: images.map(i => i.url),
            },
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error((data as { message?: string }).message ?? t('remodel.errorSubmit'));
            }
            navigate('/customer-dashboard', { state: { pendingAssignment: true, orderNumber: (data as { order_number?: string }).order_number } });
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : t('remodel.errorSubmit'));
            setSubmitting(false);
        }
    };

    return (
        <div className="remodel-page min-h-screen bg-[#E4E0D7] text-[#261D1B]">
            <Helmet>
                <title>{t('remodel.pageTitle')} | Kere</title>
                <meta name="description" content={t('remodel.subtitle')} />
            </Helmet>

            <Navigation />

            <main className="relative overflow-hidden px-5 pb-16 pt-24 sm:px-8 sm:pt-28 lg:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-[720px]"
                >
                    <div className="mb-8 text-center">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6F1D24]">{t('remodel.eyebrow')}</span>
                        <h1 className="mt-3 font-serif text-[clamp(2.15rem,4vw,3.4rem)] font-medium leading-[0.95] tracking-[-0.04em] text-[#111111]">
                            {t('remodel.heroTitle')}
                        </h1>
                        <p className="mx-auto mt-3 max-w-[520px] text-sm leading-6 text-[#776158]">
                            {t('remodel.subtitle')}
                        </p>
                    </div>

                    {/* Garment photos */}
                    <section className="mb-8">
                        <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">{t('remodel.photosLabel')}</h2>
                        <p className="mb-3 text-xs text-[#776158]">{t('remodel.photosHint', { max: MAX_IMAGES })}</p>

                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {images.map((img, i) => (
                                <div key={i} className="group relative aspect-square overflow-hidden border border-[#111111]/20 bg-[#EEEAE0]">
                                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        aria-label={t('remodel.removePhoto')}
                                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}

                            {images.length < MAX_IMAGES && (
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed border-[#111111]/40 bg-[#E4E0D7] text-[#776158] transition-colors hover:border-[#6F1D24] hover:text-[#6F1D24] disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">{t('remodel.addPhoto')}</span>
                                </button>
                            )}
                        </div>

                        <input
                            ref={inputRef}
                            type="file"
                            accept={ALLOWED_TYPES.join(',')}
                            multiple
                            className="hidden"
                            onChange={e => handleFiles(e.target.files)}
                        />
                        {uploadError && <p className="mt-2 text-xs text-[#6F1D24]">{uploadError}</p>}
                    </section>

                    {/* What to change */}
                    <section className="mb-8">
                        <label htmlFor="change" className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                            {t('remodel.changeLabel')}
                        </label>
                        <p className="mb-3 text-xs text-[#776158]">{t('remodel.changeHint')}</p>
                        <textarea
                            id="change"
                            value={changeRequest}
                            onChange={e => setChangeRequest(e.target.value)}
                            rows={5}
                            maxLength={2000}
                            placeholder={t('remodel.changePlaceholder')}
                            className={`${inputClass} resize-none`}
                        />
                    </section>

                    {/* Pickup / return address */}
                    <section className="mb-8">
                        <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">{t('remodel.addressLabel')}</h2>
                        <p className="mb-3 text-xs text-[#776158]">{t('remodel.addressHint')}</p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t('remodel.firstName')} className={inputClass} />
                            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t('remodel.lastName')} className={inputClass} />
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('remodel.phone')} className={inputClass} />
                            <input value={city} onChange={e => setCity(e.target.value)} placeholder={t('remodel.city')} className={inputClass} />
                            <input value={address} onChange={e => setAddress(e.target.value)} placeholder={t('remodel.address')} className={`${inputClass} sm:col-span-2`} />
                            <input value={zip} onChange={e => setZip(e.target.value)} placeholder={t('remodel.zip')} className={inputClass} />
                        </div>
                    </section>

                    {/* Optional expected price */}
                    <section className="mb-8">
                        <label htmlFor="price" className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#111111]">
                            {t('remodel.priceLabel')}
                        </label>
                        <p className="mb-3 text-xs text-[#776158]">{t('remodel.priceHint')}</p>
                        <div className="relative max-w-[220px]">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#776158]">₾</span>
                            <input
                                id="price"
                                type="number"
                                min="0"
                                inputMode="decimal"
                                value={expectedPrice}
                                onChange={e => setExpectedPrice(e.target.value)}
                                placeholder={t('remodel.pricePlaceholder')}
                                className={`${inputClass} pl-8`}
                            />
                        </div>
                    </section>

                    {submitError && (
                        <p className="mb-4 border border-[#6F1D24]/30 bg-[#FDFBF5] px-4 py-2.5 text-sm text-[#6F1D24]">{submitError}</p>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full rounded-none bg-[#111111] text-white hover:bg-[#333333]"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {t('remodel.submit')}
                    </Button>
                    <p className="mt-3 text-center text-xs text-[#776158]">{t('remodel.submitHint')}</p>
                </motion.div>
            </main>
        </div>
    );
}
