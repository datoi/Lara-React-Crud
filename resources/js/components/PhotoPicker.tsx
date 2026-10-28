import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../hooks/useAuth';
import { uploadPhoto } from '../lib/photoUpload';
import { shrinkPhoto } from '../lib/shrinkPhoto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Photos already on the server, each opening full size. */
export function PhotoGrid({ photos, label }: { photos: string[]; label: string }) {
    if (photos.length === 0) return null;

    return (
        <div className="grid grid-cols-4 gap-2">
            {photos.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={src} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </a>
            ))}
        </div>
    );
}

/**
 * Pick photos, shrink them in the browser and upload them one by one. A photo
 * that fails is reported and skipped so the rest still arrive; the parent keeps
 * the list of uploaded URLs. Every change is an update of the latest list, so a
 * photo removed while others are still uploading stays removed.
 */
export function PhotoPicker({
    photos,
    onChange,
    max = 10,
    endpoint = '/api/uploads',
    field = 'file',
    onUploadingChange,
}: {
    photos: string[];
    onChange: Dispatch<SetStateAction<string[]>>;
    max?: number;
    endpoint?: string;
    field?: string;
    onUploadingChange?: (uploading: boolean) => void;
}) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [problems, setProblems] = useState<string[]>([]);

    const setBusy = (busy: boolean) => {
        setUploading(busy);
        onUploadingChange?.(busy);
    };

    const handleFiles = async (files: FileList | null) => {
        const token = getAuthToken();
        if (!files || files.length === 0 || !token) return;

        const found = new Set<string>();
        const report = (message: string) => {
            found.add(message);
            setProblems([...found]);
        };
        setProblems([]);

        const chosen = Array.from(files);
        const accepted = chosen.filter((file) => ALLOWED_TYPES.includes(file.type));
        if (accepted.length < chosen.length) report(t('photos.errorType'));
        const remaining = max - photos.length;
        if (accepted.length > remaining) report(t('photos.errorMax', { max }));

        setBusy(true);
        try {
            for (const original of accepted.slice(0, Math.max(remaining, 0))) {
                try {
                    const file = await shrinkPhoto(original);
                    if (file.size > MAX_FILE_SIZE) {
                        report(t('photos.errorSize'));
                        continue;
                    }
                    const result = await uploadPhoto(file, token, endpoint, field);
                    const url = result.url;
                    if (url) {
                        onChange((current) => [...current, url]);
                        continue;
                    }
                    if (result.status === 401) {
                        report(t('photos.errorSession'));
                        return;
                    }
                    if (result.status === 429) {
                        report(t('photos.errorThrottled'));
                        return;
                    }
                    report(t('photos.errorFailed'));
                } catch {
                    report(t('photos.errorFailed'));
                }
            }
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {photos.map((src, i) => (
                        <div key={src} className="relative aspect-square overflow-hidden border border-slate-200 bg-slate-50">
                            <img src={src} alt={t('photos.photoN', { n: i + 1 })} className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onChange((current) => current.filter((p) => p !== src))}
                                aria-label={t('photos.remove')}
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-white/90 text-slate-700 hover:text-destructive"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {photos.length < max && (
                <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 hover:border-slate-500">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploading ? t('photos.uploading') : t('photos.add')}
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ALLOWED_TYPES.join(',')}
                        multiple
                        className="sr-only"
                        disabled={uploading}
                        onChange={(e) => void handleFiles(e.target.files)}
                    />
                </label>
            )}

            {problems.length > 0 && (
                <ul role="alert" className="space-y-1 text-xs text-destructive">
                    {problems.map((problem) => (
                        <li key={problem}>{problem}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
