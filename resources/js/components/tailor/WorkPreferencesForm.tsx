import { useTranslation } from 'react-i18next';
import {
    COMMENT_MAX,
    COMPLEXITIES,
    GARMENT_TYPES,
    NEW_GARMENTS,
    OTHER_MAX,
    REMODEL_TYPES,
    type GarmentType,
    type RemodelType,
    type WorkAnswerErrors,
    type WorkAnswers,
} from '../../lib/tailorWork';

/**
 * "რა შეკვეთებზე გსურთ მუშაობა Kere-სთან?" — the questionnaire, as worded by
 * the CEO (2026-11-08). Used on registration and in the dashboard; the parent
 * holds the answers and checks them with validateWorkAnswers().
 */
interface Props {
    value: WorkAnswers;
    onChange: (next: WorkAnswers) => void;
    errors?: WorkAnswerErrors;
    idPrefix?: string;
}

const tile =
    'flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-[var(--kere-panel,#ffffff)] px-3 py-2.5 text-left text-sm leading-snug transition-colors hover:border-black has-[:checked]:border-[#6F1D24] has-[:checked]:bg-[#6F1D24] has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6F1D24] has-[:focus-visible]:ring-offset-2';
const textInput =
    'mt-2 w-full rounded-md border border-black/15 bg-white px-3 py-2.5 text-base sm:text-sm text-[#111111] focus:outline-none';

function toggle<T>(list: T[], item: T, on: boolean): T[] {
    return on ? (list.includes(item) ? list : [...list, item]) : list.filter((x) => x !== item);
}

