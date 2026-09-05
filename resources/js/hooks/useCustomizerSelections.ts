// Persisted customizer selections, keyed by product slug.
// Pattern mirrors useCustomOrderDraft.ts — sessionStorage, plain functions, no
// React state. Stepping back to compare two garments and returning keeps both
// configurations, and the whole thing dies with the tab like the order draft.

export interface StoredSelections {
    selections: Record<number, number>;
    subSelections: Record<number, number>;
    colorSelections: Record<number, number>;
    fabricId: number | null;
    /**
     * The colour the customer chose, by name. Colour rows belong to the option
     * that carries the photography, so the per-option ids above cannot express
     * a colour the currently selected option was never shot in — this can.
     */
    colorName?: string | null;
}

const KEY = 'kere_customizer_selections';

type Store = Record<string, StoredSelections>;

function readStore(): Store {
    try {
        const raw = sessionStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as Store) : {};
    } catch {
        return {};
    }
}

// sessionStorage throws in private mode and when the quota is full. Persistence
// is an enhancement, not the feature, so a failed write degrades to the old
// behaviour (defaults on return) rather than surfacing an error.
function writeStore(store: Store): void {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(store));
    } catch {
        /* selections simply stop persisting */
    }
}

export function getStoredSelections(slug: string): StoredSelections | null {
    return readStore()[slug] ?? null;
}

export function storeSelections(slug: string, value: StoredSelections): void {
    writeStore({ ...readStore(), [slug]: value });
}

export function clearStoredSelections(slug: string): void {
    const store = readStore();
    delete store[slug];
    writeStore(store);
}
