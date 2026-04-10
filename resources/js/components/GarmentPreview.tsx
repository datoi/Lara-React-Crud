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

// Map clothing type → subcategory → local image path (relative to /public)
// Add more entries here as new garment photos are added to public/images/garments/
const GARMENT_PHOTOS: Record<string, Record<string, string>> = {
    dress: {
        Maxi:     '/images/garments/dress-maxi.png',
        Mini:     '/images/garments/dress-maxi.png',
        'A-Line': '/images/garments/dress-maxi.png',
        Wrap:     '/images/garments/dress-maxi.png',
        Bodycon:  '/images/garments/dress-maxi.png',
        'Shirt Dress': '/images/garments/dress-maxi.png',
        _default: '/images/garments/dress-maxi.png',
    },
};

function getPhoto(type: string | null, sub: string | null): string | null {
    if (!type) return null;
    const typeMap = GARMENT_PHOTOS[type];
    if (!typeMap) return null;
    return (sub ? typeMap[sub] : undefined) ?? typeMap['_default'] ?? null;
}

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

// ── SVG silhouettes (fallback for types without a real photo) ──────────────

function GarmentSilhouette({ type, color, accentColor }: {
    type: string | null;
    color: string;
    accentColor?: string;
}) {
    const base = color || '#94A3B8';
    const shadow = accentColor && accentColor !== color ? accentColor : darken(base, 0.25);
    const light = lighten(base, 0.3);

    if (type === 'shirt') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 55 L12 95 L16 200 L52 180 Z" fill={base} />
            <path d="M12 95 L16 200 L22 200 L18 97 Z" fill={shadow} opacity="0.35" />
            <path d="M150 55 L188 95 L184 200 L148 180 Z" fill={base} />
            <path d="M188 95 L184 200 L178 200 L182 97 Z" fill={light} opacity="0.3" />
            <path d="M50 55 L58 265 L142 265 L150 55 L124 38 Q100 28 76 38 Z" fill={base} />
            <path d="M76 38 L88 80 L100 68 L88 42 Z" fill={shadow} opacity="0.5" />
            <path d="M124 38 L112 80 L100 68 L112 42 Z" fill={shadow} opacity="0.35" />
            <rect x="97" y="60" width="6" height="200" fill={shadow} opacity="0.2" rx="2" />
            <path d="M50 55 L58 265 L66 265 L58 57 Z" fill={shadow} opacity="0.3" />
            <path d="M120 40 L128 265 L138 265 L131 50 Z" fill={light} opacity="0.25" />
        </svg>
    );

    if (type === 'pants') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect x="42" y="30" width="116" height="22" fill={shadow} rx="4" opacity="0.8" />
            <path d="M42 52 L58 260 L100 260 L100 52 Z" fill={base} />
            <path d="M100 52 L100 260 L142 260 L158 52 Z" fill={base} />
            <path d="M100 52 L100 110 Q98 115 96 120" stroke={shadow} strokeWidth="2" fill="none" opacity="0.4" />
            <path d="M55 60 L65 260 L72 260 L62 60 Z" fill={shadow} opacity="0.25" />
            <path d="M128 60 L122 260 L130 260 L136 60 Z" fill={light} opacity="0.3" />
            <rect x="98" y="52" width="4" height="208" fill={shadow} opacity="0.2" />
        </svg>
    );

    if (type === 'jacket') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 55 L12 95 L16 200 L52 180 Z" fill={base} />
            <path d="M12 95 L16 200 L22 200 L18 97 Z" fill={shadow} opacity="0.35" />
            <path d="M150 55 L188 95 L184 200 L148 180 Z" fill={base} />
            <path d="M188 95 L184 200 L178 200 L182 97 Z" fill={light} opacity="0.3" />
            <path d="M50 55 L58 265 L142 265 L150 55 L124 38 Q100 28 76 38 Z" fill={base} />
            <path d="M76 38 L88 80 L100 68 L88 42 Z" fill={shadow} opacity="0.45" />
            <path d="M124 38 L112 80 L100 68 L112 42 Z" fill={shadow} opacity="0.35" />
            <rect x="98" y="70" width="4" height="195" fill={shadow} opacity="0.15" />
            <rect x="62" y="155" width="28" height="18" fill={shadow} opacity="0.25" rx="2" />
            <path d="M50 55 L58 265 L66 265 L58 57 Z" fill={shadow} opacity="0.3" />
            <path d="M134 40 L142 265 L150 265 L142 57 Z" fill={light} opacity="0.2" />
        </svg>
    );

    if (type === 'scarf') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M70 20 Q100 15 130 20 L140 80 Q100 75 60 80 Z" fill={base} />
            <path d="M60 80 Q100 75 140 80 L145 260 L130 260 L125 100 Q100 96 75 100 L70 260 L55 260 Z" fill={base} />
            <path d="M75 100 L80 260 L88 260 L83 100 Z" fill={shadow} opacity="0.3" />
            <path d="M117 100 L122 260 L128 260 L123 100 Z" fill={light} opacity="0.3" />
        </svg>
    );

    if (type === 'hat') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="185" rx="85" ry="18" fill={shadow} opacity="0.7" />
            <path d="M45 185 Q48 95 100 85 Q152 95 155 185 Z" fill={base} />
            <ellipse cx="100" cy="88" rx="28" ry="10" fill={base} />
            <path d="M72 100 Q68 140 65 183 L72 182 Q74 143 78 103 Z" fill={light} opacity="0.4" />
            <path d="M47 178 Q100 190 153 178 L153 185 Q100 197 47 185 Z" fill={shadow} opacity="0.4" />
        </svg>
    );

    // Generic fallback
    return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="40" width="100" height="200" rx="12" fill={base} opacity="0.7" />
        </svg>
    );
}

