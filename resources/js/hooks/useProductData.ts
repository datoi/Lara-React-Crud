import { useState, useEffect } from 'react';
import type { CustomizerProduct, Fabric, LayerCategory } from '../types/customizer';

interface ProductData {
    product: CustomizerProduct | null;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    loading: boolean;
    error: string | null;
}

/**
 * Fetches a customizer product by slug and returns all layer categories,
 * layer options, and available fabrics in a single request.
 */
export function useProductData(slug: string | undefined): ProductData {
    const [product, setProduct]               = useState<CustomizerProduct | null>(null);
    const [layerCategories, setLayerCategories] = useState<LayerCategory[]>([]);
    const [fabrics, setFabrics]               = useState<Fabric[]>([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        setLoading(true);
        setError(null);

        fetch(`/api/customizer/products/${slug}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                setProduct(data.product);
                setLayerCategories(data.layer_categories ?? []);
                setFabrics(data.fabrics ?? []);
            })
            .catch(err => {
                setError(err.message ?? 'Failed to load product.');
            })
            .finally(() => setLoading(false));
    }, [slug]);

    return { product, layerCategories, fabrics, loading, error };
}
