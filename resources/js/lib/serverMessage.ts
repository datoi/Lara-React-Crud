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
    // Signing in (wrong_role depends on which sign-in page asked, so Login maps it)
    account_suspended: 'signIn.errorSuspended',

    // Registration
    phone_taken: 'register.errorPhoneTaken',
    email_taken: 'register.errorEmailTaken',
    guardian_contact_is_own: 'register.errorGuardianIsOwn',

    // Ordering
    measurements_required: 'measurements.orderFromPage',
    custom_orders_paused: 'designer.ordersPaused',

    // Kere's offer
    no_offer: 'offer.errorNoOffer',
    offer_unavailable: 'offer.errorUnavailable',
    offer_changed: 'offer.errorChanged',

    // Payment
    order_already_paid: 'customerDashboard.payErrorAlreadyPaid',
    order_not_payable: 'customerDashboard.payErrorNotPayable',
    order_not_payable_online: 'customerDashboard.payErrorNotOnline',
    payment_start_failed: 'customerDashboard.payErrorGatewayDown',

    // After the order: cancelling, returns, problem reports, a new date
    order_not_cancellable: 'orderCare.errorNotCancellable',
    return_window_closed: 'orderCare.errorReturnClosed',
    return_not_available: 'orderCare.errorReturnUnavailable',
    claim_exists: 'orderCare.errorClaimExists',
    problem_not_available: 'orderCare.errorProblemUnavailable',
    no_date_proposed: 'orderCare.errorNoDate',

    // Reviews
    review_exists: 'reviewModal.errorExists',
    review_not_delivered: 'reviewModal.errorNotDelivered',

    // A tailor's remodel steps
    garment_not_received: 'tailorCare.errorNotReceived',
    photos_required: 'tailorCare.errorPhotosRequired',
    not_awaiting_garment: 'tailorCare.errorNotAwaiting',
    no_due_date: 'tailorCare.errorNoDueDate',

    // Admin: courier steps, refunds, claims
    step_not_available: 'adminCare.errorStep',
    refund_exceeds_paid: 'adminCare.errorRefundExceeds',
    refund_failed: 'adminCare.errorRefundFailed',
    refund_in_progress: 'adminCare.errorRefundInProgress',
    refund_unresolved: 'adminCare.errorRefundUnresolved',
    claim_closed: 'adminCare.errorClaimClosed',
    // Admin: Kere's offer and the two conversations
    order_not_open: 'adminOffer.errorNotOpen',
    estimate_unavailable: 'adminOffer.errorEstimate',
    use_offer: 'adminOffer.errorUseOffer',
    no_tailor: 'adminOffer.errorNoTailor',
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
