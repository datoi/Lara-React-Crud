import type { TFunction } from 'i18next';
import options from '../data/tailorWork.json';

/**
 * What a tailor wants to work on: the questionnaire on registration and in the
 * dashboard. The choices are shared with the server (App\Support\TailorWork),
 * which validates and stores the answers and derives from them whether the
 * tailor receives remodel and design requests.
 */
export type RemodelType = (typeof options.remodelTypes)[number];
export type GarmentType = (typeof options.garmentTypes)[number];
export type NewGarments = (typeof options.newGarments)[number];
export type Complexity = (typeof options.complexity)[number];

export const REMODEL_TYPES = options.remodelTypes as RemodelType[];
export const GARMENT_TYPES = options.garmentTypes as GarmentType[];
export const NEW_GARMENTS = options.newGarments as NewGarments[];
export const COMPLEXITIES = options.complexity as Complexity[];
export const OTHER_MAX = options.otherMax;
export const COMMENT_MAX = options.commentMax;

/** As stored on the server (users.work_preferences). */
export interface StoredWorkAnswers {
    remodel_none: boolean;
    remodel_types: RemodelType[];
    remodel_other: string | null;
    new_garments: NewGarments;
    garment_types: GarmentType[];
    garment_other: string | null;
    complexity: Complexity | null;
    work_notes: string | null;
    platform_feedback: string | null;
}

/** As the form holds them. An "other" of null is unticked; '' is ticked and not yet typed. */
export interface WorkAnswers {
    remodel_none: boolean;
    remodel_types: RemodelType[];
    remodel_other: string | null;
    new_garments: NewGarments | '';
    garment_types: GarmentType[];
    garment_other: string | null;
    complexity: Complexity | '';
    work_notes: string;
    platform_feedback: string;
}

export type WorkAnswerErrors = Partial<Record<'remodel' | 'remodel_other' | 'new_garments' | 'garments' | 'garment_other' | 'complexity', string>>;

export const EMPTY_WORK_ANSWERS: WorkAnswers = {
    remodel_none: false,
    remodel_types: [],
    remodel_other: null,
    new_garments: '',
    garment_types: [],
    garment_other: null,
    complexity: '',
    work_notes: '',
    platform_feedback: '',
};

export function fromStored(stored: StoredWorkAnswers | null | undefined): WorkAnswers {
    if (!stored) return EMPTY_WORK_ANSWERS;

    return {
        remodel_none: stored.remodel_none,
        remodel_types: stored.remodel_types ?? [],
        remodel_other: stored.remodel_other,
        new_garments: stored.new_garments,
        garment_types: stored.garment_types ?? [],
        garment_other: stored.garment_other,
        complexity: stored.complexity ?? '',
        work_notes: stored.work_notes ?? '',
        platform_feedback: stored.platform_feedback ?? '',
    };
}

/** What is missing, as translation keys. The server checks the same again. */
export function validateWorkAnswers(a: WorkAnswers): WorkAnswerErrors {
    const errors: WorkAnswerErrors = {};

    if (!a.remodel_none && a.remodel_types.length === 0 && !a.remodel_other?.trim()) {
        errors.remodel = 'tailorWork.errorRemodel';
    }
    if (a.remodel_other !== null && !a.remodel_other.trim() && !a.remodel_none) {
        errors.remodel_other = 'tailorWork.errorOther';
    }
    if (!a.new_garments) {
        errors.new_garments = 'tailorWork.errorChoose';
    }
    if (a.new_garments === 'yes') {
        if (a.garment_types.length === 0 && !a.garment_other?.trim()) errors.garments = 'tailorWork.errorGarments';
        if (a.garment_other !== null && !a.garment_other.trim()) errors.garment_other = 'tailorWork.errorOther';
        if (!a.complexity) errors.complexity = 'tailorWork.errorChoose';
    }

    return errors;
}

export function toPayload(a: WorkAnswers) {
    const text = (value: string | null) => (value && value.trim() ? value.trim() : null);

    return {
        remodel_none: a.remodel_none,
        remodel_types: a.remodel_none ? [] : a.remodel_types,
        remodel_other: a.remodel_none ? null : text(a.remodel_other),
        new_garments: a.new_garments,
        garment_types: a.new_garments === 'yes' ? a.garment_types : [],
        garment_other: a.new_garments === 'yes' ? text(a.garment_other) : null,
        complexity: a.new_garments === 'yes' && a.complexity ? a.complexity : null,
        work_notes: text(a.work_notes),
        platform_feedback: text(a.platform_feedback),
    };
}

/** The answers as label and value lines, for the dashboard and the admin panels. */
export function workAnswerFacts(t: TFunction, a: StoredWorkAnswers): [string, string][] {
    const list = (keys: string[], other: string | null) => [...keys, ...(other ? [other] : [])].join(', ');
    const facts: [string, string][] = [
        [
            t('tailorWork.factRemodel'),
            a.remodel_none ? t('tailorWork.remodelNone') : list(a.remodel_types.map((k) => t(`tailorWork.remodel_${k}`)), a.remodel_other),
        ],
        [t('tailorWork.factNewGarments'), t(`tailorWork.new_${a.new_garments}`)],
    ];
    if (a.new_garments === 'yes') {
        facts.push([t('tailorWork.factGarments'), list(a.garment_types.map((k) => t(`tailorWork.garment_${k}`)), a.garment_other)]);
        if (a.complexity) facts.push([t('tailorWork.factComplexity'), t(`tailorWork.complexity_${a.complexity}`)]);
    }
    if (a.work_notes) facts.push([t('tailorWork.factNotes'), a.work_notes]);
    if (a.platform_feedback) facts.push([t('tailorWork.factFeedback'), a.platform_feedback]);

    return facts;
}
