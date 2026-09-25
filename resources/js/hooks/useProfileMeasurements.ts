import { useCallback, useEffect, useState } from 'react';
import { getAuthToken, getAuthUser } from './useAuth';
import type { MeasurementSet } from '../lib/measurements';

type Status = 'idle' | 'loading' | 'ready' | 'error';

/**
 * The signed-in customer's saved measurements: loaded once, used to prefill
 * any order that needs a fit, and saved back only when the customer says so.
 * Anyone who is not a signed-in customer simply has none.
 */
export function useProfileMeasurements() {
    const token = getAuthToken();
    const isCustomer = getAuthUser()?.role === 'customer';
    const [saved, setSaved] = useState<MeasurementSet>({});
    const [status, setStatus] = useState<Status>(isCustomer && token ? 'loading' : 'idle');

    const load = useCallback(async () => {
        if (!isCustomer || !token) return;
        setStatus('loading');
        try {
            const res = await fetch('/api/customer/measurements', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setSaved((await res.json()).measurements ?? {});
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, [isCustomer, token]);

    useEffect(() => { void load(); }, [load]);

    /** Replaces the saved set; an empty set clears it. Throws when the server refuses. */
    const save = useCallback(async (next: MeasurementSet): Promise<void> => {
        const res = await fetch('/api/customer/measurements', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
            body: JSON.stringify({ measurements: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSaved((await res.json()).measurements ?? {});
    }, [token]);

    return { saved, status, reload: load, save, canSave: isCustomer };
}
