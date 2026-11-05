import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: 'current-password' | 'new-password';
    error?: string;
    /** Flags the field without a message of its own (a refused sign-in marks both fields). */
    invalid?: boolean;
    hint?: string;
    labelClassName: string;
    inputClassName: string;
    errorClassName: string;
}

/** A password input with a show/hide toggle, styled by the page it sits on. */
export function PasswordField({ id, label, value, onChange, autoComplete, error, invalid, hint, labelClassName, inputClassName, errorClassName }: PasswordFieldProps) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div>
            <label htmlFor={id} className={labelClassName}>{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    aria-invalid={!!error || !!invalid}
                    aria-describedby={describedBy}
                    className={`${inputClassName} pr-8`}
                />
                <button
                    type="button"
                    aria-label={t('password.showPassword')}
                    aria-pressed={visible}
                    onClick={() => setVisible(v => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-current"
                >
                    {visible ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
            </div>
            {error
                ? <p id={`${id}-error`} className={errorClassName}>{error}</p>
                : hint && <p id={`${id}-hint`} className="mt-2 text-[11px] text-[#71665d]">{hint}</p>}
        </div>
    );
}

/** The rule the server applies (Password::min(8)->numbers()). */
export function passwordRuleError(password: string): boolean {
    return password.length < 8 || !/\d/.test(password);
}
