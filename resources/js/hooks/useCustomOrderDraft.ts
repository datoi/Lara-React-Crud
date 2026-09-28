// Persistent draft state for the custom order flow.
// Uses sessionStorage (cleared on tab close, safe within a session).
// Pattern mirrors useAuth.ts — plain functions, no React state.

export interface CustomOrderDraft {
    // Step A
    garment_type: string;
    customization: Record<string, unknown> | null; // null when upload path
    design_file_url: string | null;                // null when designer path
    measurements: Record<string, string>;          // cm values keyed chest/waist/hips/length
    customization_request: string;                 // what the customer wants modified
    tailor_notes: string;

    // Step B
    tailor_id: number | null;           // null = "Let Kere Choose"
    assignment_mode: 'manual' | 'random';

    // Derived
    estimated_price: number;
}

const DRAFT_KEY = 'kere_custom_order_draft';

const DEFAULT_DRAFT: CustomOrderDraft = {
    garment_type:          '',
    customization:         null,
    design_file_url:       null,
    measurements:          {},
    customization_request: '',
    tailor_notes:          '',
    tailor_id:        null,
    assignment_mode:  'random',
    estimated_price:  0,
};

export function getDraft(): CustomOrderDraft {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        return raw ? { ...DEFAULT_DRAFT, ...JSON.parse(raw) } : { ...DEFAULT_DRAFT };
    } catch {
        return { ...DEFAULT_DRAFT };
    }
}

export function saveDraft(patch: Partial<CustomOrderDraft>): void {
    const current = getDraft();
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearDraft(): void {
    sessionStorage.removeItem(DRAFT_KEY);
}

export function hasDraft(): boolean {
    return !!sessionStorage.getItem(DRAFT_KEY);
}
