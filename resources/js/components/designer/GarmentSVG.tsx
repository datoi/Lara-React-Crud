/**
 * GarmentSVG — Parametric garment renderer
 *
 * Renders a dress-form mannequin with a fully parametric garment drawn on top.
 * Every visual detail (neckline, sleeves, length, style) is computed from the
 * DesignConfig — no external PNG assets required.
 *
 * Coordinate system: viewBox 0 0 320 560 (CX = 160)
 */

import { useMemo } from 'react';
import { darken, lighten } from '../../designer/engine';
import type { DesignConfig } from '../../designer/config';

// ─── Canvas constants ─────────────────────────────────────────────────────────

const CX = 160;  // horizontal center

// ─── Mannequin anchor points ──────────────────────────────────────────────────

const SY  = 92;   // shoulder y
const LSX = 80;   // left  shoulder x  (armhole edge, sleeveless)
const RSX = 240;  // right shoulder x

// ─── Hem y per length value ───────────────────────────────────────────────────

const HEM_Y: Record<string, number> = {
    '':       455,
    crop:     218,
    short:    325,
    knee:     390,
    midi:     455,
    maxi:     528,
};

// ─── Neckline configs ─────────────────────────────────────────────────────────
// lx / rx: where the neckline meets the shoulder line (y = SY)
// apexY: how deep the neckline goes
// kind: shape of the opening

type NLKind = 'v' | 'round' | 'square' | 'straight';
interface NLCfg { lx: number; rx: number; apexY: number; kind: NLKind }

const NECKLINE_CFG: Record<string, NLCfg> = {
    '':       { lx: 124, rx: 196, apexY: 108, kind: 'round'    },
    'v-neck': { lx: 140, rx: 180, apexY: 158, kind: 'v'        },
    crew:     { lx: 124, rx: 196, apexY: 105, kind: 'round'    },
    scoop:    { lx: 112, rx: 208, apexY: 142, kind: 'round'    },
    square:   { lx: 116, rx: 204, apexY: 110, kind: 'square'   },
    collar:   { lx: 136, rx: 184, apexY:  90, kind: 'straight' },
};

/** Returns SVG path fragment that draws across the neckline opening (left→right shoulder) */
function buildNeckFragment(cfg: NLCfg): string {
    const { lx, rx, apexY, kind } = cfg;
    switch (kind) {
        case 'v':
            // straight V lines down to apex and back
            return `L ${lx} ${SY} L ${CX} ${apexY} L ${rx} ${SY}`;
        case 'square':
            // step down, across, step back up
            return `L ${lx} ${SY} L ${lx} ${apexY} L ${rx} ${apexY} L ${rx} ${SY}`;
        case 'straight':
            // shallow straight line (collar base)
            return `L ${lx} ${SY} L ${rx} ${SY}`;
        default:
            // smooth round/scoop curve
            return `L ${lx} ${SY} Q ${CX} ${apexY + 10} ${rx} ${SY}`;
    }
}

// ─── Side profile: bust / waist / hip / hem x for the RIGHT side ─────────────
// Left side is CX - (x - CX) i.e. mirrored.

interface Profile { bx: number; wx: number; hx: number; hmx: number }
const PROFILES: Record<string, Profile> = {
    'a-line': { bx: 268, wx: 232, hx: 276, hmx: 286 },
    fitted:   { bx: 266, wx: 230, hx: 248, hmx: 252 },
    wrap:     { bx: 266, wx: 232, hx: 272, hmx: 280 },
    '':       { bx: 268, wx: 232, hx: 276, hmx: 286 },
};

function mirror(x: number): number { return CX - (x - CX); }

/**
 * Builds the main garment body path.
 * Start: left armhole  →  neckline  →  right armhole  →  right side  →  hem  →  left side  →  close
 */
