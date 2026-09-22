/**
 * Cookie/analytics consent banner. Shown once until the visitor chooses;
 * "Accept" injects Microsoft Clarity, "Decline" remembers the refusal.
 * Renders nothing when analytics isn't configured or a choice was already made.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
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
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
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
    }, [visible, preferencesOpen]);

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
                    className="cookie-banner fixed inset-x-0 bottom-0 z-[200]"
                >
                    <button type="button" className="cookie-close" onClick={() => setVisible(false)} aria-label={t('consent.close')}><X size={17} /></button>
                    <h2>{t('consent.title')}</h2>
                    <div className="cookie-banner-row">
                        <p>
                            {t('consent.message')}{' '}
                            <a href="/privacy" className="underline underline-offset-2">{t('consent.learnMore')}</a>
                        </p>
                        <div className="cookie-actions">
                            <Button onClick={accept}>{t('consent.accept')}</Button>
                            <Button onClick={decline}>{t('consent.decline')}</Button>
                            <Button variant="outline" onClick={() => setPreferencesOpen(value => !value)} aria-expanded={preferencesOpen} aria-controls="cookie-preferences">{t('consent.preferences')}</Button>
                        </div>
                    </div>
                    {preferencesOpen && (
                        <div id="cookie-preferences" className="cookie-preferences">
                            <p>{t('consent.essential')}</p>
                            <label className="flex items-center gap-3"><input type="checkbox" checked={analyticsEnabled} onChange={event => setAnalyticsEnabled(event.target.checked)} />{t('consent.analytics')}</label>
                            <Button onClick={() => analyticsEnabled ? accept() : decline()}>{t('consent.savePreferences')}</Button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
