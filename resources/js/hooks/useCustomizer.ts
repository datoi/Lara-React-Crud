import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
    LayerCategory,
    LayerOption,
    OptionColor,
    Fabric,
    DesignConfiguration,
    DesignSpecLine,
} from '../types/customizer';
import {
    clearStoredSelections,
    getStoredSelections,
    storeSelections,
    type StoredSelections,
} from './useCustomizerSelections';

interface UseCustomizerOptions {
    basePrice: number;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    /**
     * Product slug. When set, selections survive leaving and returning to the
     * garment; omit it and the hook behaves exactly as before (defaults only).
     */
    persistKey?: string;
    /**
     * A saved design being reopened. Takes precedence over the per-tab session
     * copy — the customer explicitly asked for this design, so a half-finished
     * configuration left in the tab must not win over it.
     */
    savedConfiguration?: DesignConfiguration | null;
}

// ─── Restoring stored ids ─────────────────────────────────────────────────────
// A stored id is only trustworthy if the option still exists — reseeding the
// catalogue renumbers everything. Anything unrecognised falls back to the
// default for that category instead of selecting nothing.

function restoreSelections(
    stored: Record<number, number> | undefined,
    defaults: Record<number, number>,
    layerCategories: LayerCategory[],
): Record<number, number> {
    if (!stored) return defaults;
    const merged = { ...defaults };
    for (const category of layerCategories) {
        const optionId = stored[category.id];
        if (optionId !== undefined && category.options.some(o => o.id === optionId)) {
            merged[category.id] = optionId;
        }
    }
    return merged;
}

function restoreSubSelections(
    stored: Record<number, number> | undefined,
    defaults: Record<number, number>,
    layerCategories: LayerCategory[],
): Record<number, number> {
    if (!stored) return defaults;
    const merged = { ...defaults };
    for (const category of layerCategories) {
        for (const option of category.options) {
            const childId = stored[option.id];
            if (childId !== undefined && option.children?.some(c => c.id === childId)) {
                merged[option.id] = childId;
            }
        }
    }
    return merged;
}

function restoreColorSelections(
    stored: Record<number, number> | undefined,
    defaults: Record<number, number>,
    layerCategories: LayerCategory[],
): Record<number, number> {
    if (!stored) return defaults;
    const merged = { ...defaults };
    const apply = (option: LayerOption) => {
        const colorId = stored[option.id];
        if (colorId !== undefined && option.colors?.some(c => c.id === colorId)) {
            merged[option.id] = colorId;
        }
        option.children?.forEach(apply);
    };
    for (const category of layerCategories) {
        category.options.forEach(apply);
    }
    return merged;
}

interface UseCustomizerReturn {
    selections: Record<number, number>;
    /** Maps parentOptionId → selected childOptionId */
    subSelections: Record<number, number>;
    /** Maps optionId → selected colour variant id */
    colorSelections: Record<number, number>;
    fabricId: number | null;
    selectOption: (categoryId: number, optionId: number) => void;
    selectSubOption: (parentOptionId: number, childOptionId: number) => void;
    selectColor: (optionId: number, colorId: number) => void;
    reset: () => void;
    getConfiguration: () => DesignConfiguration;
    totalPrice: number;
    /** Returns the effective option to render for a category (child if sub-selected, else parent) */
    resolveOption: (category: LayerCategory) => LayerOption | null;
    /** Returns the selected colour variant of an option, or null when it has none */
    resolveColor: (option: LayerOption) => OptionColor | null;
    selectFabric: (id: number | null) => void;
}


