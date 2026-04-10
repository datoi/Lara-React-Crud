import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface DesignState {
    clothingType: string | null;
    subcategory: string | null;
    length: string;
    sleeves: string;
    neckline: string;
    fabric: string;
    baseColor: string;
    lighterShade: string;
    darkerShade: string;
    additionalColor: string;
    textureMaterial: string;
    sizeStandard: string;
    sizeCm: { chest?: string; waist?: string; hips?: string; length?: string; inseam?: string };
    designElements: { cuts: string[]; height: string; customNotes: string };
}

// Asset map: clothingType -> subcategory -> Unsplash photo ID
// Replace any value with a local transparent PNG path when production assets are ready.
const GARMENT_IMAGES: Record<string, Record<string, string>> = {
    dress: {
        Maxi:          'photo-1566479179817-e0a0b22b5ef3',
        Mini:          'photo-1539008835657-9e8e9680c956',
        'A-Line':      'photo-1595777457583-95e059d581b8',
        Wrap:          'photo-1595777457583-95e059d581b8',
        Bodycon:       'photo-1558618666-fcd25c85cd64',
        'Shirt Dress': 'photo-1595777457583-95e059d581b8',
        _default:      'photo-1566479179817-e0a0b22b5ef3',
    },
    shirt: {
        'Button-Down': 'photo-1603252109303-2751441dd157',
        Blouse:        'photo-1598032895455-f6fc4c8db9e6',
        'T-Shirt':     'photo-1603252109303-2751441dd157',
        Polo:          'photo-1603252109303-2751441dd157',
        Henley:        'photo-1603252109303-2751441dd157',
        'Tank Top':    'photo-1598032895455-f6fc4c8db9e6',
        _default:      'photo-1603252109303-2751441dd157',
    },
    pants: {
        Jeans:         'photo-1584370848010-d7fe6bc767ec',
        Chinos:        'photo-1584370848010-d7fe6bc767ec',
        'Dress Pants': 'photo-1584370848010-d7fe6bc767ec',
        'Wide Leg':    'photo-1594938298603-c8148c4b4d2f',
        Joggers:       'photo-1584370848010-d7fe6bc767ec',
        Shorts:        'photo-1584370848010-d7fe6bc767ec',
        _default:      'photo-1584370848010-d7fe6bc767ec',
    },
    jacket: {
        Bomber:         'photo-1591047139829-d91aecb6caea',
        Blazer:         'photo-1591047139829-d91aecb6caea',
        Puffer:         'photo-1551028719-00167b16eac5',
        'Denim Jacket': 'photo-1591047139829-d91aecb6caea',
        Trench:         'photo-1551028719-00167b16eac5',
        Windbreaker:    'photo-1591047139829-d91aecb6caea',
        _default:       'photo-1591047139829-d91aecb6caea',
    },
    scarf: { _default: 'photo-1520903920243-00d872a2d1c9' },
    hat:   { _default: 'photo-1521369909029-2afed882baee' },
};

const TYPE_EMOJI: Record<string, string> = {
    dress: '👗', shirt: '👔', pants: '👖', jacket: '🧥', hat: '🧢', scarf: '🧣',
};

const ELEMENT_ICONS: Record<string, string> = {
    Pocket:      '🗂',
    Zipper:      '🤐',
    Buttons:     '🔘',
    Pleats:      '〰',
    Ruffle:      '🌊',
    'Belt loop': '⬤',
    Embroidery:  '🧵',
    'Lace trim': '🕸',
};

function getImageUrl(type: string | null, sub: string | null): string {
    if (!type) return '';
    const typeMap = GARMENT_IMAGES[type] ?? {};
    const photoId = (sub ? typeMap[sub] : undefined) ?? typeMap['_default'];
    if (!photoId) return '';
    return `https://images.unsplash.com/${photoId}?w=600&q=80&auto=format`;
}

interface GarmentPreviewProps {
    design: DesignState;
    size?: 'compact' | 'full';
}

