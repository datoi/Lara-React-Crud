import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Check, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { getAuthToken } from '../hooks/useAuth';

/**
 * Where the gateway returns the customer after paying.
 *
 * The order is not paid because this page loaded — it is paid because the
 * gateway says so. The server callback is the normal path, but it cannot reach
 * a local machine and can lag behind the customer's redirect in production, so
 * this asks the server to re-check, which asks the gateway directly.
 *
 * That answer can arrive a moment after the redirect does, so a 'pending' reply
 * is retried a few times before the page settles on it. Landing on "not
 * confirmed" for a payment that has in fact gone through is the one outcome
 * worth spending a few seconds to avoid.
 */

type State = 'checking' | 'paid' | 'pending' | 'unknown';

const ATTEMPTS = 5;
const GAP_MS = 2000;

export default function PaymentComplete() {
    const { t } = useTranslation();
    const [params] = useSearchParams();
    const [state, setState] = useState<State>('checking');
    const started = useRef(false);
    const inFlight = useRef(false);

    const orderId = params.get('id');
    const orderNumber = params.get('order');

    const confirm = useCallback(async () => {
        // "Check again" unmounts itself by switching to 'checking', but two
        // clicks in one frame both see the old state — and two overlapping
        // retry loops would race each other's setState.
        if (inFlight.current) return;
        inFlight.current = true;

        const token = getAuthToken();

        // Without a session there is nothing to ask on the customer's behalf.
        // The token lives in sessionStorage, so a gateway that returns into a
        // new tab — which a bank's 3-D Secure app commonly does on mobile —
        // lands here signed out. Nothing is lost, the callback settles the
        // order, but this page cannot say so and must offer the way back in.
        if (!token || !orderId) {
            setState('unknown');
            inFlight.current = false;
            return;
        }

        setState('checking');

        for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
            try {
                const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.payment_status === 'paid') {
                        setState('paid');
                        inFlight.current = false;
                        return;
                    }
                }
            } catch {
                // Network hiccup — the remaining attempts are the retry.
            }

            if (attempt < ATTEMPTS - 1) {
                await new Promise(resolve => setTimeout(resolve, GAP_MS));
            }
        }

        setState('pending');
        inFlight.current = false;
    }, [orderId]);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        void confirm();
    }, [confirm]);

    const icon = {
        checking: <Loader2 className="h-7 w-7 animate-spin text-[var(--kd-muted)]" />,
        paid: <Check className="h-7 w-7 text-[var(--kd-burgundy)]" />,
        pending: <Clock className="h-7 w-7 text-[var(--kd-muted)]" />,
        unknown: <Clock className="h-7 w-7 text-[var(--kd-muted)]" />,
    }[state];

    const title = {
        checking: t('payment.checkingTitle'),
        paid: t('payment.paidTitle'),
        pending: t('payment.pendingTitle'),
        unknown: t('payment.unknownTitle'),
    }[state];

    const body = {
        checking: t('payment.checkingBody'),
        paid: t('payment.paidBody'),
        pending: t('payment.pendingBody'),
        unknown: t('payment.unknownBody'),
    }[state];

    return (
        <div className="kere-product flex min-h-screen flex-col items-center justify-center px-4 py-16">
            <Helmet><title>{t('payment.pageTitle')}</title></Helmet>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[420px] rounded-2xl border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-6 py-10 text-center sm:px-10"
            >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--kd-stage)]">
                    {icon}
                </div>

                {/* The result replaces itself in place, so it is announced rather
                    than left for a screen reader to discover. */}
                <div aria-live="polite" aria-atomic="true">
                    <h1 className="kd-display text-[24px] leading-tight text-[var(--kd-ink)]">{title}</h1>
                    <p className="mt-3 text-[14px] leading-relaxed text-[var(--kd-body)]">{body}</p>
                </div>

                {orderNumber && (
                    <p className="mt-5 text-[13px] text-[var(--kd-muted)]">
                        {t('payment.orderLabel')}{' '}
                        <span className="font-medium text-[var(--kd-ink)]">{orderNumber}</span>
                    </p>
                )}

                <div className="mt-8 flex flex-col gap-3">
                    {state === 'pending' && (
                        <Button onClick={() => void confirm()}>{t('payment.checkAgain')}</Button>
                    )}

                    {/* Signed out, "my orders" only bounces off the route guard,
                        so the way back in is the offer that makes sense here. */}
                    {state === 'unknown' && (
                        <Link to="/login/customer" className="w-full">
                            <Button className="w-full">{t('payment.signIn')}</Button>
                        </Link>
                    )}

                    {(state === 'paid' || state === 'pending') && (
                        <Link to="/customer-dashboard" className="w-full">
                            <Button variant={state === 'paid' ? 'default' : 'outline'} className="w-full">
                                {t('payment.viewOrders')}
                            </Button>
                        </Link>
                    )}

                    <Link
                        to="/marketplace"
                        className="text-[14px] text-[var(--kd-body)] underline underline-offset-4 transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                    >
                        {t('payment.backToMarketplace')}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
