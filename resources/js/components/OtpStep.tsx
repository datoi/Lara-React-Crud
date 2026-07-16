import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

const RESEND_COOLDOWN = 60;

interface OtpStepProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    verificationId: string;
    otpType: 'email' | 'phone';
    endpoint: string;
    onSuccess: (data: Record<string, unknown>) => void;
    onBack: () => void;
    isLastStep?: boolean;
}

export function OtpStep({ icon, title, description, verificationId, otpType, endpoint, onSuccess, onBack, isLastStep }: OtpStepProps) {
    const { t } = useTranslation();
    const [digits, setDigits]     = useState(['', '', '', '', '', '']);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startCooldown = () => {
        setCooldown(RESEND_COOLDOWN);
        timerRef.current = setInterval(() => {
            setCooldown(c => {
                if (c <= 1) { clearInterval(timerRef.current!); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const code = digits.join('');

    const handleDigit = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...digits];
        next[i] = val.slice(-1);
        setDigits(next);
        setError('');
        if (val && i < 5) inputRefs.current[i + 1]?.focus();
        if (val && i === 5 && next.every(d => d)) submitCode(next.join(''));
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const next = pasted.split('');
            setDigits(next);
            inputRefs.current[5]?.focus();
            submitCode(pasted);
        }
    };

    const submitCode = async (codeStr: string) => {
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ verification_id: verificationId, code: codeStr }),
            });
            const data = await res.json();
            if (res.status === 410) {
                setError(t('register.sessionExpired'));
                setTimeout(() => onBack(), 2000);
                return;
            }
            if (!res.ok) {
                setError(data.message ?? t('register.incorrectCode'));
                setDigits(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                return;
            }
            onSuccess(data as Record<string, unknown>);
        } catch {
            setError(t('register.errorNetwork'));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resending || cooldown > 0) return;
        setResending(true);
        setError('');
        try {
            const res = await fetch('/api/register/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ verification_id: verificationId, type: otpType }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message ?? t('register.resendFailed')); return; }
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            startCooldown();
        } catch {
            setError(t('register.errorNetwork'));
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {icon}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
                <p className="text-slate-500 text-sm">{description}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                {error && (
                    <div className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={e => handleDigit(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            disabled={loading}
                            className={`w-11 h-14 text-center text-xl font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${
                                error ? 'border-destructive bg-destructive/10' : d ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                            } disabled:opacity-50`}
                        />
                    ))}
                </div>

                <Button
                    type="button"
                    disabled={code.length < 6 || loading}
                    onClick={() => submitCode(code)}
                    className="w-full bg-slate-900 hover:bg-slate-700 text-white h-11"
                >
                    {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isLastStep ? t('register.creatingAccount') : t('register.verifying')}</>
                        : isLastStep ? t('register.createAccount') : t('register.verify')}
                </Button>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || cooldown > 0}
                        className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
                    >
                        {resending
                            ? t('register.resendSending')
                            : cooldown > 0
                            ? t('register.resendCooldown', { s: cooldown })
                            : t('register.resendPrompt')}
                    </button>
                </div>
            </div>

            <div className="mt-5 text-center">
                <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    ← {t('register.stepDetails')}
                </button>
            </div>
        </>
    );
}
