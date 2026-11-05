import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import legalVersions from '../data/legalVersions.json';
import { cn } from '../lib/utils';

/**
 * A link to a legal page inside consent wording, for `<Trans components>`. It
 * opens a new tab, so reading the terms never costs a half-filled form. Inside
 * a `<label>` the link opens without ticking the box: a label does not act on
 * clicks that land on a link within it.
 */
export function legalLink(href: '/terms' | '/privacy' | '/refund-policy'): ReactElement {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brand" />;
}

const NOTICES = {
    order: 'legalConsent.noticeOrder',
    request: 'legalConsent.noticeRequest',
    offer: 'legalConsent.noticeOffer',
} as const;

/**
 * The line beside a button that commits the customer: placing an order,
 * sending a remodel request, or accepting Kere's offer. It names the version of
 * the terms in force, the one the server records on the order.
 */
export function OrderTermsNotice({ action, className }: { action: keyof typeof NOTICES; className?: string }) {
    const { t } = useTranslation();

    return (
        <p className={cn('text-[12px] leading-5', className)}>
            <Trans
                t={t}
                i18nKey={NOTICES[action]}
                values={{ version: legalVersions.terms }}
                components={{ terms: legalLink('/terms'), refund: legalLink('/refund-policy') }}
            />
        </p>
    );
}
