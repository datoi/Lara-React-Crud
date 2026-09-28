import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MeasurementFields } from './MeasurementFields';
import type { OrderMeasurementsState } from '../../hooks/useOrderMeasurements';
import type { MeasurementKey } from '../../lib/measurements';

/**
 * The measurements step of an order: prefilled from the profile, editable for
 * this order, with an explicit choice to save the result back to the profile.
 * Optional unless the product marks fields required — but an order sent without
 * any says plainly that the tailor will have to ask.
 */
export function OrderMeasurements({ state, required = [], idPrefix, titleClassName = 'text-sm font-semibold text-slate-900' }: {
    state: OrderMeasurementsState;
    required?: readonly MeasurementKey[];
    idPrefix: string;
    /** The host page's section-heading style, so the step reads as part of it */
    titleClassName?: string;
}) {
    const { t } = useTranslation();

    return (
        <section aria-labelledby={`${idPrefix}-title`}>
            <h2 id={`${idPrefix}-title`} className={titleClassName}>{t('measurements.orderTitle')}</h2>
            <p className="mb-3 mt-1 text-xs text-slate-500">
                {state.profileStatus === 'loading'
                    ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />{t('measurements.loadingProfile')}</span>
                    : state.profileEmpty
                        ? t('measurements.orderHintEmptyProfile')
                        : t('measurements.orderHintPrefilled')}
            </p>

            <MeasurementFields
                fields={state.fields}
                values={state.draft}
                onChange={state.setValue}
                required={required}
                idPrefix={idPrefix}
            />

            {state.canOfferSave && (
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-slate-700">
                    <input
                        type="checkbox"
                        checked={state.saveToProfile}
                        onChange={e => state.setSaveToProfile(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
                    />
                    {t(state.profileEmpty ? 'measurements.saveNewToProfile' : 'measurements.updateProfile')}
                </label>
            )}

            {state.isEmpty && required.length === 0 && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {t('measurements.missingWarning')}
                </p>
            )}
        </section>
    );
}
