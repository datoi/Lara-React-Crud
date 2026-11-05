import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { PasswordField, passwordRuleError } from './PasswordField';
import { getAuthToken } from '../hooks/useAuth';
import { serverMessageKey } from '../lib/serverMessage';

const LABEL = 'block text-xs font-medium text-slate-700';
const INPUT = 'mt-1.5 w-full border-0 border-b border-slate-300 bg-transparent px-0 pb-2 text-sm text-slate-900 focus:outline-none focus:ring-0';
const ERROR = 'mt-1.5 text-xs text-destructive';

type Errors = { current?: string; password?: string; confirm?: string; general?: string };

/**
 * A quiet "change password" link for the bottom of a dashboard; the form opens
 * in a dialog. A signed-in customer or tailor stays signed in afterwards.
 */
export function ChangePassword() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);

    const onOpenChange = (next: boolean) => {
        if (saving) return;
        setOpen(next);
        setCurrent('');
        setPassword('');
        setConfirm('');
        setErrors({});
        if (next) setDone(false);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const next: Errors = {};
        if (!current) next.current = t('signIn.errorRequired');
        if (passwordRuleError(password)) next.password = t('password.errorPasswordRule');
        if (confirm !== password) next.confirm = t('password.errorPasswordMismatch');
        setErrors(next);
        if (Object.keys(next).length > 0) return;

        setSaving(true);
        try {
            const res = await fetch('/api/me/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${getAuthToken()}` },
                body: JSON.stringify({ current_password: current, password, password_confirmation: confirm }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (data.code === 'current_password_wrong') setErrors({ current: t(serverMessageKey(data.code) ?? 'password.errorCurrentWrong') });
                else if (data.errors?.password) setErrors({ password: t('password.errorPasswordRule') });
                else setErrors({ general: t(res.status === 429 ? 'password.errorThrottled' : 'password.errorFailed') });
                return;
            }
            setOpen(false);
            setCurrent('');
            setPassword('');
            setConfirm('');
            setDone(true);
        } catch {
            setErrors({ general: t('signIn.errorNetwork') });
        } finally {
            setSaving(false);
        }
    }

    const clear = (field: keyof Errors) => setErrors(er => ({ ...er, [field]: undefined, general: undefined }));

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <div className="mt-10 flex flex-col items-center gap-2 text-xs text-slate-400">
                <Dialog.Trigger className="underline underline-offset-4 hover:text-slate-700">
                    {t('password.changeButton')}
                </Dialog.Trigger>
                {done && (
                    <p role="status" className="flex items-center gap-1.5 text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('password.changed')}
                    </p>
                )}
            </div>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[150] bg-[#2a1418]/30" />
                <Dialog.Content className="kere-modal fixed left-1/2 top-1/2 z-[151] max-h-[90dvh] w-[calc(100%-24px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6">
                    <Dialog.Title className="text-lg">{t('password.changeTitle')}</Dialog.Title>
                    <Dialog.Description className="mt-1 text-xs text-slate-500">{t('password.changeHint')}</Dialog.Description>

                    <form noValidate onSubmit={handleSubmit} className="mt-5 grid gap-5">
                        {errors.general && <p role="alert" className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{errors.general}</p>}
                        <PasswordField
                            id="change-current"
                            label={t('password.currentPasswordLabel')}
                            value={current}
                            onChange={v => { setCurrent(v); clear('current'); }}
                            autoComplete="current-password"
                            error={errors.current}
                            labelClassName={LABEL}
                            inputClassName={INPUT}
                            errorClassName={ERROR}
                        />
                        <PasswordField
                            id="change-new"
                            label={t('password.newPasswordLabel')}
                            value={password}
                            onChange={v => { setPassword(v); clear('password'); }}
                            autoComplete="new-password"
                            error={errors.password}
                            hint={t('password.passwordHint')}
                            labelClassName={LABEL}
                            inputClassName={INPUT}
                            errorClassName={ERROR}
                        />
                        <PasswordField
                            id="change-confirm"
                            label={t('password.confirmPasswordLabel')}
                            value={confirm}
                            onChange={v => { setConfirm(v); clear('confirm'); }}
                            autoComplete="new-password"
                            error={errors.confirm}
                            labelClassName={LABEL}
                            inputClassName={INPUT}
                            errorClassName={ERROR}
                        />
                        <div className="flex flex-wrap items-center gap-3">
                            <Button type="submit" size="sm" disabled={saving}>
                                {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t('password.saving')}</> : t('password.changeButton')}
                            </Button>
                            <Dialog.Close asChild>
                                <Button type="button" variant="outline" size="sm" disabled={saving}>{t('password.cancel')}</Button>
                            </Dialog.Close>
                        </div>
                    </form>

                    <Dialog.Close className="absolute right-3 top-3 p-2" aria-label={t('newsletterPopup.close')} disabled={saving}>
                        <X size={18} />
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
