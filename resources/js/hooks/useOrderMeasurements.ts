import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProfileMeasurements } from './useProfileMeasurements';
import {
    PROFILE_KEYS,
    hasInvalid,
    toDraft,
    toSet,
    type MeasurementDraft,
    type MeasurementKey,
    type MeasurementSet,
} from '../lib/measurements';

/**
 * The measurements for one order: prefilled from the profile, editable for this
 * order alone, and written back to the profile only when the customer asks.
 *
 * The order's values are its own from the moment they are prefilled — the
 * snapshot submitted is what is on screen, never a reference to the profile.
 */
export function useOrderMeasurements(fields: readonly MeasurementKey[], initial?: Record<string, number | string> | null) {
    const profile = useProfileMeasurements();
    const [draft, setDraft] = useState<MeasurementDraft>(() => toDraft(initial));
    const [saveToProfile, setSaveToProfile] = useState(false);
    const prefilled = useRef(!!initial && Object.keys(initial).length > 0);

    // Prefill once, when the profile arrives, and never over what the customer
    // has already typed or brought from an earlier step.
    useEffect(() => {
        if (prefilled.current || profile.status !== 'ready') return;
        prefilled.current = true;
        setDraft(current => ({ ...toDraft(profile.saved), ...current }));
    }, [profile.status, profile.saved]);

    const setValue = useCallback((key: MeasurementKey, value: string) => {
        setDraft(current => ({ ...current, [key]: value }));
    }, []);

    const snapshot = useMemo(() => toSet(draft, fields), [draft, fields]);
    const profileFields = fields.filter(k => PROFILE_KEYS.includes(k));

    // Only offer to save what would actually change the profile.
    const differsFromProfile = profileFields.some(k => (snapshot[k] ?? null) !== (profile.saved[k] ?? null));
    const profileEmpty = Object.keys(profile.saved).length === 0;

    /**
     * Writes this order's body measurements into the profile when asked to,
     * keeping every saved field this garment did not ask about.
     */
    const commitToProfile = useCallback(async () => {
        if (!saveToProfile || !profile.canSave || !differsFromProfile) return;
        const merged: MeasurementSet = { ...profile.saved };
        for (const key of profileFields) {
            if (snapshot[key] === undefined) delete merged[key];
            else merged[key] = snapshot[key];
        }
        await profile.save(merged);
    }, [saveToProfile, profile, differsFromProfile, profileFields, snapshot]);

    return {
        fields,
        draft,
        setValue,
        snapshot,
        isEmpty: Object.keys(snapshot).length === 0,
        invalid: hasInvalid(draft, fields),
        profileStatus: profile.status,
        profileEmpty,
        canOfferSave: profile.canSave && differsFromProfile && Object.keys(snapshot).some(k => PROFILE_KEYS.includes(k as MeasurementKey)),
        saveToProfile,
        setSaveToProfile,
        commitToProfile,
    };
}

export type OrderMeasurementsState = ReturnType<typeof useOrderMeasurements>;
