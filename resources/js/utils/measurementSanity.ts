const RANGES: Record<string, { min: number; max: number }> = {
    chest:  { min: 55, max: 175 },
    waist:  { min: 45, max: 165 },
    hips:   { min: 55, max: 175 },
    length: { min: 25, max: 155 },
    inseam: { min: 25, max: 110 },
};

export function measurementWarning(key: string, raw: string): string {
    const val = parseFloat(raw);
    if (!raw || isNaN(val)) return '';
    const range = RANGES[key];
    if (!range) return '';
    if (val < range.min) return "That seems a bit small! Double-check the guide to ensure you're measuring correctly.";
    if (val > range.max) return "That seems a bit large! Double-check the guide to ensure you're measuring correctly.";
    return '';
}
