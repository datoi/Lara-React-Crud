import { useState } from 'react';
import { CheckCircle2, Loader2, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { MeasurementFields } from './MeasurementFields';
import { useProfileMeasurements } from '../../hooks/useProfileMeasurements';
import { PROFILE_KEYS, hasInvalid, measurementLabelKey, toDraft, toSet, type MeasurementDraft, type MeasurementSet } from '../../lib/measurements';

/**
 * The customer's saved body measurements, kept once so every order that needs
 * a fit starts filled in. Editing here never touches orders already placed —
 * each keeps the values it was sent with.
 */
export function MyMeasurements() {
    const { t } = useTranslation();
    const { saved, status, reload, save } = useProfileMeasurements();
    const [editing, setEditing] = useState<MeasurementDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<'saved' | 'cleared' | 'error' | null>(null);

    const savedKeys = PROFILE_KEYS.filter(k => saved[k] !== undefined);

    const persist = async (next: MeasurementSet, outcome: 'saved' | 'cleared') => {
        setSaving(true);
        setFeedback(null);
        try {
            await save(next);
            setEditing(null);
            setFeedback(outcome);
        } catch {
            setFeedback('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6" aria-labelledby="my-measurements-title">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 id="my-measurements-title" className="font-semibold text-slate-900">{t('measurements.profileTitle')}</h2>
                    <p className="mt-1 text-xs text-slate-500">{t('measurements.profileHint')}</p>
                </div>
                {status === 'ready' && !editing && savedKeys.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => { setFeedback(null); setEditing(toDraft(saved)); }}>
                        {t('measurements.edit')}
                    </Button>
                )}
            </div>

            <div className="mt-4">
                {status === 'loading' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label={t('measurements.loadingProfile')} />
                ) : status === 'error' ? (
                    <div>
                        <p className="text-sm text-destructive">{t('measurements.loadFailed')}</p>
                        <Button variant="outline" size="sm" onClick={() => void reload()} className="mt-2">{t('measurements.retry')}</Button>
                    </div>
                ) : editing ? (
                    <form
                        noValidate
                        onSubmit={e => {
                            e.preventDefault();
                            if (!hasInvalid(editing, PROFILE_KEYS)) void persist(toSet(editing, PROFILE_KEYS), 'saved');
                        }}
                    >
                        <MeasurementFields
                            fields={PROFILE_KEYS}
                            values={editing}
                            onChange={(key, value) => setEditing(current => ({ ...current, [key]: value }))}
                            idPrefix="profile-measure"
                        />
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button type="submit" size="sm" disabled={saving || hasInvalid(editing, PROFILE_KEYS)}>
                                {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t('measurements.saving')}</> : t('measurements.save')}
                            </Button>
                            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setEditing(null)}>
                                {t('measurements.cancel')}
                            </Button>
                            {savedKeys.length > 0 && (
                                <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => void persist({}, 'cleared')}>
                                    {t('measurements.clear')}
                                </Button>
                            )}
                        </div>
                    </form>
                ) : savedKeys.length === 0 ? (
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                        <Ruler className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        <p className="flex-1 text-sm text-slate-600">{t('measurements.profileEmpty')}</p>
                        <Button size="sm" onClick={() => { setFeedback(null); setEditing({}); }}>{t('measurements.add')}</Button>
                    </div>
                ) : (
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                        {savedKeys.map(key => (
                            <div key={key} className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-1.5">
                                <dt className="text-xs text-slate-500">{t(measurementLabelKey(key))}</dt>
                                <dd className="text-sm font-medium text-slate-900">{saved[key]} {t('measurements.cm')}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                {feedback && (
                    <p role={feedback === 'error' ? 'alert' : 'status'} className={`mt-3 flex items-center gap-1.5 text-xs ${feedback === 'error' ? 'text-destructive' : 'text-slate-700'}`}>
                        {feedback !== 'error' && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        {t(`measurements.feedback_${feedback}`)}
                    </p>
                )}
            </div>
        </section>
    );
}