// ── Color helpers ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
    const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function darken(hex: string, amt: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(rgb[0] * (1 - amt), rgb[1] * (1 - amt), rgb[2] * (1 - amt));
}
function lighten(hex: string, amt: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(rgb[0] + (255 - rgb[0]) * amt, rgb[1] + (255 - rgb[1]) * amt, rgb[2] + (255 - rgb[2]) * amt);
}

// ── Main component ─────────────────────────────────────────────────────────

interface GarmentPreviewProps {
    design: DesignState;
    size?: 'compact' | 'full';
}

export function GarmentPreview({ design, size = 'compact' }: GarmentPreviewProps) {
    const hasType = Boolean(design.clothingType);
    const photoUrl = getPhoto(design.clothingType, design.subcategory);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgLoaded(false);
        setImgError(false);
    }, [photoUrl]);

    const styleBadges: string[] = [
        design.length,
        design.sleeves,
        design.neckline,
    ].filter((v): v is string => Boolean(v));

    const activeElements = design.designElements.cuts.filter(c => ELEMENT_ICONS[c]);
    const sizeClass = size === 'full'
        ? 'aspect-[3/4] w-full max-w-sm mx-auto'
        : 'aspect-[3/4] w-full max-w-[240px] mx-auto';

    const bgColor = design.baseColor ? lighten(design.baseColor, 0.88) : '#F1F5F9';
    const usePhoto = photoUrl !== null && imgLoaded && !imgError;
    const useSvg = !photoUrl || imgError;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl isolate ${sizeClass}`}
            style={{ backgroundColor: bgColor }}
        >
            {!hasType ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl mb-3 select-none">✂️</span>
                    <p className="text-xs text-slate-400 font-medium">Select a garment type</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={design.clothingType + design.subcategory + design.baseColor}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* Real photo path */}
                        {photoUrl && (
                            <>
                                <img
                                    src={photoUrl}
                                    alt={`${design.subcategory ?? ''} ${design.clothingType ?? ''}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    onLoad={() => setImgLoaded(true)}
                                    onError={() => setImgError(true)}
                                />
                                {/* Color tint overlay — multiply blends with the white dress */}
                                {usePhoto && design.baseColor && (
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundColor: design.baseColor,
                                            mixBlendMode: 'multiply' as const,
                                            opacity: 0.85,
                                        }}
                                    />
                                )}
                                {/* Accent gradient at top (collar/trim area) */}
                                {usePhoto && design.additionalColor && design.additionalColor !== design.baseColor && (
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background: `linear-gradient(to bottom, ${design.additionalColor}60 0%, transparent 28%)`,
                                            mixBlendMode: 'multiply' as const,
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {/* SVG silhouette fallback */}
                        {useSvg && (
                            <div className="absolute inset-0 flex items-center justify-center p-6">
                                <GarmentSilhouette
                                    type={design.clothingType}
                                    color={design.baseColor || '#94A3B8'}
                                    accentColor={design.additionalColor}
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Color swatch strip — top edge */}
            {hasType && (
                <div className="absolute top-0 left-0 right-0 h-1 flex z-10">
                    {[design.baseColor, design.lighterShade, design.darkerShade, design.additionalColor]
                        .filter(Boolean)
                        .map((c, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        ))}
                </div>
            )}

            {/* Style badges — bottom left */}
            {hasType && styleBadges.length > 0 && (
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
            {hasType && activeElements.length > 0 && (
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
            {hasType && design.fabric && (
                <div className="absolute bottom-3 right-3 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-slate-900/70 text-white border-slate-700/50 backdrop-blur-sm">
                        {design.fabric}
                    </span>
                </div>
            )}
        </div>
    );
}
