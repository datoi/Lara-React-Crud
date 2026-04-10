/**
 * GarmentPreview — Layered Image Composition Engine
 *
 * Rendering pipeline (bottom → top):
 *  1. Base layer   — Curated Unsplash photo of a light/white garment
 *  2. Normalise    — CSS filter: grayscale(1) brightness(1.3) makes any photo
 *                    a uniform greyscale canvas so the color engine is consistent.
 *  3. Color layer  — A div with backgroundColor = user's baseColor and
 *                    mix-blend-mode: multiply. Because multiply(white, C) = C and
 *                    multiply(grey, C) = darker(C), shadows/folds are preserved.
 *  4. Accent layer — Lighter secondary overlay for collar/trim regions (opacity 0.25).
 *  5. Badge layer  — Floating style chips (length, neckline, sleeves) and design
 *                    element icons, composited above the blend so they stay readable.
 *  6. Placeholder  — Shown when the photo hasn't loaded yet, or on error.
 *
 * To swap in real production assets: replace the Unsplash URL in GARMENT_IMAGES
 * with the path to your transparent PNG (e.g. /assets/garments/dress-maxi-base.png).
 * The CSS blend stack is asset-agnostic — transparent PNGs work even better.
 */

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

// ── Asset map ──────────────────────────────────────────────────────────────────
// Values are Unsplash photo IDs (light/white garments for best color-multiply results).
// Replace any value with your own transparent PNG path when assets are ready.
const GARMENT_IMAGES: Record<string, Record<string, string>> = {
    dress: {
        Maxi:        'photo-1566479179817-e0a0b22b5ef3',
        Mini:        'photo-1539008835657-9e8e9680c956',
        'A-Line':    'photo-1595777457583-95e059d581b8',
        Wrap:        'photo-1595777457583-95e059d581b8',
        Bodycon:     'photo-1558618666-fcd25c85cd64',
        'Shirt Dress': 'photo-1595777457583-95e059d581b8',
        _default:    'photo-1566479179817-e0a0b22b5ef3',
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
        Bomber:          'photo-1591047139829-d91aecb6caea',
        Blazer:          'photo-1591047139829-d91aecb6caea',
        Puffer:          'photo-1551028719-00167b16eac5',
        'Denim Jacket':  'photo-1591047139829-d91aecb6caea',
        Trench:          'photo-1551028719-00167b16eac5',
        Windbreaker:     'photo-1591047139829-d91aecb6caea',
        _default:        'photo-1591047139829-d91aecb6caea',
    },
    scarf: {
        _default: 'photo-1520903920243-00d872a2d1c9',
    },
    hat: {
        _default: 'photo-1521369909029-2afed882baee',
    },
};

function getImageUrl(type: string | null, subcategory: string | null): string {
    const typeMap = GARMENT_IMAGES[type ?? ''] ?? {};
    const photoId = typeMap[subcategory ?? ''] ?? typeMap['_default'] ?? null;
    if (!photoId) return '';
    return `https://images.unsplash.com/${photoId}?w=600&q=80&auto=format`;
}

// ── Design element icon map ────────────────────────────────────────────────────
const ELEMENT_ICONS: Record<string, string> = {
    Pocket:      '🗂️',
    Zipper:      '🤐',
    Buttons:     '🔘',
    Pleats:      '〰️',
    Ruffle:      '🌊',
    'Belt loop': '⬤',
    Embroidery:  '🧵',
    'Lace trim': '🕸️',
};

// ── Style badge colours ────────────────────────────────────────────────────────
const BADGE = 'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border';
const BADGE_STYLE = `${BADGE} bg-white/80 text-slate-800 border-white/50 backdrop-blur-sm`;

