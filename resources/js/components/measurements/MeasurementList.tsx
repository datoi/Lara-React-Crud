import { useTranslation } from 'react-i18next';
import { knownKeys, measurementLabelKey } from '../../lib/measurements';

/**
 * A stored measurement snapshot, read-only. Known fields come first in their
 * usual order; a key from older data still shows, under its own name. With
 * `emptyText`, an order without measurements says so instead of showing nothing.
 */
export function MeasurementList({ values, emptyText }: {
    values: Record<string, number | string | null> | null | undefined;
    emptyText?: string;
}) {
    const { t } = useTranslation();
    const entries = Object.entries(values ?? {}).filter(([, v]) => v !== '' && v !== null);
    const known = knownKeys(entries.map(([k]) => k));
    const ordered = [...known, ...entries.map(([k]) => k).filter(k => !(known as string[]).includes(k))];
    const lookup = Object.fromEntries(entries);

    if (ordered.length === 0) {
        return emptyText ? <p className="text-xs text-slate-500">{emptyText}</p> : null;
    }

    return (
        <ul className="flex flex-wrap gap-1.5">
            {ordered.map(key => (
                <li key={key} className="border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                    {t(measurementLabelKey(key), key)}: <span className="font-medium text-slate-900">{lookup[key]}</span> {t('measurements.cm')}
                </li>
            ))}
        </ul>
    );
}
