import { useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { PasswordField, passwordRuleError } from './PasswordField';
import { getAuthToken } from '../hooks/useAuth';
import { serverMessageKey } from '../lib/serverMessage';

const LABEL = 'block text-xs font-medium text-slate-700';
const INPUT = 'mt-1.5 w-full border-0 border-b border-slate-300 bg-transparent px-0 pb-2 text-sm text-slate-900 focus:outline-none focus:ring-0';
const ERROR = 'mt-1.5 text-xs text-destructive';

type Errors = { current?: string; password?: string; confirm?: string; general?: string };

/** A signed-in customer or tailor changing their password; the session stays signed in. */
export function ChangePassword({ className }: { className: string }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);

    const close = () => {
        setOpen(false);
        setCurrent('');
        setPassword('');
        setConfirm('');
        setErrors({});
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
            close();
            setDone(true);
        } catch {
            setErrors({ general: t('signIn.errorNetwork') });
        } finally {
            setSaving(false);
        }
    }

    const clear = (field: keyof Errors) => setErrors(er => ({ ...er, [field]: undefined, general: undefined }));

    return (
        <section className={className} aria-labelledby="change-password-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <div>
                        <h2 id="change-password-title" className="font-semibold text-slate-900">{t('password.changeTitle')}</h2>
                        <p className="mt-1 text-xs text-slate-500">{t('password.changeHint')}</p>
                    </div>
                </div>
                {!open && (
                    <Button variant="outline" size="sm" onClick={() => { setDone(false); setOpen(true); }}>
                        {t('password.changeButton')}
                    </Button>
                )}
            </div>

            {open && (
                <form noValidate onSubmit={handleSubmit} className="mt-5 grid max-w-md gap-5">
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
                        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={close}>
                            {t('password.cancel')}
                        </Button>
                    </div>
                </form>
            )}

            {done && (
                <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('password.changed')}
                </p>
            )}
        </section>
    );
}
