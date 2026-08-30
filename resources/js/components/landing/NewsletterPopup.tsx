import { FormEvent, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

// Seeing the popup once is enough — the flag is written on any dismissal, so a
// returning visitor is never interrupted again. The Join banner's button still
// opens it on demand, which is why that path ignores the flag.
const SEEN_KEY = 'kere_newsletter_seen';

function alreadySeen(): boolean {
    try {
        return localStorage.getItem(SEEN_KEY) === '1';
    } catch {
        return false;
    }
}

function markSeen(): void {
    try {
        localStorage.setItem(SEEN_KEY, '1');
    } catch {
        /* private mode — the popup simply shows again next visit */
    }
}

export function NewsletterPopup() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [email, setEmail] = useState('');
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const close = () => {
        markSeen();
        setOpen(false);
    };

    useEffect(() => {
        if (alreadySeen()) return;
        const timer = window.setTimeout(() => setOpen(true), 450);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleOpen = () => {
            setSubmitted(false);
            setOpen(true);
        };
        window.addEventListener('kere:open-newsletter', handleOpen);
        return () => window.removeEventListener('kere:open-newsletter', handleOpen);
    }, []);

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    // No newsletter endpoint exists yet — the footer form is the same UI-only
    // stub. Confirm in place rather than closing silently, so the submit is not
    // indistinguishable from a dismissal.
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!firstName.trim() || !email.trim()) return;
        markSeen();
        setSubmitted(true);
        setFirstName('');
        setEmail('');
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-4 sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="newsletter-popup-title"
                className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[460px] overflow-y-auto bg-[#FDFCF3] px-5 pb-6 pt-12 text-[#222222] shadow-2xl sm:px-10 sm:pb-8 sm:pt-14"
            >
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={close}
                    aria-label={t('newsletterPopup.close')}
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222]"
                >
                    <X className="h-6 w-6 stroke-[1.5]" />
                </button>

                <div className="relative z-10 text-center">
                    <h2
                        id="newsletter-popup-title"
                        className="bg-clip-text pb-1 font-serif text-[clamp(1.9rem,5vw,2.6rem)] font-normal leading-[1.25] tracking-[-0.03em] text-transparent"
                        style={{
                            backgroundImage: "url('/assets/textures/gold-foil.png')",
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {t('newsletterPopup.title')}
                    </h2>
                    <p
                        className="mx-auto mt-3 max-w-sm bg-clip-text text-sm font-normal leading-6 text-transparent sm:text-base"
                        style={{
                            backgroundImage: "url('/assets/textures/gold-foil.png')",
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {t('newsletterPopup.description')}
                    </p>
                </div>

                {submitted ? (
                    <p role="status" className="relative z-10 mt-6 text-center text-sm font-normal leading-6 text-[#222222]">
                        {t('footer.newsletterSuccess')}
                    </p>
                ) : (
                <form onSubmit={handleSubmit} className="relative z-10 mt-6 space-y-2.5">
                    <label className="sr-only" htmlFor="newsletter-first-name">{t('newsletterPopup.firstName')}</label>
                    <input
                        id="newsletter-first-name"
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder={t('newsletterPopup.firstName')}
                        autoComplete="given-name"
                        required
                        className="h-12 w-full border border-[#2A2A28] bg-transparent px-4 text-base font-normal outline-none placeholder:text-[#2A2A28] focus:border-[#6F1D24]"
                    />

                    <label className="sr-only" htmlFor="newsletter-email">{t('newsletterPopup.email')}</label>
                    <input
                        id="newsletter-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t('newsletterPopup.email')}
                        autoComplete="email"
                        required
                        className="h-12 w-full border border-[#2A2A28] bg-transparent px-4 text-base font-normal outline-none placeholder:text-[#2A2A28] focus:border-[#6F1D24]"
                    />

                    <p className="px-1 py-1.5 text-center text-[11px] font-normal leading-4 text-black/65 sm:px-3">
                        {t('newsletterPopup.consent')}{' '}
                        <Link to="/privacy" onClick={close} className="text-black underline underline-offset-4">
                            {t('footer.privacyPolicy')}
                        </Link>{' '}
                        {t('newsletterPopup.and')}{' '}
                        <Link to="/terms" onClick={close} className="text-black underline underline-offset-4">
                            {t('footer.termsOfService')}
                        </Link>.
                    </p>

                    <button
                        type="submit"
                        className="h-12 w-full bg-[#222222] px-5 text-sm font-normal uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#6F1D24]"
                        style={{ color: '#ffffff' }}
                    >
                        {t('newsletterPopup.submit')}
                    </button>
                </form>
                )}
            </section>
        </div>
    );
}