function buildBodyPath(
    nlCfg: NLCfg,
    profile: Profile,
    hemY: number,
    hasSleeves: boolean,
): string {
    const { bx, wx, hx, hmx } = profile;
    const lax = hasSleeves ? mirror(RSX) : LSX;  // left armhole x
    const rax = hasSleeves ? RSX           : RSX; // right armhole x

    const neckFrag = buildNeckFragment(nlCfg);

    // Right side: shoulder → bust → waist → hip → hem
    const rightSide = `
        C ${rax + 22} ${SY} ${bx + 6} 128 ${bx} 150
        C ${bx + 4} 180 ${wx + 6} 218 ${wx} 232
        C ${wx + 8} 248 ${hx - 2} 270 ${hx} 292
        C ${hx + 6} 318 ${hmx} 370 ${hmx} ${hemY}
    `.trim();

    // Left side (mirror): hem → hip → waist → bust → shoulder (going upward)
    const mbx = mirror(bx), mwx = mirror(wx), mhx = mirror(hx), mhmx = mirror(hmx);
    const leftSide = `
        L ${mhmx} ${hemY}
        C ${mhmx} 370 ${mhx + 2} 318 ${mhx} 292
        C ${mhx - 6} 270 ${mwx - 8} 248 ${mwx} 232
        C ${mwx - 6} 218 ${mbx - 4} 180 ${mbx} 150
        C ${mbx - 6} 128 ${mirror(rax) - 22} ${SY} ${lax} ${SY}
    `.trim();

    return `
        M ${lax} ${SY}
        ${neckFrag}
        L ${rax} ${SY}
        ${rightSide}
        ${leftSide}
        Z
    `.replace(/\s+/g, ' ').trim();
}

// ─── Sleeve paths ─────────────────────────────────────────────────────────────

function buildSleevePath(kind: string, side: 'left' | 'right'): string | null {
    if (!kind || kind === 'sleeveless') return null;

    const sign = side === 'right' ? 1 : -1;
    const ox = side === 'right' ? RSX : LSX;  // outer shoulder x

    // inner shoulder x (armhole start, slightly inward)
    const ix = side === 'right' ? RSX - 8 : LSX + 8;

    switch (kind) {
        case 'short': {
            const tipR = ox + sign * 46;   // sleeve tip outer x
            const tipY = 148;               // sleeve hem y
            return `
                M ${ox} ${SY}
                C ${ox + sign * 22} ${SY - 4} ${tipR} 98 ${tipR} 118
                C ${tipR} 132 ${tipR - sign * 8} ${tipY} ${tipR - sign * 14} ${tipY}
                C ${tipR - sign * 20} ${tipY} ${ix + sign * 6} 138 ${ix} 125
                L ${ix} ${SY}
                Z
            `.replace(/\s+/g, ' ').trim();
        }

        case 'long': {
            const topR = ox + sign * 28;    // sleeve top outer x
            const wrist = ox + sign * 14;   // wrist outer x
            const wristI = ix + sign * 4;   // wrist inner x
            return `
                M ${ox} ${SY}
                C ${ox + sign * 22} ${SY - 4} ${topR + sign * 4} 108 ${topR} 128
                L ${wrist} 388
                C ${wrist} 396 ${wristI} 398 ${wristI} 390
                L ${ix + sign * 4} 130
                C ${ix + sign * 10} 112 ${ix + sign * 5} ${SY} ${ix} ${SY}
                Z
            `.replace(/\s+/g, ' ').trim();
        }

        case 'three-quarter': {
            const topR = ox + sign * 28;
            const wrist = ox + sign * 14;
            const wristI = ix + sign * 4;
            return `
                M ${ox} ${SY}
                C ${ox + sign * 22} ${SY - 4} ${topR + sign * 4} 108 ${topR} 128
                L ${wrist} 298
                C ${wrist} 308 ${wristI} 310 ${wristI} 302
                L ${ix + sign * 4} 130
                C ${ix + sign * 10} 112 ${ix + sign * 5} ${SY} ${ix} ${SY}
                Z
            `.replace(/\s+/g, ' ').trim();
        }

        case 'bell': {
            const topR = ox + sign * 28;
            const flare = ox + sign * 52;   // bell flare outer
            const flareI = ix + sign * 26;  // bell flare inner
            return `
                M ${ox} ${SY}
                C ${ox + sign * 22} ${SY - 4} ${topR + sign * 4} 108 ${topR} 128
                L ${topR + sign * 2} 275
                C ${topR + sign * 10} 295 ${flare} 318 ${flare} 330
                C ${flare} 342 ${flareI + sign * 2} 342 ${flareI} 330
                C ${flareI} 318 ${ix + sign * 18} 295 ${ix + sign * 4} 275
                L ${ix + sign * 4} 130
                C ${ix + sign * 10} 112 ${ix + sign * 5} ${SY} ${ix} ${SY}
                Z
            `.replace(/\s+/g, ' ').trim();
        }

        default:
            return null;
    }
}

