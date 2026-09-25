import definition from '../data/measurements.json';

/**
 * Body and garment measurements in centimetres — the frontend half of the one
 * definition in data/measurements.json, which the API validates against too.
 */

export type MeasurementKey = 'chest' | 'waist' | 'hips' | 'shoulder' | 'sleeve' | 'inseam' | 'length';

/** A saved or submitted set: key → centimetres. */
export type MeasurementSet = Partial<Record<MeasurementKey, number>>;

/** What a form holds while the customer types. */
export type MeasurementDraft = Partial<Record<MeasurementKey, string>>;

interface FieldDefinition {
    key: MeasurementKey;
    min: number;
    max: number;
    /** Saved to the profile; garment length is asked per order only */
    profile: boolean;
}

export const MEASUREMENT_FIELDS = definition.fields as FieldDefinition[];

const ALL_KEYS = MEASUREMENT_FIELDS.map(f => f.key);

export const PROFILE_KEYS = MEASUREMENT_FIELDS.filter(f => f.profile).map(f => f.key);

const GARMENT_FIELDS = definition.garmentFields as Record<string, MeasurementKey[]>;
const GARMENT_TYPES = definition.garmentTypes as Record<string, string>;

/**
 * The fields a garment is made from. A product's own required list wins when
 * its tailor set one; otherwise the garment type decides, and anything
 * unrecognised — a remodel of an unnamed garment — asks for every body field.
 */
export function fieldsFor(garmentType: string | null | undefined, required: string[] = []): MeasurementKey[] {
    const own = knownKeys(required);
    if (own.length > 0) return own;

    const group = garmentType ? GARMENT_TYPES[garmentType] : undefined;
    return group ? GARMENT_FIELDS[group] : PROFILE_KEYS;
}

/** The keys in a list this app can collect, in display order. */
export function knownKeys(keys: readonly string[]): MeasurementKey[] {
    return ALL_KEYS.filter(k => keys.includes(k));
}

/** A field's accepted range, for the messages that quote it. */
export function rangeOf(key: MeasurementKey): { min: number; max: number } {
    const field = MEASUREMENT_FIELDS.find(f => f.key === key);
    return { min: field?.min ?? 0, max: field?.max ?? 0 };
}

/** The i18n key for a value outside its accepted range, or '' when fine. Pass rangeOf(key) to t(). */
export function measurementWarning(key: MeasurementKey, raw: string | undefined): string {
    if (!raw) return '';
    const value = Number(raw);
    const field = MEASUREMENT_FIELDS.find(f => f.key === key);
    if (!field) return '';
    if (Number.isNaN(value)) return 'measurements.notANumber';
    if (value < field.min) return 'measurements.tooSmall';
    if (value > field.max) return 'measurements.tooLarge';
    return '';
}

/** Whether any value in a draft would be refused. */
export function hasInvalid(draft: MeasurementDraft, keys: readonly MeasurementKey[] = ALL_KEYS): boolean {
    return keys.some(k => measurementWarning(k, draft[k]) !== '');
}

/** A draft as it is submitted: blanks dropped, numbers as numbers, limited to `keys`. */
export function toSet(draft: MeasurementDraft, keys: readonly MeasurementKey[] = ALL_KEYS): MeasurementSet {
    const set: MeasurementSet = {};
    for (const key of keys) {
        const raw = draft[key]?.trim();
        if (raw) set[key] = Number(raw);
    }
    return set;
}

/** A stored set as form values. Unknown keys from older data are dropped. */
export function toDraft(set: Record<string, number | string> | null | undefined): MeasurementDraft {
    const draft: MeasurementDraft = {};
    for (const key of ALL_KEYS) {
        const value = set?.[key];
        if (value !== undefined && value !== null && value !== '') draft[key] = String(value);
    }
    return draft;
}

/** The i18n key naming a measurement; older stored keys fall back to themselves. */
export const measurementLabelKey = (key: string) => `measurements.fields.${key}`;
