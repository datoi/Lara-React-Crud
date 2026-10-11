import { useCallback, useEffect, useState } from 'react';
import type { WizardProduct } from '../components/customizer/DesignerWizard';
import type { Section } from './useSection';

interface SectionGarments {
    garments: WizardProduct[];
    loading: boolean;
    /** Whether the request failed — the caller words and translates it */
    error: boolean;
    /** Asks again, for when the last attempt failed */
    reload: () => void;
}

interface Loaded {
    section: Section;
    attempt: number;
    garments: WizardProduct[];
    error: boolean;
}

/**
 * Every garment the design studio offers one section.
 *
 * The endpoint lists only garments that have been photographed, so this is
 * also what decides which headings the studio shows. Each heading narrows the
 * list by its own product categories, since a heading may cover more than one
 * and regrouping the studio must not orphan a garment.
 *
 * A result counts only for the section and attempt it was fetched for, so the
 * render that follows a switch to men never shows the women's catalogue as if
 * it were the men's: it shows loading until the men's arrives.
 */
export function useSectionGarments(section: Section | null): SectionGarments {
    const [attempt, setAttempt] = useState(0);
    const [loaded, setLoaded] = useState<Loaded | null>(null);

    useEffect(() => {
        if (!section) return;

        let cancelled = false;
        const settle = (garments: WizardProduct[], error: boolean) => {
            if (!cancelled) setLoaded({ section, attempt, garments, error });
        };

        fetch(`/api/customizer/products?gender=${section}`)
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then(data => settle((data as { products?: WizardProduct[] }).products ?? [], false))
            .catch(() => settle([], true));

        return () => { cancelled = true; };
    }, [section, attempt]);

    const reload = useCallback(() => setAttempt(n => n + 1), []);
    const current = loaded && loaded.section === section && loaded.attempt === attempt ? loaded : null;

    return {
        garments: current?.garments ?? [],
        loading: section !== null && current === null,
        error: current?.error ?? false,
        reload,
    };
}