// ─── Collar piece ─────────────────────────────────────────────────────────────

function buildCollarPath(side: 'left' | 'right'): string {
    if (side === 'right') {
        return `M 160 88 C 168 85 178 82 184 84 C 190 86 192 92 188 98
                C 182 105 170 108 162 108 L 160 98 Z`;
    }
    return `M 160 88 C 152 85 142 82 136 84 C 130 86 128 92 132 98
            C 138 105 150 108 158 108 L 160 98 Z`;
}

// ─── Wrap overlap seam ────────────────────────────────────────────────────────

function buildWrapSeam(): string {
    // A diagonal seam from upper-right bodice area down to lower-left hem area
    return `M 172 100 C 178 145 182 190 190 232 C 196 270 196 310 192 355`;
}

// ─── Fabric texture ───────────────────────────────────────────────────────────

/** Subtle diagonal hash lines for a light texture feel */
function FabricPattern({ id, color }: { id: string; color: string }) {
    const lineColor = darken(color, 0.08);
    return (
        <defs>
            <pattern id={id} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="18" stroke={lineColor} strokeWidth="0.6" strokeOpacity="0.25" />
            </pattern>
        </defs>
    );
}

// ─── Shadow / shading gradients ───────────────────────────────────────────────

function ShadingDefs({ id, color }: { id: string; color: string }) {
    const darkEdge = darken(color, 0.28);
    const lightEdge = lighten(color, 0.18);
    return (
        <defs>
            <linearGradient id={`${id}-shade`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={darkEdge}  stopOpacity="0.55" />
                <stop offset="20%"  stopColor={darkEdge}  stopOpacity="0.12" />
                <stop offset="55%"  stopColor={lightEdge} stopOpacity="0.10" />
                <stop offset="80%"  stopColor={darkEdge}  stopOpacity="0.10" />
                <stop offset="100%" stopColor={darkEdge}  stopOpacity="0.50" />
            </linearGradient>
            <linearGradient id={`${id}-hilight`} x1="38%" y1="0%" x2="62%" y2="100%">
                <stop offset="0%"  stopColor={lightEdge} stopOpacity="0.32" />
                <stop offset="60%" stopColor={lightEdge} stopOpacity="0" />
            </linearGradient>
        </defs>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GarmentSVGProps {
    config:  DesignConfig;
    /** compact = smaller display size, full = larger display */
    size?:   'compact' | 'full';
}

export function GarmentSVG({ config, size = 'full' }: GarmentSVGProps) {
    const { garmentType, style, baseColor, accentColor, components } = config;

    const color  = baseColor  || '#6B7280';
    const accent = accentColor || lighten(color, 0.2);

    const nlKey  = components.neckline || '';
    const slKey  = components.sleeves  || '';
    const lenKey = components.length   || '';

    const hemY    = HEM_Y[lenKey]   ?? HEM_Y[''];
    const nlCfg   = NECKLINE_CFG[nlKey]   ?? NECKLINE_CFG[''];
    const profile = PROFILES[style] ?? PROFILES[''];

    const hasSleeves = Boolean(slKey && slKey !== 'sleeveless');

    const { bodyPath, rSleevePath, lSleevePath } = useMemo(() => ({
        bodyPath:    buildBodyPath(nlCfg, profile, hemY, hasSleeves),
        rSleevePath: buildSleevePath(slKey, 'right'),
        lSleevePath: buildSleevePath(slKey, 'left'),
    }), [nlCfg, profile, hemY, hasSleeves, slKey]);

    const uid  = `g-${style}-${nlKey}-${slKey}-${lenKey}`;
    const shad = darken(color, 0.18);
    const form = '#E2E5EA';   // mannequin form color
    const formShadow = '#CBD0DA';

    // Clip path so garment never bleeds outside canvas
    const clipId = `clip-${uid}`;

    const aspectRatio = size === 'compact' ? '3/4' : '9/16';
    const clampHeight = size === 'compact' ? 420   : 560;

    // Show empty state when no garment type selected
    if (!garmentType) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-slate-300">
                <svg viewBox="0 0 80 80" width="56" height="56">
                    <circle cx="40" cy="40" r="38" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
                    <path d="M 28 35 L 40 52 L 52 35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="40" cy="26" r="5" fill="currentColor" opacity="0.4" />
                </svg>
                <p className="text-xs mt-2 font-medium">Select a garment type</p>
            </div>
        );
    }

    return (
        <svg
            viewBox="0 0 320 560"
            xmlns="http://www.w3.org/2000/svg"
            style={{ maxHeight: clampHeight, width: '100%', display: 'block' }}
            aria-label="Garment preview"
        >
            <ShadingDefs id={uid} color={color} />
            <FabricPattern id={`pat-${uid}`} color={color} />

            <defs>
                <clipPath id={clipId}>
                    <rect x="0" y="0" width="320" height="560" />
                </clipPath>
                {/* Drop shadow filter for form */}
                <filter id="form-shadow" x="-5%" y="-5%" width="110%" height="115%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00000022" />
                </filter>
            </defs>

            <g clipPath={`url(#${clipId})`}>

                {/* ── 1. Mannequin dress form (background) ── */}
                <g filter="url(#form-shadow)">
                    {/* Form top cap */}
                    <ellipse cx="160" cy="52" rx="44" ry="14" fill={form} />

                    {/* Form body */}
                    <path
                        d={`
                            M 160 60
                            C 183 60 207 68 222 80
                            C 244 94 260 112 266 134
                            C 274 155 270 183 260 206
                            C 250 228 234 236 224 242
                            C 240 252 264 272 272 294
                            C 280 316 274 338 260 350
                            L 240 358 C 210 364 110 364 80 358 L 60 350
                            C 46 338 40 316 48 294
                            C 56 272 80 252 96 242
                            C 86 236 70 228 60 206
                            C 50 183 46 155 54 134
                            C 60 112 76 94 98 80
                            C 113 68 137 60 160 60 Z
                        `}
                        fill={form}
                    />

                    {/* Form subtle shading */}
                    <path
                        d={`
                            M 160 60
                            C 183 60 207 68 222 80
                            C 244 94 260 112 266 134
                            C 274 155 270 183 260 206
                            C 250 228 234 236 224 242
                            C 240 252 264 272 272 294
                            C 280 316 274 338 260 350
                            L 240 358 C 210 364 110 364 80 358 L 60 350
                            C 46 338 40 316 48 294
                            C 56 272 80 252 96 242
                            C 86 236 70 228 60 206
                            C 50 183 46 155 54 134
                            C 60 112 76 94 98 80
                            C 113 68 137 60 160 60 Z
                        `}
                        fill="none"
                        stroke={formShadow}
                        strokeWidth="1"
                        opacity="0.6"
                    />

                    {/* Stand post */}
                    <rect x="148" y="358" width="24" height="88" rx="4" fill={form} />
                    {/* Stand base platform */}
                    <ellipse cx="160" cy="448" rx="72" ry="16" fill={form} />
                    <ellipse cx="160" cy="446" rx="70" ry="12" fill={formShadow} opacity="0.25" />
                </g>

                {/* ── 2. Left sleeve (behind dress body) ── */}
                {lSleevePath && (
                    <>
                        <path d={lSleevePath} fill={color} />
                        <path d={lSleevePath} fill={`url(#${uid}-shade)`} />
                        <path d={lSleevePath} fill={`url(#pat-${uid})`} opacity="0.35" />
                    </>
                )}

                {/* ── 3. Garment main body ── */}
                <path d={bodyPath} fill={color} />

                {/* Fabric texture overlay */}
                <path d={bodyPath} fill={`url(#pat-${uid})`} opacity="0.35" />

                {/* Side shading */}
                <path d={bodyPath} fill={`url(#${uid}-shade)`} />

                {/* Center highlight */}
                <path d={bodyPath} fill={`url(#${uid}-hilight)`} />

                {/* ── 4. Right sleeve (in front of dress body) ── */}
                {rSleevePath && (
                    <>
                        <path d={rSleevePath} fill={color} />
                        <path d={rSleevePath} fill={`url(#${uid}-shade)`} />
                        <path d={rSleevePath} fill={`url(#pat-${uid})`} opacity="0.35" />
                    </>
                )}

                {/* ── 5. Style-specific details ── */}

                {/* Wrap style: diagonal overlap seam */}
                {style === 'wrap' && (
                    <path
                        d={buildWrapSeam()}
                        fill="none"
                        stroke={shad}
                        strokeWidth="1.5"
                        strokeOpacity="0.45"
                        strokeDasharray="none"
                    />
                )}

                {/* Fitted style: side-seam line */}
                {style === 'fitted' && (
                    <>
                        <path
                            d={`M 228 ${SY + 8} C 235 148 234 228 236 290 L 238 ${hemY}`}
                            fill="none" stroke={shad} strokeWidth="1" strokeOpacity="0.3"
                        />
                        <path
                            d={`M ${mirror(228)} ${SY + 8} C ${mirror(235)} 148 ${mirror(234)} 228 ${mirror(236)} 290 L ${mirror(238)} ${hemY}`}
                            fill="none" stroke={shad} strokeWidth="1" strokeOpacity="0.3"
                        />
                    </>
                )}

                {/* Collar piece */}
                {(nlKey === 'collar') && (
                    <>
                        <path d={buildCollarPath('right')} fill={accent} opacity="0.9" />
                        <path d={buildCollarPath('left')}  fill={accent} opacity="0.9" />
                        {/* collar fold lines */}
                        <path d="M 160 88 L 160 108" stroke={shad} strokeWidth="1" strokeOpacity="0.4" />
                    </>
                )}

                {/* Accent color: neckline trim line */}
                {accent !== color && nlKey !== 'collar' && (
                    <path
                        d={`M ${nlCfg.lx} ${SY} ${buildNeckFragment(nlCfg).replace(/^L /, '')}`}
                        fill="none"
                        stroke={accent}
                        strokeWidth="2.5"
                        strokeOpacity="0.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Hem trim line */}
                {accent !== color && (
                    <line
                        x1={mirror(profile.hmx) + 2}
                        y1={hemY}
                        x2={profile.hmx - 2}
                        y2={hemY}
                        stroke={accent}
                        strokeWidth="2.5"
                        strokeOpacity="0.6"
                        strokeLinecap="round"
                    />
                )}

                {/* ── 6. Garment outline ── */}
                <path
                    d={bodyPath}
                    fill="none"
                    stroke={shad}
                    strokeWidth="1.2"
                    strokeOpacity="0.35"
                />
                {rSleevePath && (
                    <path d={rSleevePath} fill="none" stroke={shad} strokeWidth="1" strokeOpacity="0.3" />
                )}
                {lSleevePath && (
                    <path d={lSleevePath} fill="none" stroke={shad} strokeWidth="1" strokeOpacity="0.3" />
                )}

            </g>
        </svg>
    );
}