export function GarmentPreview({ design, size = 'compact' }: GarmentPreviewProps) {
    const imageUrl = getImageUrl(design.clothingType, design.subcategory);
    const [loaded, setLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setImgError(false);
    }, [imageUrl]);

    const styleBadges: string[] = [
        design.length,
        design.sleeves,
        design.neckline,
    ].filter((v): v is string => Boolean(v));

    const activeElements = design.designElements.cuts.filter(c => ELEMENT_ICONS[c]);

    const showImage = imageUrl !== '' && loaded && !imgError;
    const showPlaceholder = !showImage;

    const sizeClass = size === 'full'
        ? 'aspect-[3/4] w-full max-w-sm mx-auto'
        : 'aspect-[3/4] w-full max-w-[240px] mx-auto';

    return (
        <div
            className={`relative overflow-hidden rounded-2xl bg-slate-100 isolate ${sizeClass}`}
        >
            {/* Placeholder — always mounted, hidden behind image once loaded */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-100 transition-opacity duration-300 ${showPlaceholder ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <span className="text-6xl mb-3 select-none">
                    {TYPE_EMOJI[design.clothingType ?? ''] ?? '\u2702\uFE0F'}
                </span>
                <p className="text-xs text-slate-400 font-medium">
                    {imageUrl === '' ? 'Preview not available' : imgError ? 'Preview unavailable' : 'Loading preview\u2026'}
                </p>
            </div>

            {/* Image layer — only rendered when we have a URL */}
            {imageUrl !== '' && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={imageUrl}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showImage ? 1 : 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Layer 1: base photo, normalised to greyscale for color engine */}
                        <img
                            src={imageUrl}
                            alt={`${design.subcategory ?? ''} ${design.clothingType ?? ''}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ filter: 'grayscale(1) brightness(1.25) contrast(0.9)' }}
                            onLoad={() => setLoaded(true)}
                            onError={() => setImgError(true)}
                        />

                        {/* Layer 2: color engine — mix-blend-mode multiply
                            white * color = color
                            grey  * color = darker tone (preserves shadows/folds)
                            black * color = black (seams stay sharp) */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor: design.baseColor || '#94A3B8',
                                mixBlendMode: 'multiply' as const,
                                opacity: 0.82,
                            }}
                        />

                        {/* Layer 3: accent gradient at collar/trim area */}
                        {design.additionalColor && design.additionalColor !== design.baseColor && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(to bottom, ${design.additionalColor}55 0%, transparent 30%)`,
                                    mixBlendMode: 'multiply' as const,
                                }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Color swatch strip — top edge */}
            {showImage && (
                <div className="absolute top-0 left-0 right-0 h-1 flex z-10">
                    {[design.baseColor, design.lighterShade, design.darkerShade, design.additionalColor]
                        .filter(Boolean)
                        .map((c, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        ))}
                </div>
            )}

            {/* Style badges — bottom left */}
            {showImage && styleBadges.length > 0 && (
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 max-w-[80%] z-10">
                    {styleBadges.map(label => (
                        <span
                            key={label}
                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-white/80 text-slate-800 border-white/50 backdrop-blur-sm"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}

            {/* Design element icons — top right */}
            {showImage && activeElements.length > 0 && (
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
                    {activeElements.slice(0, 4).map(el => (
                        <span
                            key={el}
                            className="text-xs bg-white/80 backdrop-blur-sm border border-white/50 rounded-full px-2 py-0.5 text-slate-700 font-medium"
                        >
                            {ELEMENT_ICONS[el]} {el}
                        </span>
                    ))}
                    {activeElements.length > 4 && (
                        <span className="text-xs bg-white/80 backdrop-blur-sm border border-white/50 rounded-full px-2 py-0.5 text-slate-500">
                            +{activeElements.length - 4} more
                        </span>
                    )}
                </div>
            )}

            {/* Fabric label — bottom right */}
            {showImage && design.fabric && (
                <div className="absolute bottom-3 right-3 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-slate-900/70 text-white border-slate-700/50 backdrop-blur-sm">
                        {design.fabric}
                    </span>
                </div>
            )}
        </div>
    );
}
