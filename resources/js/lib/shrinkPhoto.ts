/** Longest side, in pixels, of a photo as it is uploaded. */
const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;

interface Decoded {
    image: CanvasImageSource;
    width: number;
    height: number;
    release: () => void;
}

/**
 * The photo decoded and turned the way the camera held it.
 *
 * `imageOrientation: 'from-image'` is a recent addition, and an older browser
 * (iOS 16 Safari, older Android WebViews) refuses the whole call over it, so
 * those fall back to an <img>, which every current browser draws upright.
 */
async function decode(file: File): Promise<Decoded | null> {
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        try {
            await img.decode();
            return { image: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
        } catch {
            URL.revokeObjectURL(url);
            return null;
        }
    }
}

/**
 * A phone photo made small enough to upload quickly.
 *
 * Phones take photos of 3–10 MB, and a tailor judging a garment needs a
 * fraction of that, so the photo is redrawn as a JPEG no wider or taller than
 * MAX_EDGE. A photo the browser cannot decode, or one that would not come out
 * smaller, is returned as it was: the server still checks its type and size.
 */
export async function shrinkPhoto(file: File): Promise<File> {
    const decoded = await decode(file);
    if (!decoded) return file;

    const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
    const width = Math.round(decoded.width * scale);
    const height = Math.round(decoded.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
        decoded.release();
        return file;
    }

    // JPEG has no transparency, and a transparent PNG would otherwise turn black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(decoded.image, 0, 0, width, height);
    decoded.release();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]*$/, '')}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
}
