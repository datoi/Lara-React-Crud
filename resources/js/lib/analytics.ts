/**
 * Microsoft Clarity loader, gated behind visitor consent.
 *
 * The tracking script is only injected after the visitor accepts analytics
 * (see AnalyticsConsent). Consent is remembered in localStorage so the banner
 * shows once. Set VITE_CLARITY_PROJECT_ID in .env to enable — without it every
 * function here is a no-op, so local/dev builds never phone home.
 */
const CONSENT_KEY = 'kere_analytics_consent';
const PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;

export type ConsentState = 'granted' | 'denied' | null;

/** Clarity is only offered when a project id is configured. */
export function isAnalyticsConfigured(): boolean {
    return Boolean(PROJECT_ID);
}

export function getConsent(): ConsentState {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
}

export function setConsent(state: 'granted' | 'denied'): void {
    localStorage.setItem(CONSENT_KEY, state);
}

let started = false;

/** Inject the Clarity tag once. Safe to call repeatedly. */
export function initClarity(): void {
    if (started || !PROJECT_ID || typeof document === 'undefined') return;
    started = true;

    const w = window as Window & {
        clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
    };
    w.clarity =
        w.clarity ||
        function (...args: unknown[]) {
            (w.clarity!.q = w.clarity!.q || []).push(args);
        };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;

    const first = document.getElementsByTagName('script')[0];
    first?.parentNode?.insertBefore(script, first);
}

/** Start tracking immediately if the visitor already granted consent. */
export function startAnalyticsIfConsented(): void {
    if (getConsent() === 'granted') initClarity();
}
