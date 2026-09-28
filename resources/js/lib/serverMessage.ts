import type { TFunction } from 'i18next';

/**
 * Turn what the API said into something the customer can read.
 *
 * Laravel answers in English, and the interface is Georgian by default, so a
 * server message rendered as-is puts one English sentence in the middle of an
 * otherwise translated page — reachable by ordinary means, not just tampering:
 * registering with a phone someone already used, or paying an order that was
 * settled in another tab.
 *
 * So the server sends a code rather than prose, and this maps it. Anything
 * unrecognised falls back to the caller's own translated message: the one thing
 * that must never happen is showing the raw string, because that is the English
 * leak this exists to stop.
 */
const CODES: Record<string, string> = {
    // Registration
    phone_taken: 'register.errorPhoneTaken',
    email_taken: 'register.errorEmailTaken',
    guardian_contact_is_own: 'register.errorGuardianIsOwn',

    // Ordering
    measurements_required: 'measurements.orderFromPage',

    // Payment
    order_already_paid: 'customerDashboard.payErrorAlreadyPaid',
    order_not_payable: 'customerDashboard.payErrorNotPayable',
    order_not_payable_online: 'customerDashboard.payErrorNotOnline',
    payment_start_failed: 'customerDashboard.payErrorGatewayDown',
};

/** The i18n key a server code maps to, or null when it is not one we know. */
export function serverMessageKey(code: unknown): string | null {
    return typeof code === 'string' && code in CODES ? CODES[code] : null;
}

/**
 * A translated message for a failed request. `fallbackKey` is used whenever the
 * response carries no code we recognise.
 */
export function translateServerMessage(
    payload: { code?: unknown } | null | undefined,
    t: TFunction,
    fallbackKey: string,
): string {
    const key = serverMessageKey(payload?.code);

    return t(key ?? fallbackKey);
}
