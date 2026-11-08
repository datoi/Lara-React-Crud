import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { legalLink } from './LegalConsent';
import { clearAuth, getAuthToken, getAuthUser } from '../hooks/useAuth';
import { translateServerMessage } from '../lib/serverMessage';

/** What the server says this person must still accept (`legal_pending` on /api/me). */
interface PendingDocument {
    document: string;
    version: string;
}

/** The wording and page of each document the gate can ask about. A new document needs its entry here. */
const DOCUMENTS: Record<string, { key: string; href: '/terms' | '/privacy' }> = {
    terms: { key: 'legalConsent.acceptTerms', href: '/terms' },
    privacy: { key: 'legalConsent.acceptPrivacy', href: '/privacy' },
};

/** The pages the question links to stay readable while it is open. */
const READING_PATHS = ['/terms', '/privacy', '/refund-policy'];

/** Where a customer who verified their code but never answered age and terms finishes signing up. */
export const FINISH_REGISTRATION_PATH = '/register/customer?finish=1';

/**
 * The last answer, per sign-in, so a page change does not ask the server again.
 * The gate reads it on every render rather than copying it into state: React
 * keeps one gate across page changes, and a copy would outlive forgetAccountCheck().
 */
let lastAnswer: { token: string; pending: PendingDocument[]; unfinished: boolean } | null = null;

/** Ask the server again on the next page: the account has just changed (registration finished). */
export function forgetAccountCheck(): void {
    lastAnswer = null;
}

/**
 * Asks a signed-in customer or tailor to agree to terms or a privacy policy that
 * changed since they last did (App\Support\LegalDocuments). It cannot be
 * dismissed, only answered or left by signing out. The server enforces the part
 * that matters: a customer cannot order until they have agreed.
 *
 * It also brings back a customer whose registration stopped after the one-time
 * code (the tab closed, the phone reloaded it): the account exists, but date of
 * birth and the terms were never answered, and until they are every order is
 * refused. Without this nothing would ever ask them again.
 */
export function LegalUpdateGate() {
    const token = getAuthToken();
    const role = getAuthUser()?.role;
    const { pathname, search } = useLocation();
    const navigate = useNavigate();
    // Re-renders the gate once lastAnswer changes.
    const [, setAnswered] = useState(0);
    const answer = token && lastAnswer?.token === token ? lastAnswer : null;
    const pending = answer?.pending ?? [];

    const remember = useCallback((next: typeof lastAnswer) => {
        lastAnswer = next;
        setAnswered((n) => n + 1);
    }, []);

    const check = useCallback(() => {
        if (!token) return;
        fetch('/api/me', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { user?: { role?: string; legal_pending?: PendingDocument[]; registration_complete?: boolean } } | null) => {
                // A failed check is not remembered, so the next page asks again.
                // Until then the server still refuses an order under terms not agreed to.
                if (!data) return;
                remember({
                    token,
                    pending: data.user?.legal_pending ?? [],
                    unfinished: data.user?.role === 'customer' && data.user.registration_complete === false,
                });
            })
            .catch(() => undefined);
    }, [token, remember]);

    // Every page change asks again while nothing is remembered for this sign-in.
    useEffect(() => {
        if (!token || !role || role === 'admin' || lastAnswer?.token === token) return;
        check();
    }, [token, role, check, pathname]);

    if (answer?.unfinished && `${pathname}${search}` !== FINISH_REGISTRATION_PATH && !READING_PATHS.includes(pathname)) {
        return <Navigate to={FINISH_REGISTRATION_PATH} replace />;
    }

    if (!token || pending.length === 0 || READING_PATHS.includes(pathname)) return null;

    return (
        <LegalUpdateDialog
            token={token}
            pending={pending}
            onAnswered={(next) => remember({ token, pending: next, unfinished: false })}
            onStale={() => {
                remember(null);
                check();
            }}
            onSignOut={() => {
                clearAuth();
                remember(null);
                navigate('/');
            }}
        />
    );
}

function LegalUpdateDialog({ token, pending, onAnswered, onStale, onSignOut }: {
    token: string;
    pending: PendingDocument[];
    onAnswered: (pending: PendingDocument[]) => void;
    /** A newer version went live while the question was open: ask about that one. */
    onStale: () => void;
    onSignOut: () => void;
}) {
    const { t, i18n } = useTranslation();
    const [ticked, setTicked] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const asked = pending.filter((p) => p.document in DOCUMENTS);
    const allTicked = asked.length > 0 && asked.every((p) => ticked[p.document]);

    const agree = async () => {
        if (!allTicked || saving) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/legal/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({
                    // Each document names the version shown, so a newer one is never agreed to unseen.
                    documents: Object.fromEntries(asked.map((p) => [p.document, p.version])),
                    locale: i18n.language === 'en' ? 'en' : 'ka',
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(translateServerMessage(data, t, 'legalConsent.errorSave'));
                if (res.status === 409) {
                    setTicked({});
                    onStale();
                }
                return;
            }
            onAnswered((data as { legal_pending?: PendingDocument[] }).legal_pending ?? []);
        } catch {
            setError(t('legalConsent.errorSave'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog.Root open>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[180] bg-[#2a1418]/40" />
                <Dialog.Content
                    className="kere-modal fixed left-1/2 top-1/2 z-[181] max-h-[90dvh] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 sm:p-7"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                    onInteractOutside={(event) => event.preventDefault()}
                >
                    <Dialog.Title>{t('legalConsent.updateTitle')}</Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-6 text-[#715951]">{t('legalConsent.updateBody')}</Dialog.Description>

                    <div className="mt-5 space-y-3.5">
                        {asked.map((p) => (
                            <label key={p.document} className="flex cursor-pointer items-start gap-2.5 text-sm leading-6 text-[#2a1418]">
                                <input
                                    type="checkbox"
                                    checked={ticked[p.document] ?? false}
                                    onChange={(e) => setTicked((current) => ({ ...current, [p.document]: e.target.checked }))}
                                    className="mt-1 h-4 w-4 shrink-0 accent-[#631e26]"
                                />
                                <span>
                                    <Trans
                                        t={t}
                                        i18nKey={DOCUMENTS[p.document].key}
                                        values={{ version: p.version }}
                                        components={{ doc: legalLink(DOCUMENTS[p.document].href) }}
                                    />
                                </span>
                            </label>
                        ))}
                    </div>

                    {error && <p role="alert" className="mt-4 text-xs text-destructive">{error}</p>}

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Button type="button" onClick={() => void agree()} disabled={!allTicked || saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving ? t('legalConsent.saving') : t('legalConsent.agree')}
                        </Button>
                        <Button type="button" variant="link" onClick={onSignOut} className="h-auto px-0">
                            {t('legalConsent.signOut')}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
