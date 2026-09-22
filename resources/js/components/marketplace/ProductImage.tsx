import { ImageOff } from 'lucide-react';
import { useState, type ImgHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

/** Reserve the media slot when a catalog image is missing or fails to load. */
export function ProductImage({ src, alt = '', className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    const [failedSource, setFailedSource] = useState<string>();
    const { t } = useTranslation();
    if (!src || failedSource === src)
        return (
            <span
                className={`inline-flex items-center justify-center bg-[#f0e7df] text-[#715951] ${className}`}
                role={alt ? 'img' : undefined}
                aria-label={alt ? `${alt}: ${t('store.imageUnavailable')}` : undefined}
            >
                <ImageOff aria-hidden="true" size={24} />
            </span>
        );
    return <img {...props} src={src} alt={alt} className={className} onError={() => setFailedSource(src)} />;
}