export function WorkPreferencesForm({ value, onChange, errors = {}, idPrefix = 'work' }: Props) {
    const { t } = useTranslation();
    const set = (patch: Partial<WorkAnswers>) => onChange({ ...value, ...patch });
    const error = (key: keyof WorkAnswerErrors) =>
        errors[key] ? <p className="mt-1.5 text-xs text-destructive">{t(errors[key] as string)}</p> : null;
    const border = (invalid: boolean) => (invalid ? 'border-destructive' : 'border-black/15');

    const allRemodels = REMODEL_TYPES.every((k) => value.remodel_types.includes(k));
    const allGarments = GARMENT_TYPES.every((k) => value.garment_types.includes(k));

    return (
        <div className="space-y-7">
            <div>
                <h3 className="text-base font-semibold text-[#111111]">{t('tailorWork.title')}</h3>
                <p className="mt-1 text-xs leading-5 text-black/55">{t('tailorWork.intro')}</p>
            </div>

            {/* 1. Remodel work */}
            <fieldset aria-invalid={Boolean(errors.remodel)}>
                <legend className="text-sm font-medium text-[#111111]">1. {t('tailorWork.remodelQuestion')}</legend>
                <p className="mb-2 text-xs text-black/45">{t('tailorWork.multiHint')}</p>
                <div className="grid gap-2">
                    {REMODEL_TYPES.map((k) => (
                        <label key={k} className={`${tile} ${border(Boolean(errors.remodel))}`}>
                            <input
                                type="checkbox"
                                className="h-4 w-4 shrink-0 accent-white"
                                checked={value.remodel_types.includes(k)}
                                onChange={(e) => set({ remodel_none: false, remodel_types: toggle<RemodelType>(value.remodel_types, k, e.target.checked) })}
                            />
                            {t(`tailorWork.remodel_${k}`)}
                        </label>
                    ))}
                    <label className={`${tile} ${border(Boolean(errors.remodel))}`}>
                        <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-white"
                            checked={allRemodels}
                            onChange={(e) => set({ remodel_none: false, remodel_types: e.target.checked ? [...REMODEL_TYPES] : [] })}
                        />
                        {t('tailorWork.all')}
                    </label>
                    <label className={`${tile} ${border(Boolean(errors.remodel || errors.remodel_other))}`}>
                        <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-white"
                            checked={value.remodel_other !== null}
                            onChange={(e) => set({ remodel_none: false, remodel_other: e.target.checked ? '' : null })}
                        />
                        {t('tailorWork.other')}
                    </label>
                    {value.remodel_other !== null && (
                        <div>
                            <label htmlFor={`${idPrefix}-remodel-other`} className="sr-only">{t('tailorWork.other')}</label>
                            <input
                                id={`${idPrefix}-remodel-other`}
                                type="text"
                                maxLength={OTHER_MAX}
                                value={value.remodel_other}
                                onChange={(e) => set({ remodel_other: e.target.value })}
                                placeholder={t('tailorWork.otherPlaceholder')}
                                aria-invalid={Boolean(errors.remodel_other)}
                                className={`${textInput} -mt-0`}
                            />
                            {error('remodel_other')}
                        </div>
                    )}
                    <label className={`${tile} ${border(Boolean(errors.remodel))}`}>
                        <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-white"
                            checked={value.remodel_none}
                            onChange={(e) => set(e.target.checked
                                ? { remodel_none: true, remodel_types: [], remodel_other: null }
                                : { remodel_none: false })}
                        />
                        {t('tailorWork.remodelNone')}
                    </label>
                </div>
                {error('remodel')}
            </fieldset>

            {/* 2. New garments from the customer's photo or sketch */}
            <fieldset aria-invalid={Boolean(errors.new_garments)}>
                <legend className="text-sm font-medium text-[#111111]">2. {t('tailorWork.newQuestion')}</legend>
                <p className="mb-2 text-xs text-black/45">{t('tailorWork.newHint')}</p>
                <div className="grid gap-2">
                    {NEW_GARMENTS.map((k) => (
                        <label key={k} className={`${tile} ${border(Boolean(errors.new_garments))}`}>
                            <input
                                type="radio"
                                name={`${idPrefix}-new-garments`}
                                className="h-4 w-4 shrink-0 accent-white"
                                checked={value.new_garments === k}
                                onChange={() => set({ new_garments: k })}
                            />
                            {t(`tailorWork.new_${k}`)}
                        </label>
                    ))}
                </div>
                {error('new_garments')}
            </fieldset>

            {value.new_garments === 'yes' && (
                <>
                    {/* 3. Which new garments */}
                    <fieldset aria-invalid={Boolean(errors.garments)}>
                        <legend className="text-sm font-medium text-[#111111]">3. {t('tailorWork.garmentQuestion')}</legend>
                        <p className="mb-2 text-xs text-black/45">{t('tailorWork.multiHint')}</p>
                        <div className="grid gap-2">
                            {GARMENT_TYPES.map((k) => (
                                <label key={k} className={`${tile} ${border(Boolean(errors.garments))}`}>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 shrink-0 accent-white"
                                        checked={value.garment_types.includes(k)}
                                        onChange={(e) => set({ garment_types: toggle<GarmentType>(value.garment_types, k, e.target.checked) })}
                                    />
                                    {t(`tailorWork.garment_${k}`)}
                                </label>
                            ))}
                            <label className={`${tile} ${border(Boolean(errors.garments))}`}>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 shrink-0 accent-white"
                                    checked={allGarments}
                                    onChange={(e) => set({ garment_types: e.target.checked ? [...GARMENT_TYPES] : [] })}
                                />
                                {t('tailorWork.all')}
                            </label>
                            <label className={`${tile} ${border(Boolean(errors.garments || errors.garment_other))}`}>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 shrink-0 accent-white"
                                    checked={value.garment_other !== null}
                                    onChange={(e) => set({ garment_other: e.target.checked ? '' : null })}
                                />
                                {t('tailorWork.other')}
                            </label>
                            {value.garment_other !== null && (
                                <div>
                                    <label htmlFor={`${idPrefix}-garment-other`} className="sr-only">{t('tailorWork.other')}</label>
                                    <input
                                        id={`${idPrefix}-garment-other`}
                                        type="text"
                                        maxLength={OTHER_MAX}
                                        value={value.garment_other}
                                        onChange={(e) => set({ garment_other: e.target.value })}
                                        placeholder={t('tailorWork.otherPlaceholder')}
                                        aria-invalid={Boolean(errors.garment_other)}
                                        className={textInput}
                                    />
                                    {error('garment_other')}
                                </div>
                            )}
                        </div>
                        {error('garments')}
                    </fieldset>

                    {/* 4. Complexity */}
                    <fieldset aria-invalid={Boolean(errors.complexity)}>
                        <legend className="mb-2 text-sm font-medium text-[#111111]">4. {t('tailorWork.complexityQuestion')}</legend>
                        <div className="grid gap-2">
                            {COMPLEXITIES.map((k) => (
                                <label key={k} className={`${tile} ${border(Boolean(errors.complexity))}`}>
                                    <input
                                        type="radio"
                                        name={`${idPrefix}-complexity`}
                                        className="h-4 w-4 shrink-0 accent-white"
                                        checked={value.complexity === k}
                                        onChange={() => set({ complexity: k })}
                                    />
                                    {t(`tailorWork.complexity_${k}`)}
                                </label>
                            ))}
                        </div>
                        {error('complexity')}
                    </fieldset>
                </>
            )}

            {/* Two optional comments */}
            {(['work_notes', 'platform_feedback'] as const).map((field) => (
                <div key={field}>
                    <label htmlFor={`${idPrefix}-${field}`} className="block text-sm font-medium text-[#111111]">
                        {t('tailorWork.commentTitle')} <span className="font-normal text-black/45">({t('tailorWork.optional')})</span>
                    </label>
                    <p className="mt-0.5 text-xs leading-5 text-black/55">
                        {t(field === 'work_notes' ? 'tailorWork.notesQuestion' : 'tailorWork.feedbackQuestion')}
                    </p>
                    <textarea
                        id={`${idPrefix}-${field}`}
                        rows={3}
                        maxLength={COMMENT_MAX}
                        value={value[field]}
                        onChange={(e) => set({ [field]: e.target.value })}
                        className={`${textInput} resize-none`}
                    />
                </div>
            ))}
        </div>
    );
}
