import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { DesignConfig } from '../designer/config';
import { buildPreview, darken, lighten } from '../designer/engine';

// ─── SVG silhouettes ──────────────────────────────────────────────────────────

function GarmentSilhouette({ type, color, accentColor }: {
    type: string | null;
    color: string;
    accentColor?: string;
}) {
    const base   = color || '#94A3B8';
    const shadow = accentColor && accentColor !== color ? accentColor : darken(base, 0.25);
    const light  = lighten(base, 0.3);

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

    if (type === 'jacket' || type === 'coat') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 55 L12 95 L16 200 L52 180 Z" fill={base} />
            <path d="M12 95 L16 200 L22 200 L18 97 Z" fill={shadow} opacity="0.35" />
            <path d="M150 55 L188 95 L184 200 L148 180 Z" fill={base} />
            <path d="M50 55 L58 265 L142 265 L150 55 L124 38 Q100 28 76 38 Z" fill={base} />
            <path d="M76 38 L88 80 L100 68 L88 42 Z" fill={shadow} opacity="0.45" />
            <path d="M124 38 L112 80 L100 68 L112 42 Z" fill={shadow} opacity="0.35" />
            <rect x="62" y="155" width="28" height="18" fill={shadow} opacity="0.25" rx="2" />
            {type === 'coat' && (
                <path d="M60 200 L65 265 L74 265 L70 200 Z M140 200 L135 265 L126 265 L130 200 Z" fill={shadow} opacity="0.15" />
            )}
            <path d="M50 55 L58 265 L66 265 L58 57 Z" fill={shadow} opacity="0.3" />
        </svg>
    );

    if (type === 'dress') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Bodice */}
            <path d="M76 22 Q100 14 124 22 L130 85 Q100 78 70 85 Z" fill={base} />
            {/* Skirt flare */}
            <path d="M70 85 Q100 78 130 85 L148 265 L52 265 Z" fill={base} />
            {/* Shoulder straps */}
            <path d="M76 22 L68 50 L78 52 L84 28 Z" fill={shadow} opacity="0.35" />
            <path d="M124 22 L132 50 L122 52 L116 28 Z" fill={shadow} opacity="0.3" />
            {/* Waist seam */}
            <rect x="70" y="82" width="60" height="4" fill={shadow} opacity="0.2" rx="2" />
            {/* Highlight */}
            <path d="M80 90 L74 265 L82 265 L88 90 Z" fill={light} opacity="0.3" />
            <path d="M120 90 L126 265 L118 265 L112 90 Z" fill={shadow} opacity="0.15" />
        </svg>
    );

    if (type === 'skirt') return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Waistband */}
            <rect x="55" y="30" width="90" height="18" fill={shadow} rx="4" opacity="0.8" />
            {/* Skirt body */}
            <path d="M55 48 L38 265 L162 265 L145 48 Z" fill={base} />
            {/* Highlights */}
            <path d="M70 55 L56 265 L64 265 L78 55 Z" fill={light} opacity="0.3" />
            <path d="M130 55 L144 265 L136 265 L122 55 Z" fill={shadow} opacity="0.2" />
            <rect x="98" y="48" width="4" height="217" fill={shadow} opacity="0.15" />
        </svg>
    );

    // Default rect fallback
    return (
        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="40" width="100" height="200" rx="12" fill={base} opacity="0.7" />
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GarmentPreviewProps {
    config: DesignConfig;
    size?:  'compact' | 'full';
}

export function GarmentPreview({ config, size = 'compact' }: GarmentPreviewProps) {
    const spec = buildPreview(config);
    const hasType = Boolean(config.garmentType);

    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError,  setImgError]  = useState(false);

    useEffect(() => {
        setImgLoaded(false);
        setImgError(false);
    }, [spec.photoSrc]);

    const usePhoto = spec.photoSrc !== null && imgLoaded && !imgError;

    const sizeClass = size === 'full'
        ? 'aspect-[3/4] w-full max-w-sm mx-auto'
        : 'aspect-[3/4] w-full max-w-[240px] mx-auto';

    return (
        <div
            className={`relative overflow-hidden rounded-2xl isolate ${sizeClass}`}
            style={{ backgroundColor: spec.bgColor }}
        >
            {!hasType ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl mb-3 select-none">✂️</span>
                    <p className="text-xs text-slate-400 font-medium">Select a garment type</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={config.garmentType + config.style + config.baseColor}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {spec.layers.map((layer, i) => {
                            if (layer.kind === 'photo') return (
                                <img
                                    key={i}
                                    src={layer.src}
                                    alt={`${config.style} ${config.garmentType}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={{ filter: 'contrast(1.15) brightness(1.02)' }}
                                    onLoad={() => setImgLoaded(true)}
                                    onError={() => setImgError(true)}
                                />
                            );

                            if (layer.kind === 'tint' && usePhoto) return (
                                <div
                                    key={i}
                                    className="absolute inset-0"
                                    style={{
                                        backgroundColor: layer.color,
                                        mixBlendMode: 'multiply' as const,
                                        opacity: layer.opacity,
                                    }}
                                />
                            );

                            if (layer.kind === 'accent-gradient' && usePhoto) return (
                                <div
                                    key={i}
                                    className="absolute inset-0"
                                    style={{
                                        background: `linear-gradient(to bottom, ${layer.topColor}55 0%, transparent 26%)`,
                                        mixBlendMode: 'multiply' as const,
                                    }}
                                />
                            );

                            if (layer.kind === 'overlay' && usePhoto) return (
                                <img
                                    key={i}
                                    src={layer.src}
                                    alt="style overlay"
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={{ mixBlendMode: 'multiply' as const }}
                                />
                            );

                            if (layer.kind === 'svg-fallback' || (!usePhoto && spec.photoSrc)) return (
                                <div key={i} className="absolute inset-0 flex items-center justify-center p-6">
                                    <GarmentSilhouette
                                        type={config.garmentType}
                                        color={config.baseColor || '#94A3B8'}
                                        accentColor={config.accentColor}
                                    />
                                </div>
                            );

                            return null;
                        })}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Color swatch strip */}
            {hasType && (config.baseColor || config.accentColor) && (
                <div className="absolute top-0 left-0 right-0 h-1 flex z-10">
                    {[config.baseColor, config.accentColor].filter(Boolean).map((c, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                </div>
            )}

            {/* Style badges */}
            {hasType && spec.styleBadges.length > 0 && (
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 max-w-[80%] z-10">
                    {spec.styleBadges.map(label => (
                        <span
                            key={label}
                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-white/80 text-slate-800 border-white/50 backdrop-blur-sm"
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}

            {/* Design element icons */}
            {hasType && spec.elementBadges.length > 0 && (
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
                    {spec.elementBadges.slice(0, 4).map(el => (
                        <span
                            key={el.value}
                            className="text-xs bg-white/80 backdrop-blur-sm border border-white/50 rounded-full px-2 py-0.5 text-slate-700 font-medium"
                        >
                            {el.icon} {el.label}
                        </span>
                    ))}
                    {spec.elementBadges.length > 4 && (
                        <span className="text-xs bg-white/80 backdrop-blur-sm border border-white/50 rounded-full px-2 py-0.5 text-slate-500">
                            +{spec.elementBadges.length - 4} more
                        </span>
                    )}
                </div>
            )}

            {/* Fabric label */}
            {hasType && spec.fabricLabel && (
                <div className="absolute bottom-3 right-3 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-slate-900/70 text-white border-slate-700/50 backdrop-blur-sm">
                        {spec.fabricLabel}
                    </span>
                </div>
            )}
        </div>
    );
}
