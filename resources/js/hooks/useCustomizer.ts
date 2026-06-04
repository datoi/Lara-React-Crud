import { useState, useCallback, useMemo } from 'react';
import type {
    LayerCategory,
    LayerOption,
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
    /** Maps parentOptionId → selected childOptionId */
    subSelections: Record<number, number>;
    fabricId: number | null;
    selectOption: (categoryId: number, optionId: number) => void;
    selectSubOption: (parentOptionId: number, childOptionId: number) => void;
    reset: () => void;
    getConfiguration: () => DesignConfiguration;
    totalPrice: number;
    /** Returns the effective option to render for a category (child if sub-selected, else parent) */
    resolveOption: (category: LayerCategory) => LayerOption | null;
    selectFabric: (id: number | null) => void;
}

function firstChild(option: LayerOption): LayerOption | null {
    return option.children?.[0] ?? null;
}

export function useCustomizer({
    basePrice,
    layerCategories,
    fabrics,
}: UseCustomizerOptions): UseCustomizerReturn {

    const buildDefaults = useCallback((): Record<number, number> => {
        const defaults: Record<number, number> = {};
        for (const category of layerCategories) {
            // Only top-level options (no parent) as primary selections
            const topLevel = category.options.filter(o => !o.parent_option_id);
            const def = topLevel.find(o => o.is_default) ?? topLevel[0];
            if (def) defaults[category.id] = def.id;
        }
        return defaults;
    }, [layerCategories]);

    const buildSubDefaults = useCallback((selections: Record<number, number>): Record<number, number> => {
        const subDefaults: Record<number, number> = {};
        for (const category of layerCategories) {
            for (const option of category.options) {
                if (option.children && option.children.length > 0) {
                    const defChild = option.children.find(c => c.is_default) ?? option.children[0];
                    if (defChild) subDefaults[option.id] = defChild.id;
                }
            }
        }
        return subDefaults;
    }, [layerCategories]);

    const [selections, setSelections] = useState<Record<number, number>>(buildDefaults);
    const [subSelections, setSubSelections] = useState<Record<number, number>>(
        () => buildSubDefaults(buildDefaults())
    );
    const [fabricId, setFabricId] = useState<number | null>(
        () => fabrics[0]?.id ?? null
    );

    const selectOption = useCallback((categoryId: number, optionId: number) => {
        setSelections(prev => ({ ...prev, [categoryId]: optionId }));
        // When switching parent, auto-select first child of new parent if not already set
        setSubSelections(prev => {
            const category = layerCategories.find(c => c.id === categoryId);
            if (!category) return prev;
            const option = category.options.find(o => o.id === optionId);
            if (!option?.children?.length) return prev;
            if (prev[optionId] !== undefined) return prev; // already has a sub-selection
            const defChild = option.children.find(c => c.is_default) ?? option.children[0];
            if (!defChild) return prev;
            return { ...prev, [optionId]: defChild.id };
        });
    }, [layerCategories]);

    const selectSubOption = useCallback((parentOptionId: number, childOptionId: number) => {
        setSubSelections(prev => ({ ...prev, [parentOptionId]: childOptionId }));
    }, []);

    const selectFabric = useCallback((id: number | null) => {
        setFabricId(id);
    }, []);

    const reset = useCallback(() => {
        const defaults = buildDefaults();
        setSelections(defaults);
        setSubSelections(buildSubDefaults(defaults));
        setFabricId(fabrics[0]?.id ?? null);
    }, [buildDefaults, buildSubDefaults, fabrics]);

    const getConfiguration = useCallback((): DesignConfiguration => ({
        selections,
        fabric_id: fabricId,
    }), [selections, fabricId]);

    /**
     * Resolves which option's image the canvas should render for a category.
     * If the selected parent option has children and one is sub-selected, returns that child.
     * Otherwise returns the selected parent option.
     */
    const resolveOption = useCallback((category: LayerCategory): LayerOption | null => {
        const selectedOptionId = selections[category.id];
        const parentOption = category.options.find(o => o.id === selectedOptionId)
            ?? category.options.find(o => o.is_default)
            ?? category.options[0]
            ?? null;

        if (!parentOption) return null;

        if (parentOption.children && parentOption.children.length > 0) {
            const childId = subSelections[parentOption.id];
            const child = parentOption.children.find(c => c.id === childId)
                ?? parentOption.children[0];
            if (child) return child;
        }

        return parentOption;
    }, [selections, subSelections]);

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
        subSelections,
        fabricId,
        selectOption,
        selectSubOption,
        selectFabric,
        reset,
        getConfiguration,
        totalPrice,
        resolveOption,
    };
}
