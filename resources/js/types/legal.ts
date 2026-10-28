/**
 * A legal document (the terms, the privacy policy) held as data, one copy per
 * language, and drawn by LegalDocumentPage. E-mail and web addresses in the
 * text are plain strings; the page turns them into links.
 */
export type LegalBlock =
    | { type: 'p'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'ul' | 'ol'; items: string[] }
    | { type: 'table'; head: string[]; rows: string[][] };

export interface LegalSection {
    /** Anchor for the contents list, e.g. `section-7` */
    id: string;
    title: string;
    blocks: LegalBlock[];
}

export interface LegalDocument {
    title: string;
    /** Who the document is for, shown under the title */
    subtitle?: string;
    lead: string;
    /** Version and dates, shown under the title */
    meta: { label: string; value: string }[];
    /** Set on a translation: which language prevails */
    note?: string;
    /** A highlighted opening paragraph before the first section */
    summary?: string;
    sections: LegalSection[];
}