// ── Placeholder ────────────────────────────────────────────────────────────────
function Placeholder({ type }: { type: string | null }) {
    const EMOJI: Record<string, string> = {
        dress: '👗', shirt: '👔', pants: '👖', jacket: '🧥', hat: '🧢', scarf: '🧣',
    };
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
            <span className="text-6xl mb-3 select-none">{EMOJI[type ?? ''] ?? '✂️'}</span>
            <p className="text-xs text-slate-400 font-medium">Loading preview…</p>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface GarmentPreviewProps {
    design: DesignState;
    /** compact = small card in DesignCanvas; full = large hero in FinalPreview */
    size?: 'compact' | 'full';
}

export function GarmentPreview({ design, size = 'compact' }: GarmentPreviewProps) {
    const imageUrl = getImageUrl(design.clothingType, design.subcategory);
    const [loaded, setLoaded] = useState(false);
    const [error,  setError]  = useState(false);

    // Reset load state whenever the image URL changes
    useEffect(() => { setLoaded(false); setError(false); }, [imageUrl]);

    const styleBadges = [
        design.length    && { label: design.length },
        design.sleeves   && { label: design.sleeves },
        design.neckline  && { label: design.neckline },
    ].filter(Boolean) as { label: string }[];

    const activeElements = design.designElements.cuts.filter(c => ELEMENT_ICONS[c]);

    return (
        <div
            className={`relative overflow-hidden rounded-2xl bg-slate-100 ${
                size === 'full' ? 'aspect-[3/4] w-full max-w-sm mx-auto' : 'aspect-[3/4] w-full max-w-[240px] mx-auto'
            }`}
            // isolation: isolate keeps the mix-blend-mode contained to this subtree
            style={{ isolation: 'isolate' }}
        >
            {/* ── Layer 1 & 2: Base + Color engine ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={imageUrl}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: loaded && !error ? 1 : 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Base image — normalised to greyscale for consistent color blending */}
                    <img
                        src={imageUrl}
                        alt={`${design.subcategory} ${design.clothingType}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'grayscale(1) brightness(1.25) contrast(0.9)' }}
                        onLoad={() => setLoaded(true)}
                        onError={() => setError(true)}
                    />

                    {/* Color layer — multiply blends with the greyscale base.
                        white × color = color  |  grey × color = mid-tone  |  black stays black */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor: design.baseColor || '#94A3B8',
                            mixBlendMode: 'multiply',
                            opacity: 0.82,
                        }}
                    />

                    {/* Accent layer — subtle secondary color tint (e.g. collar, trim) */}
                    {design.additionalColor && design.additionalColor !== design.baseColor && (
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(to bottom, ${design.additionalColor}55 0%, transparent 30%)`,
                                mixBlendMode: 'multiply',
                            }}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Placeholder (shown while loading or on error) ── */}
            {(!loaded || error) && <Placeholder type={design.clothingType} />}

            {/* ── Layer 3: Style badges (float bottom-left) ── */}
            {loaded && !error && styleBadges.length > 0 && (
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 max-w-[80%]">
                    {styleBadges.map(b => (
                        <span key={b.label} className={BADGE_STYLE}>{b.label}</span>
                    ))}
                </div>
            )}

            {/* ── Layer 4: Design element icons (float top-right) ── */}
            {loaded && !error && activeElements.length > 0 && (
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
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

            {/* ── Layer 5: Fabric label (bottom-right corner) ── */}
            {loaded && !error && design.fabric && (
                <div className="absolute bottom-3 right-3">
                    <span className={`${BADGE} bg-slate-900/70 text-white border-slate-700/50 backdrop-blur-sm`}>
                        {design.fabric}
                    </span>
                </div>
            )}

            {/* ── Color swatch strip (top edge) ── */}
            {loaded && !error && (
                <div className="absolute top-0 left-0 right-0 h-1 flex">
                    {[design.baseColor, design.lighterShade, design.darkerShade, design.additionalColor]
                        .filter(Boolean)
                        .map((c, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                        ))}
                </div>
            )}
        </div>
    );
}
