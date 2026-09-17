import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Check, Loader2, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';

/**
 * Where a parent or legal guardian confirms that a sixteen- or seventeen-year-old
 * may use Kere.
 *
 * Public on purpose: the adult has no account here and should not have to make
 * one to answer a question about their own child. The link's token is the whole
 * of the authorisation, so the page shows only enough to recognise the child —
 * a guessed token is answered exactly like an expired one, and gives away
 * nothing either way.
 */

type State = 'loading' | 'ready' | 'saving' | 'done' | 'invalid';

interface ConsentContext {
    customer_name: string;
    guardian_name: string | null;
    relationship: string | null;
}

export default function GuardianConsent() {
    const { t } = useTranslation();
    const { token } = useParams<{ token: string }>();

    const [state, setState] = useState<State>('loading');
    const [context, setContext] = useState<ConsentContext | null>(null);
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current || !token) return;
        loaded.current = true;

        fetch(`/api/guardian-consent/${encodeURIComponent(token)}`, {
            headers: { Accept: 'application/json' },
        })
            .then(async response => {
                if (!response.ok) throw new Error('invalid');

                return response.json();
            })
            .then((data: ConsentContext) => {
                setContext(data);
                setState('ready');
            })
            .catch(() => setState('invalid'));
    }, [token]);

    const consent = useCallback(async () => {
        if (!token) return;

        setState('saving');

        try {
            const response = await fetch(`/api/guardian-consent/${encodeURIComponent(token)}`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
            });

            setState(response.ok ? 'done' : 'invalid');
        } catch {
            // The link is single-use, so a failed attempt must not read as
            // spent — let the adult try again rather than stranding the child.
            setState('ready');
        }
    }, [token]);

    const icon = state === 'done'
        ? <Check className="h-7 w-7 text-[var(--kd-burgundy)]" />
        : state === 'invalid'
            ? <ShieldAlert className="h-7 w-7 text-[var(--kd-muted)]" />
            : <Loader2 className="h-7 w-7 animate-spin text-[var(--kd-muted)]" />;

    return (
        <div className="kere-product flex min-h-screen flex-col items-center justify-center px-4 py-16">
            <Helmet><title>{t('guardian.pageTitle')}</title></Helmet>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[460px] rounded-2xl border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-6 py-10 text-center sm:px-10"
            >
                {state !== 'ready' && (
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--kd-stage)]">
                        {icon}
                    </div>
                )}

                <div aria-live="polite">
                    {state === 'loading' && (
                        <h1 className="kd-display text-[22px] text-[var(--kd-ink)]">{t('guardian.loading')}</h1>
                    )}

                    {state === 'invalid' && (
                        <>
                            <h1 className="kd-display text-[22px] text-[var(--kd-ink)]">{t('guardian.invalidTitle')}</h1>
                            <p className="mt-3 text-[14px] leading-relaxed text-[var(--kd-body)]">{t('guardian.invalidBody')}</p>
                        </>
                    )}

                    {state === 'done' && (
                        <>
                            <h1 className="kd-display text-[22px] text-[var(--kd-ink)]">{t('guardian.doneTitle')}</h1>
                            <p className="mt-3 text-[14px] leading-relaxed text-[var(--kd-body)]">
                                {t('guardian.doneBody', { name: context?.customer_name ?? '' })}
                            </p>
                        </>
                    )}

                    {(state === 'ready' || state === 'saving') && context && (
                        <>
                            <h1 className="kd-display text-[24px] leading-tight text-[var(--kd-ink)]">
                                {t('guardian.askTitle', { name: context.customer_name })}
                            </h1>
                            <p className="mt-3 text-[14px] leading-relaxed text-[var(--kd-body)]">
                                {t('guardian.askBody', {
                                    name: context.customer_name,
                                    relationship: t(
                                        context.relationship === 'legal_guardian'
                                            ? 'register.relationshipLegalGuardian'
                                            : 'register.relationshipParent',
                                    ).toLowerCase(),
                                })}
                            </p>
                            <p className="mt-4 text-[13px] leading-relaxed text-[var(--kd-muted)]">
                                {t('guardian.askRestriction')}
                            </p>
                        </>
                    )}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    {(state === 'ready' || state === 'saving') && (
                        <Button onClick={() => void consent()} disabled={state === 'saving'} className="w-full">
                            {state === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t('guardian.confirm')}
                        </Button>
                    )}

                    <Link
                        to="/"
                        className="text-[14px] text-[var(--kd-body)] underline underline-offset-4 transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                    >
                        {t('guardian.backHome')}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
