import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthToken } from '../../hooks/useAuth';
import { fromStored, toPayload, validateWorkAnswers, workAnswerFacts, type StoredWorkAnswers, type WorkAnswerErrors, type WorkAnswers } from '../../lib/tailorWork';
import { Button } from '../ui/button';
import { WorkPreferencesForm } from './WorkPreferencesForm';

/**
 * The work questionnaire in the dashboard: a prompt until the tailor has
 * answered (every tailor who registered before it existed), then a summary
 * they can change. Saving sets whether they receive remodel and design
 * requests (App\Support\TailorWork).
 */
export function WorkPreferencesCard() {
    const { t } = useTranslation();
    const [stored, setStored] = useState<StoredWorkAnswers | null>(null);
    const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'failed'>('loading');
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<WorkAnswers>(fromStored(null));
    const [errors, setErrors] = useState<WorkAnswerErrors>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoadState('loading');
        fetch('/api/tailor/profile', {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' },
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((data) => {
                setStored(data.tailor?.work_preferences ?? null);
                setLoadState('loaded');
            })
            .catch(() => {
                if (!controller.signal.aborted) setLoadState('failed');
            });
        return () => controller.abort();
    }, [loadAttempt]);

    const openForm = () => {
        setDraft(fromStored(stored));
        setErrors({});
        setSaveError(false);
        setOpen(true);
    };

    const save = async () => {
        const missing = validateWorkAnswers(draft);
        setErrors(missing);
        if (Object.keys(missing).length > 0) return;

        setSaving(true);
        setSaveError(false);
        try {
            const res = await fetch('/api/tailor/profile', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ work_preferences: toPayload(draft) }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setStored(data.tailor.work_preferences);
            setOpen(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setSaveError(true);
        } finally {
            setSaving(false);
        }
    };

    if (loadState === 'loading') return null;

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <section className="border border-[#e5dfd8] bg-white p-5" aria-labelledby="work-preferences-title">
                {loadState === 'failed' ? (
                    <div role="alert" className="flex flex-wrap items-center gap-3">
                        <p className="text-sm text-destructive">{t('tailorWork.loadFailed')}</p>
                        <Button variant="default" size="sm" type="button" onClick={() => setLoadAttempt((n) => n + 1)}>{t('tailorWork.retry')}</Button>
                    </div>
                ) : stored === null ? (
                    <>
                        <h2 id="work-preferences-title" className="font-bold text-slate-900">{t('tailorWork.promptTitle')}</h2>
                        <p className="mt-1 text-sm text-slate-600">{t('tailorWork.promptBody')}</p>
                        <Button variant="default" size="default" type="button" className="mt-4" onClick={openForm}>{t('tailorWork.answerBtn')}</Button>
                    </>
                ) : (
                    <>
                        <h2 id="work-preferences-title" className="font-bold text-slate-900">{t('tailorWork.title')}</h2>
                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[minmax(0,14rem)_1fr]">
                            {workAnswerFacts(t, stored).map(([label, value]) => (
                                <div key={label} className="contents">
                                    <dt className="text-slate-500">{label}</dt>
                                    <dd className="break-words text-slate-900">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button variant="default" size="sm" type="button" onClick={openForm}>{t('tailorWork.editBtn')}</Button>
                            {saved && <span className="flex items-center gap-1.5 text-sm text-slate-700"><CheckCircle className="h-4 w-4" />{t('tailorWork.saved')}</span>}
                        </div>
                    </>
                )}
            </section>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[150] bg-[#2a1418]/30" />
                <Dialog.Content
                    className="kere-modal studio-dialog fixed left-1/2 top-1/2 z-[151] w-[calc(100%-24px)] max-w-xl -translate-x-1/2 -translate-y-1/2 max-h-[90dvh] overflow-y-auto bg-white"
                    aria-describedby={undefined}
                >
                    <div className="flex items-center justify-between gap-4 border-b border-[#e5dfd8] px-5 py-4">
                        <Dialog.Title className="text-base">{t('tailorWork.title')}</Dialog.Title>
                        <Dialog.Close className="shrink-0 p-2" aria-label={t('newsletterPopup.close')}><X size={18} /></Dialog.Close>
                    </div>
                    <div className="px-4 py-5 sm:px-6">
                        <WorkPreferencesForm
                            value={draft}
                            onChange={(next) => { setDraft(next); setErrors({}); }}
                            errors={errors}
                            idPrefix="dashboard-work"
                        />
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Button variant="default" size="default" type="button" disabled={saving} onClick={save}>
                                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />{t('tailorWork.saving')}</> : t('tailorWork.saveBtn')}
                            </Button>
                            {saveError && <p role="alert" className="text-sm text-destructive">{t('tailorWork.saveError')}</p>}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
