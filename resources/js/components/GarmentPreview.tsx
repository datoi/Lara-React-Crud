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

// ── Asset registry ─────────────────────────────────────────────────────────
// Base layer paths: always a white-on-white ghost-mannequin PNG.
// Overlay paths: transparent PNGs for specific style details (sleeves, etc.).
// Set value to null when the asset doesn't exist yet — shows "Coming Soon" chip.

const BASE_LAYERS: Record<string, Record<string, string>> = {
    dress: {
        _default: '/assets/garments/maxi-base.png',
        Maxi:     '/assets/garments/maxi-base.png',
        Mini:     '/assets/garments/maxi-base.png',
        'A-Line': '/assets/garments/maxi-base.png',
        Wrap:     '/assets/garments/maxi-base.png',
        Bodycon:  '/assets/garments/maxi-base.png',
        'Shirt Dress': '/assets/garments/maxi-base.png',
    },
};

// Overlay assets for style details — null = not yet produced.
// Key format: `${clothingType}/${subcategory}/${detailKey}/${detailValue}`
// Example: 'dress/_default/sleeves/Long' -> '/assets/garments/overlays/dress-sleeves-long.png'
const OVERLAY_LAYERS: Record<string, string | null> = {
    // Long-sleeve overlay for dress — coming soon
    'dress/sleeves/Long':           null,
    'dress/sleeves/Three-quarter':  null,
    'dress/sleeves/Bell':           null,
    // These exist as the base already shows short sleeves
    'dress/sleeves/Short':          null,
    'dress/sleeves/Cap':            null,
    'dress/sleeves/Sleeveless':     null,
};

function getBaseLayer(type: string | null, sub: string | null): string | null {
    if (!type) return null;
    const typeMap = BASE_LAYERS[type];
    if (!typeMap) return null;
    return (sub ? typeMap[sub] : undefined) ?? typeMap['_default'] ?? null;
}

function getOverlayKey(type: string | null, detailKey: string, detailValue: string): string {
    return `${type}/${detailKey}/${detailValue}`;
}

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
            <path d="M50 55 L58 265 L142 265 L150 55 L124 38 Q100 28 76 38 Z" fill={base} />
            <path d="M76 38 L88 80 L100 68 L88 42 Z" fill={shadow} opacity="0.45" />
            <path d="M124 38 L112 80 L100 68 L112 42 Z" fill={shadow} opacity="0.35" />
            <rect x="62" y="155" width="28" height="18" fill={shadow} opacity="0.25" rx="2" />
            <path d="M50 55 L58 265 L66 265 L58 57 Z" fill={shadow} opacity="0.3" />
        </svg>
    );

    if (type === 'hat') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="185" rx="85" ry="18" fill={shadow} opacity="0.7" />
            <path d="M45 185 Q48 95 100 85 Q152 95 155 185 Z" fill={base} />
            <ellipse cx="100" cy="88" rx="28" ry="10" fill={base} />
            <path d="M72 100 Q68 140 65 183 L72 182 Q74 143 78 103 Z" fill={light} opacity="0.4" />
        </svg>
    );

    if (type === 'scarf') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M70 20 Q100 15 130 20 L140 80 Q100 75 60 80 Z" fill={base} />
            <path d="M60 80 Q100 75 140 80 L145 260 L130 260 L125 100 Q100 96 75 100 L70 260 L55 260 Z" fill={base} />
        </svg>
    );

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

// ── Coming-soon chip for missing overlays ──────────────────────────────────

function ComingSoonChip({ label }: { label: string }) {
    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-800/70 text-white/80 backdrop-blur-sm border border-white/10 whitespace-nowrap">
                {label} preview coming soon
            </span>
        </div>
    );
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

// ── Main component ─────────────────────────────────────────────────────────

interface GarmentPreviewProps {
    design: DesignState;
    size?: 'compact' | 'full';
}

export function GarmentPreview({ design, size = 'compact' }: GarmentPreviewProps) {
    const hasType = Boolean(design.clothingType);
    const baseLayer = getBaseLayer(design.clothingType, design.subcategory);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError]   = useState(false);

    useEffect(() => {
        setImgLoaded(false);
        setImgError(false);
    }, [baseLayer]);

    // Determine which overlay slots are requested and whether the asset exists
    const sleeveKey  = design.sleeves  ? getOverlayKey(design.clothingType, 'sleeves',  design.sleeves)  : null;
    const overlayAsset = sleeveKey ? (OVERLAY_LAYERS[sleeveKey] ?? null) : null;
    const overlayMissing = sleeveKey !== null && overlayAsset === null && design.sleeves !== '';

    const usePhoto = baseLayer !== null && imgLoaded && !imgError;
    const useSvg   = !baseLayer || imgError;

    const styleBadges = [design.length, design.sleeves, design.neckline]
        .filter((v): v is string => Boolean(v));
    const activeElements = design.designElements.cuts.filter(c => ELEMENT_ICONS[c]);

    const sizeClass = size === 'full'
        ? 'aspect-[3/4] w-full max-w-sm mx-auto'
        : 'aspect-[3/4] w-full max-w-[240px] mx-auto';

    const bgColor = design.baseColor ? lighten(design.baseColor, 0.92) : '#F8FAFC';

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
                        {/* ── Layer 0: Base ghost-mannequin photo ── */}
                        {baseLayer && (
                            <img
                                src={baseLayer}
                                alt={`${design.subcategory ?? ''} ${design.clothingType ?? ''}`}
                                className="absolute inset-0 w-full h-full object-contain"
                                style={{
                                    // Boost contrast so fabric folds pop through the color overlay
                                    filter: 'contrast(1.15) brightness(1.02)',
                                }}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgError(true)}
                            />
                        )}

                        {/* ── Layer 1: Color tint via multiply ── */}
                        {/* multiply: white*color=color, grey*color=shadow-tone, black stays black.
                            Fabric fold shadows are preserved because dark pixels are untouched. */}
                        {usePhoto && design.baseColor && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundColor: design.baseColor,
                                    mixBlendMode: 'multiply' as const,
                                    opacity: 0.88,
                                }}
                            />
                        )}

                        {/* ── Layer 2: Accent gradient at collar/trim ── */}
                        {usePhoto && design.additionalColor && design.additionalColor !== design.baseColor && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(to bottom, ${design.additionalColor}55 0%, transparent 26%)`,
                                    mixBlendMode: 'multiply' as const,
                                }}
                            />
                        )}

                        {/* ── Layer 3: Style-detail overlay (e.g. long sleeves PNG) ── */}
                        {usePhoto && overlayAsset && (
                            <img
                                src={overlayAsset}
                                alt="style overlay"
                                className="absolute inset-0 w-full h-full object-contain"
                                style={{ mixBlendMode: 'multiply' as const }}
                            />
                        )}

                        {/* ── SVG silhouette fallback ── */}
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

            {/* ── Coming-soon chip for missing overlay ── */}
            {usePhoto && overlayMissing && (
                <ComingSoonChip label={design.sleeves} />
            )}

            {/* ── Color swatch strip — top edge ── */}
            {hasType && (
                <div className="absolute top-0 left-0 right-0 h-1 flex z-10">
                    {[design.baseColor, design.lighterShade, design.darkerShade, design.additionalColor]
                        .filter(Boolean)
                        .map((c, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        ))}
                </div>
            )}

            {/* ── Style badges — bottom left ── */}
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

            {/* ── Design element icons — top right ── */}
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

            {/* ── Fabric label — bottom right ── */}
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
