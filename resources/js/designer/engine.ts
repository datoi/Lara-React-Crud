/**
 * Kere Designer — Preview Engine
 *
 * Centralizes all asset paths, color derivations, and layer-building logic.
 * Components import from here — no hardcoded paths or color math in components.
 */

import type { DesignConfig, GarmentType } from './config';
import { DESIGN_DETAILS, FABRICS } from './config';

// ─── Color utilities ──────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] | null {
    const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
        .map(v => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, '0'))
        .join('');
}

export function darken(hex: string, amt: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(rgb[0] * (1 - amt), rgb[1] * (1 - amt), rgb[2] * (1 - amt));
}

export function lighten(hex: string, amt: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(
        rgb[0] + (255 - rgb[0]) * amt,
        rgb[1] + (255 - rgb[1]) * amt,
        rgb[2] + (255 - rgb[2]) * amt,
    );
}

// ─── Asset registry ───────────────────────────────────────────────────────────
// Set photo path to null when the asset doesn't exist yet → SVG fallback used.

const PHOTO_LAYERS: Record<GarmentType, Record<string, string | null>> = {
    dress:   { _default: null },
    shirt:   { _default: null },
    pants:   { _default: null },
    jacket:  { _default: null },
    skirt:   { _default: null },
    coat:    { _default: null },
};

// Overlay assets keyed by `${garmentType}/${component}/${value}`
// null = asset not yet produced
const OVERLAY_LAYERS: Record<string, string | null> = {
    'dress/sleeves/long':           null,
    'dress/sleeves/three-quarter':  null,
    'dress/sleeves/bell':           null,
};

function getPhotoSrc(type: GarmentType, style: string): string | null {
    const typeMap = PHOTO_LAYERS[type];
    if (!typeMap) return null;
    return (style ? typeMap[style] : undefined) ?? typeMap['_default'] ?? null;
}

// ─── Preview layer types ──────────────────────────────────────────────────────

export type PreviewLayer =
    | { kind: 'photo';          src: string }
    | { kind: 'tint';           color: string; opacity: number }
    | { kind: 'accent-gradient'; topColor: string }
    | { kind: 'overlay';        src: string }
    | { kind: 'svg-fallback' };

export interface ElementBadge {
    icon:  string;
    label: string;
    value: string;
}

export interface PreviewSpec {
    bgColor:       string;
    layers:        PreviewLayer[];
    styleBadges:   string[];        // e.g. ['Long', 'V-Neck', 'Midi']
    elementBadges: ElementBadge[];  // selected design details
    fabricLabel:   string;
    photoSrc:      string | null;   // null → SVG fallback
}

// ─── buildPreview ─────────────────────────────────────────────────────────────

export function buildPreview(config: DesignConfig): PreviewSpec {
    const type = config.garmentType;
    const bgColor = config.baseColor ? lighten(config.baseColor, 0.92) : '#F8FAFC';

    const photoSrc = type ? getPhotoSrc(type, config.style) : null;

    const layers: PreviewLayer[] = [];

    if (photoSrc) {
        layers.push({ kind: 'photo', src: photoSrc });

        if (config.baseColor) {
            layers.push({ kind: 'tint', color: config.baseColor, opacity: 0.88 });
        }

        if (config.accentColor && config.accentColor !== config.baseColor) {
            layers.push({ kind: 'accent-gradient', topColor: config.accentColor });
        }

        // Sleeve overlay
        const sleeveVal = config.components.sleeves;
        if (sleeveVal && type) {
            const key = `${type}/sleeves/${sleeveVal.toLowerCase()}`;
            const overlaySrc = OVERLAY_LAYERS[key];
            if (overlaySrc) {
                layers.push({ kind: 'overlay', src: overlaySrc });
            }
        }
    } else {
        layers.push({ kind: 'svg-fallback' });
    }

    // Style badges from active components
    const styleBadges = [
        config.components.length,
        config.components.sleeves,
        config.components.neckline,
    ].filter((v): v is string => Boolean(v));

    // Element badges from selected design details
    const elementBadges: ElementBadge[] = config.details
        .map(val => {
            const detail = DESIGN_DETAILS.find(d => d.value === val);
            return detail ? { icon: detail.icon, label: detail.label, value: detail.value } : null;
        })
        .filter((b): b is ElementBadge => b !== null);

    const fabricLabel = FABRICS.find(f => f.value === config.fabric)?.label ?? '';

    return { bgColor, layers, styleBadges, elementBadges, fabricLabel, photoSrc };
}