export function useCustomizer({
    basePrice,
    layerCategories,
    fabrics,
    persistKey,
    savedConfiguration,
}: UseCustomizerOptions): UseCustomizerReturn {

    // Read once per garment. Later writes must not re-hydrate and overwrite
    // what the customer is actively choosing. A reopened saved design wins over
    // whatever the tab happened to be holding.
    const restored: StoredSelections | null = useMemo(() => {
        if (savedConfiguration) {
            return {
                selections: savedConfiguration.selections ?? {},
                subSelections: savedConfiguration.sub_selections ?? {},
                colorSelections: savedConfiguration.color_selections ?? {},
                fabricId: savedConfiguration.fabric_id ?? null,
            };
        }
        return persistKey ? getStoredSelections(persistKey) : null;
    }, [savedConfiguration, persistKey]);

    const buildDefaults = useCallback((): Record<number, number> => {
        const defaults: Record<number, number> = {};
        for (const category of layerCategories) {
            // category.options is already top-level only — the API relation
            // filters parent_option_id, and sub-options arrive under children.
            const def = category.options.find(o => o.is_default) ?? category.options[0];
            if (def) defaults[category.id] = def.id;
        }
        return defaults;
    }, [layerCategories]);

    const buildSubDefaults = useCallback((): Record<number, number> => {
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

    const buildColorDefaults = useCallback((): Record<number, number> => {
        const defaults: Record<number, number> = {};
        const apply = (option: LayerOption) => {
            if (option.colors && option.colors.length > 0) {
                const def = option.colors.find(c => c.is_default) ?? option.colors[0];
                defaults[option.id] = def.id;
            }
            option.children?.forEach(apply);
        };
        for (const category of layerCategories) {
            category.options.forEach(apply);
        }
        return defaults;
    }, [layerCategories]);

    const [selections, setSelections] = useState<Record<number, number>>(
        () => restoreSelections(restored?.selections, buildDefaults(), layerCategories)
    );
    const [subSelections, setSubSelections] = useState<Record<number, number>>(
        () => restoreSubSelections(restored?.subSelections, buildSubDefaults(), layerCategories)
    );
    const [colorSelections, setColorSelections] = useState<Record<number, number>>(
        () => restoreColorSelections(restored?.colorSelections, buildColorDefaults(), layerCategories)
    );
    const [fabricId, setFabricId] = useState<number | null>(() => {
        const stored = restored?.fabricId;
        return stored !== undefined && stored !== null && fabrics.some(f => f.id === stored)
            ? stored
            : fabrics[0]?.id ?? null;
    });

    // Mirror every change back to the store so returning to this garment — via
    // browser back, a re-visit, or a reload — restores the configuration.
    useEffect(() => {
        if (!persistKey) return;
        storeSelections(persistKey, { selections, subSelections, colorSelections, fabricId });
    }, [persistKey, selections, subSelections, colorSelections, fabricId]);

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

    const selectColor = useCallback((optionId: number, colorId: number) => {
        setColorSelections(prev => ({ ...prev, [optionId]: colorId }));
    }, []);

    const selectFabric = useCallback((id: number | null) => {
        setFabricId(id);
    }, []);

    const reset = useCallback(() => {
        // Drop the stored copy first — the effect above re-saves the defaults,
        // so Reset genuinely returns to a clean garment rather than restoring.
        if (persistKey) clearStoredSelections(persistKey);
        const defaults = buildDefaults();
        setSelections(defaults);
        setSubSelections(buildSubDefaults());
        setColorSelections(buildColorDefaults());
        setFabricId(fabrics[0]?.id ?? null);
    }, [persistKey, buildDefaults, buildSubDefaults, buildColorDefaults, fabrics]);


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

    const resolveColor = useCallback((option: LayerOption): OptionColor | null => {
        if (!option.colors || option.colors.length === 0) return null;

        return option.colors.find(c => c.id === colorSelections[option.id])
            ?? option.colors.find(c => c.is_default)
            ?? option.colors[0];
    }, [colorSelections]);

    /**
     * Readable snapshot of the current choices, taken at the moment the design
     * is ordered or saved. Uses the effective option, so a sub-selected child
     * wins over its parent, and folds the chosen colour into the style line.
     */
    const buildSpec = useCallback((): DesignSpecLine[] => {
        const lines: DesignSpecLine[] = [];
        for (const category of layerCategories) {
            const option = resolveOption(category);
            if (!option) continue;
            const colour = resolveColor(option);
            lines.push({
                attribute: category.name,
                option: colour ? `${option.name} — ${colour.name}` : option.name,
                price_modifier: option.price_modifier,
            });
        }
        return lines;
    }, [layerCategories, resolveOption, resolveColor]);

    const getConfiguration = useCallback((): DesignConfiguration => ({
        selections,
        color_selections: colorSelections,
        sub_selections: subSelections,
        fabric_id: fabricId,
        spec: buildSpec(),
    }), [selections, colorSelections, subSelections, fabricId, buildSpec]);

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
        colorSelections,
        fabricId,
        selectOption,
        selectSubOption,
        selectColor,
        selectFabric,
        reset,
        getConfiguration,
        totalPrice,
        resolveOption,
        resolveColor,
    };
}
