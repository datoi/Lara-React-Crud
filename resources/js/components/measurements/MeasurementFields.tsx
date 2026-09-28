import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { MeasurementGuideModal, type MeasurementKey as GuideStep } from '../MeasurementGuideModal';
import { measurementLabelKey, measurementWarning, rangeOf, type MeasurementDraft, type MeasurementKey } from '../../lib/measurements';

const GUIDE_STEPS: readonly string[] = ['chest', 'waist', 'hips', 'length'];

/**
 * Centimetre inputs for a set of measurements, each checked against its
 * plausible range as it is typed, with the measuring guide one tap away.
 */
export function MeasurementFields({ fields, values, onChange, required = [], idPrefix }: {
    fields: readonly MeasurementKey[];
    values: MeasurementDraft;
    onChange: (key: MeasurementKey, value: string) => void;
    /** Fields the order cannot go ahead without */
    required?: readonly MeasurementKey[];
    /** Keeps input ids unique when two sets are on one page */
    idPrefix: string;
}) {
    const { t } = useTranslation();
    const [guideStep, setGuideStep] = useState<GuideStep | null>(null);

    return (
        <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fields.map(key => {
                    const id = `${idPrefix}-${key}`;
                    const warning = measurementWarning(key, values[key]);
                    return (
                        <div key={key}>
                            <label htmlFor={id} className="mb-1 block text-xs text-slate-600">
                                {t(measurementLabelKey(key))}
                                {required.includes(key) && <span className="text-brand" aria-hidden="true"> *</span>}
                            </label>
                            <div className="relative">
                                <input
                                    id={id}
                                    type="text"
                                    inputMode="decimal"
                                    value={values[key] ?? ''}
                                    onChange={e => onChange(key, e.target.value.replace(',', '.'))}
                                    placeholder="—"
                                    required={required.includes(key)}
                                    aria-invalid={warning !== ''}
                                    aria-describedby={warning ? `${id}-warning` : undefined}
                                    className={`w-full border bg-white py-2 pl-3 pr-9 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand ${warning ? 'border-destructive' : 'border-slate-200'}`}
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{t('measurements.cm')}</span>
                            </div>
                            {warning && <p id={`${id}-warning`} className="mt-1 text-xs text-destructive">{t(warning, rangeOf(key))}</p>}
                        </div>
                    );
                })}
            </div>
            <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setGuideStep((GUIDE_STEPS.find(step => fields.includes(step as MeasurementKey)) ?? 'chart') as GuideStep)}
                className="mt-2 px-0 text-xs"
            >
                {t('measurements.howToMeasure')}
            </Button>
            <MeasurementGuideModal open={guideStep !== null} onClose={() => setGuideStep(null)} initialStep={guideStep ?? undefined} />
        </>
    );
}
