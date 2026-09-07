import { useState, useEffect } from 'react';
import type { CustomizerProduct, Fabric, LayerCategory } from '../types/customizer';

interface ProductData {
    product: CustomizerProduct | null;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    loading: boolean;
    /** Whether the request failed — the caller words and translates it */
    error: boolean;
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
    const [error, setError]                   = useState(false);

    useEffect(() => {
        // Leaving the garment behind — switching heading or section both drop it
        // from the URL — has to take its catalogue with it. Holding the last one
        // would leave the wizard advancing on a garment the customer can no
        // longer see, and writing its name into an order filed under the new
        // heading's garment_type.
        if (!slug) {
            setProduct(null);
            setLayerCategories([]);
            setFabrics([]);
            setError(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(false);

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
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [slug]);

    return { product, layerCategories, fabrics, loading, error };
}
