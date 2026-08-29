import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { Footer } from '../components/landing/Footer';
import { Navigation } from '../components/landing/Navigation';
import { Button } from '../components/ui/button';
import { getAuthToken, getAuthUser, saveReturnTo } from '../hooks/useAuth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES = 6;

interface UploadedImage {
    url: string;
    preview: string;
}

const inputClass =
    'w-full border-0 border-b border-[#261D1B]/35 bg-transparent px-0 py-3 text-sm text-[#111111] placeholder:text-[#665A50] transition-colors focus:border-[#261D1B] focus:outline-none focus:ring-0';

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
                setImages((prev) => [...prev, { url: data.file_url, preview: URL.createObjectURL(file) }]);
            }
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : t('remodel.errorUploadFailed'));
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
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
                remodel_images: images.map((i) => i.url),
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

            <main className="relative overflow-hidden px-5 pt-11 pb-20 sm:px-8 lg:px-12 lg:pb-28">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full">
                    <div
                        className="relative left-1/2 flex h-[52svh] min-h-[430px] w-screen -translate-x-1/2 items-center justify-center overflow-hidden bg-cover bg-center px-5 text-center sm:min-h-[500px] sm:px-8 lg:h-[58svh] lg:px-12"
                        style={{ backgroundImage: "url('/assets/backgrounds/remodel-gold-texture.jpg')" }}
                    >
                        <div className="absolute inset-0 bg-[#261D1B]/32" aria-hidden="true" />
                        <div className="relative mx-auto w-full">
                            <p className="mb-4 text-[10px] font-semibold tracking-[0.16em] text-[#FFF8E8] uppercase sm:text-xs">{t('remodel.eyebrow')}</p>
                            <h1 className="font-serif text-[clamp(3.25rem,9vw,9.5rem)] leading-[0.82] font-normal tracking-[-0.055em] text-[#FFF8E8] drop-shadow-[0_4px_30px_rgba(38,29,27,0.28)]">
                                {t('nav.remodel')}
                            </h1>
                        </div>
                    </div>

                    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#E4E0D7] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
                        <div className="mx-auto mb-14 w-full max-w-[1050px] text-center sm:mb-20">
                            <p className="mb-5 text-left text-[10px] font-semibold tracking-[0.12em] text-[#111111] uppercase">
                                <Link to="/" className="transition-opacity hover:opacity-55">Kere</Link> / {t('nav.remodel')}
                            </p>
                            <p className="mx-auto max-w-[620px] text-sm leading-6 text-[#4F463E] sm:text-base sm:leading-7">{t('remodel.subtitle')}</p>
                        </div>

                        <div className="relative mx-auto w-full max-w-[1050px] border border-[#261D1B]/12 bg-[#F2EAD7] px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
                            {/* Garment photos */}
                            <section className="mb-14">
                                <h2 className="mb-2 text-lg font-semibold tracking-normal text-[#17130F]">{t('remodel.photosLabel')}</h2>
                                <p className="mb-6 text-sm leading-5 text-[#5C5148]">{t('remodel.photosHint', { max: MAX_IMAGES })}</p>

                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                    {images.map((img, i) => (
                                        <div key={i} className="group relative aspect-square overflow-hidden border border-[#261D1B]/25 bg-[#E8DECA]">
                                            <img src={img.preview} alt="" className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                aria-label={t('remodel.removePhoto')}
                                                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
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
                                            className="flex aspect-square flex-col items-center justify-center gap-2 border border-dashed border-[#261D1B]/45 bg-transparent text-[#4F463E] transition-colors hover:border-[#261D1B] hover:bg-[#EAE0CC] disabled:opacity-50"
                                        >
                                            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                                            <span className="text-xs font-semibold tracking-normal">{t('remodel.addPhoto')}</span>
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept={ALLOWED_TYPES.join(',')}
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleFiles(e.target.files)}
                                />
                                {uploadError && <p className="mt-2 text-xs text-[#6F1D24]">{uploadError}</p>}
                            </section>

                            {/* What to change */}
                            <section className="mb-14">
                                <label htmlFor="change" className="mb-2 block text-lg font-semibold tracking-normal text-[#17130F]">
                                    {t('remodel.changeLabel')}
                                </label>
                                <textarea
                                    id="change"
                                    value={changeRequest}
                                    onChange={(e) => setChangeRequest(e.target.value)}
                                    rows={2}
                                    maxLength={2000}
                                    placeholder={t('remodel.changePlaceholder')}
                                    className={`${inputClass} max-w-[900px] resize-none`}
                                />
                            </section>

                            {/* Pickup / return address */}
                            <section className="mb-14">
                                <h2 className="mb-2 text-lg font-semibold tracking-normal text-[#17130F]">{t('remodel.addressLabel')}</h2>

                                <div className="grid max-w-[1100px] grid-cols-1 gap-3 sm:grid-cols-6">
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={t('remodel.firstName')}
                                        className={`${inputClass} sm:col-span-3`}
                                    />
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder={t('remodel.lastName')}
                                        className={`${inputClass} sm:col-span-3`}
                                    />
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder={t('remodel.phone')}
                                        className={`${inputClass} sm:col-span-6`}
                                    />
                                    <input
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder={t('remodel.city')}
                                        className={`${inputClass} sm:col-span-6`}
                                    />
                                    <input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder={t('remodel.address')}
                                        className={`${inputClass} sm:col-span-4`}
                                    />
                                    <input
                                        value={zip}
                                        onChange={(e) => setZip(e.target.value)}
                                        placeholder={t('remodel.zip')}
                                        className={`${inputClass} sm:col-span-2`}
                                    />
                                </div>
                            </section>

                            {/* Optional expected price */}
                            <section className="mb-10">
                                <label htmlFor="price" className="mb-2 block text-lg font-semibold tracking-normal text-[#17130F]">
                                    {t('remodel.priceLabel')}
                                </label>
                                <p className="mb-5 text-sm leading-5 text-[#5C5148]">{t('remodel.priceHint')}</p>
                                <div className="relative max-w-[220px]">
                                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-[#574945]">
                                        ₾
                                    </span>
                                    <input
                                        id="price"
                                        type="number"
                                        min="0"
                                        inputMode="decimal"
                                        value={expectedPrice}
                                        onChange={(e) => setExpectedPrice(e.target.value)}
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
                                className="mx-auto flex min-h-11 w-fit rounded-none bg-[#111111] px-10 text-[11px] font-semibold tracking-[0.12em] text-white uppercase hover:bg-[#2B2B2B] disabled:bg-[#111111] disabled:text-white disabled:opacity-100"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                {t('remodel.submit')}
                            </Button>
                        </div>
                    </div>

                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
