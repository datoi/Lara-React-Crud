/**
 * Cookie/analytics consent banner. Shown once until the visitor chooses;
 * "Accept" injects Microsoft Clarity, "Decline" remembers the refusal.
 * Renders nothing when analytics isn't configured or a choice was already made.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import {
    getConsent,
    setConsent,
    initClarity,
    isAnalyticsConfigured,
} from '../lib/analytics';

export function AnalyticsConsent() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!isAnalyticsConfigured()) return;

        const consent = getConsent();
        if (consent === 'granted') {
            initClarity();
        } else if (consent === null) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        setConsent('granted');
        initClarity();
        setVisible(false);
    };

    const decline = () => {
        setConsent('denied');
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    role="dialog"
                    aria-live="polite"
                    aria-label={t('consent.title')}
                    data-testid="analytics-consent"
                    /* Sits above any page-level fixed bottom bar (the customizer
                       publishes its height as --kere-bottom-bar) so it never
                       covers a primary action; falls back to flush-bottom. */
                    className="fixed inset-x-0 bottom-[var(--kere-bottom-bar,0px)] z-[200] p-3 sm:p-6"
                >
                    <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                        <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                            {t('consent.message')}{' '}
                            <a href="/privacy" className="font-medium text-brand underline underline-offset-2 hover:opacity-80">
                                {t('consent.learnMore')}
                            </a>
                        </p>

                        <div className="flex shrink-0 gap-2">
                            <Button variant="outline" size="sm" onClick={decline}>
                                {t('consent.decline')}
                            </Button>
                            <Button variant="default" size="sm" onClick={accept}>
                                {t('consent.accept')}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
