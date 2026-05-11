import { useState, useCallback, useMemo } from 'react';
import type {
    LayerCategory,
    Fabric,
    DesignConfiguration,
} from '../types/customizer';

interface UseCustomizerOptions {
    basePrice: number;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
}

interface UseCustomizerReturn {
    selections: Record<number, number>;
    fabricId: number | null;
    selectOption: (categoryId: number, optionId: number) => void;
    selectFabric: (fabricId: number | null) => void;
    reset: () => void;
    getConfiguration: () => DesignConfiguration;
    totalPrice: number;
}

/**
 * Manages all selection state for the customizer engine.
 *
 * Initializes each layer category to its is_default option.
 * Computes totalPrice reactively: base + option modifiers + fabric modifier.
 */
export function useCustomizer({
    basePrice,
    layerCategories,
    fabrics,
}: UseCustomizerOptions): UseCustomizerReturn {

    // Build default selections from is_default option in each category
    const buildDefaults = useCallback((): Record<number, number> => {
        const defaults: Record<number, number> = {};
        for (const category of layerCategories) {
            const def = category.options.find(o => o.is_default) ?? category.options[0];
            if (def) defaults[category.id] = def.id;
        }
        return defaults;
    }, [layerCategories]);

    const [selections, setSelections] = useState<Record<number, number>>(buildDefaults);
    const [fabricId, setFabricId]     = useState<number | null>(
        // Default to first available fabric
        () => fabrics[0]?.id ?? null
    );

    const selectOption = useCallback((categoryId: number, optionId: number) => {
        setSelections(prev => ({ ...prev, [categoryId]: optionId }));
    }, []);

    const selectFabric = useCallback((id: number | null) => {
        setFabricId(id);
    }, []);

    const reset = useCallback(() => {
        setSelections(buildDefaults());
        setFabricId(fabrics[0]?.id ?? null);
    }, [buildDefaults, fabrics]);

    const getConfiguration = useCallback((): DesignConfiguration => ({
        selections,
        fabric_id: fabricId,
    }), [selections, fabricId]);

    // Reactive total price computation
    const totalPrice = useMemo(() => {
        let total = basePrice;

        for (const category of layerCategories) {
            const selectedOptionId = selections[category.id];
            if (selectedOptionId !== undefined) {
                const option = category.options.find(o => o.id === selectedOptionId);
                if (option) total += option.price_modifier;
            }
        }

        if (fabricId !== null) {
            const fabric = fabrics.find(f => f.id === fabricId);
            if (fabric) total += fabric.price_modifier;
        }

        return Math.round(total * 100) / 100;
    }, [basePrice, layerCategories, fabrics, selections, fabricId]);

    return {
        selections,
        fabricId,
        selectOption,
        selectFabric,
        reset,
        getConfiguration,
        totalPrice,
    };
}
