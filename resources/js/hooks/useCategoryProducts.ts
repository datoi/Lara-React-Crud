import { useEffect, useState } from 'react';
import type { WizardProduct } from '../components/customizer/DesignerWizard';
import type { GarmentCategory } from '../data/garmentTaxonomy';
import type { Section } from './useSection';

interface CategoryProducts {
    products: WizardProduct[];
    loading: boolean;
    /** Whether the request failed — the caller words and translates it */
    error: boolean;
}

/**
 * The garments filed under one heading of the design studio.
 *
 * The endpoint returns everything catalogued for the section, so the heading's
 * own product categories do the narrowing here — a heading may cover more than
 * one, and regrouping the studio must not orphan a garment.
 */
export function useCategoryProducts(
    section: Section | null,
    category: GarmentCategory | undefined,
): CategoryProducts {
    const [products, setProducts] = useState<WizardProduct[]>([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(false);

    useEffect(() => {
        if (!section || !category) {
            setProducts([]);
            setLoading(false);
            setError(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(false);

        fetch(`/api/customizer/products?gender=${section}`)
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then(data => {
                if (cancelled) return;
                const all: WizardProduct[] = (data as { products?: WizardProduct[] }).products ?? [];
                setProducts(all.filter(p => category.productCategories.includes(p.category)));
            })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [section, category]);

    return { products, loading, error };
}
