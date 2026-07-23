// Section = the shopping gender a customer browses in (men | women).
// Products tagged 'unisex' surface in both. The choice is remembered PER PAGE
// (marketplace and the design studio each keep their own) and mirrored in the
// URL as ?gender= so pages are shareable.

export type Section = 'men' | 'women';

export const SECTIONS: Section[] = ['men', 'women'];

// One remembered choice per flow — picking a section in the marketplace must not
// carry over to the design studio, and vice-versa. 'upload' is only used when the
// upload flow is entered straight from the home page (`/design?upload=1`); reaching
// upload from inside the design flow keeps the 'design' memory.
export type SectionScope = 'market' | 'design' | 'upload';

function keyFor(scope: SectionScope): string {
    return `kere_section_${scope}`;
}

/** Map a target path to its section scope (marketplace / upload-from-home / design). */
export function scopeForPath(path: string): SectionScope {
    if (path.startsWith('/marketplace')) return 'market';
    if (/[?&]upload=1(?:&|$)/.test(path)) return 'upload';
    return 'design';
}

export function getSection(scope: SectionScope): Section | null {
    const v = localStorage.getItem(keyFor(scope));
    return v === 'men' || v === 'women' ? v : null;
}

export function setSection(scope: SectionScope, section: Section): void {
    localStorage.setItem(keyFor(scope), section);
}
