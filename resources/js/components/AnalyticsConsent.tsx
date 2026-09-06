/**
 * Cookie/analytics consent banner. Shown once until the visitor chooses;
 * "Accept" injects Microsoft Clarity, "Decline" remembers the refusal.
 * Renders nothing when analytics isn't configured or a choice was already made.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
    getConsent,
    setConsent,
    initClarity,
    isAnalyticsConfigured,
} from '../lib/analytics';

export function AnalyticsConsent() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const bannerRef = useRef<HTMLDivElement>(null);

    /**
     * Publish the banner's measured height so pages can reserve room for it.
     *
     * It is fixed to the bottom of the viewport at z-[200], so whatever sits at
     * the end of a page is genuinely unclickable underneath it — on the
     * customizer that was the primary Continue button. A fixed padding guess
     * does not hold: the banner measures ~145px in English and up to ~184px in
     * Georgian at 360px wide, because the copy wraps differently.
     */
    useEffect(() => {
        if (!visible) {
            document.documentElement.style.removeProperty('--kere-consent-h');
            return;
        }

        const publish = () => {
            const h = bannerRef.current?.offsetHeight ?? 0;
            document.documentElement.style.setProperty('--kere-consent-h', `${h}px`);
        };

        publish();
        // The banner is animated in, so its first measurement can be mid-flight.
        const settle = window.setTimeout(publish, 600);
        window.addEventListener('resize', publish);

        return () => {
            window.clearTimeout(settle);
            window.removeEventListener('resize', publish);
            document.documentElement.style.removeProperty('--kere-consent-h');
        };
    }, [visible]);

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
                    ref={bannerRef}
                    data-testid="analytics-consent"
                    className="fixed inset-x-0 bottom-0 z-[200]"
                >
                    <div className="relative border-t border-black/20 bg-[#F7F5F0] px-5 py-6 text-black shadow-[0_-10px_35px_rgba(0,0,0,0.08)] sm:px-10 sm:py-8 lg:px-14">
                        <button
                            type="button"
                            onClick={decline}
                            aria-label={t('consent.decline')}
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-black transition-opacity hover:opacity-55 sm:right-7 sm:top-6"
                        >
                            <X className="h-7 w-7 stroke-[1.6]" />
                        </button>

                        <p className="max-w-5xl pr-12 text-sm font-normal leading-6 uppercase tracking-[0.01em] sm:text-base sm:leading-7">
                            {t('consent.message')}
                        </p>

                        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-5">
                            <button
                                type="button"
                                onClick={decline}
                                className="min-h-12 border border-black bg-transparent px-7 text-sm font-normal uppercase tracking-[0.02em] text-black transition-colors hover:bg-black hover:text-white sm:min-w-[260px] sm:text-base"
                            >
                                {t('consent.decline')}
                            </button>
                            <button
                                type="button"
                                onClick={accept}
                                className="min-h-12 border border-black bg-black px-7 text-sm font-normal uppercase tracking-[0.02em] text-white transition-colors hover:bg-[#292929] sm:min-w-[200px] sm:text-base"
                            >
                                {t('consent.accept')}
                            </button>
                            <a
                                href="/privacy"
                                className="w-fit border-b border-black pb-1 text-sm font-normal uppercase tracking-[0.02em] text-black transition-opacity hover:opacity-55 sm:ml-1 sm:text-base"
                            >
                                {t('consent.learnMore')}
                            </a>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
