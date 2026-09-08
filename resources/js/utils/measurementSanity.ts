const RANGES: Record<string, { min: number; max: number }> = {
    chest:  { min: 55, max: 175 },
    waist:  { min: 45, max: 165 },
    hips:   { min: 55, max: 175 },
    length: { min: 25, max: 155 },
    inseam: { min: 25, max: 110 },
};

/**
 * The i18n key for a measurement that reads implausible, or '' when it is fine.
 *
 * Returns a key rather than a sentence: this used to hand back hardcoded
 * English, which then rendered beside correctly-translated field names in the
 * Georgian UI. Callers pass the result through `t()`.
 */
export function measurementWarning(key: string, raw: string): string {
    const val = parseFloat(raw);
    if (!raw || isNaN(val)) return '';
    const range = RANGES[key];
    if (!range) return '';
    if (val < range.min) return 'measurementSanity.tooSmall';
    if (val > range.max) return 'measurementSanity.tooLarge';
    return '';
}
