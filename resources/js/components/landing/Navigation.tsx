import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Menu, Search, ShoppingBag, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getAuthUser, getAuthToken } from '../../hooks/useAuth';
import { NotificationBell } from '../NotificationBell';

function LanguageToggle({ isOverDark }: { isOverDark: boolean }) {
    const { i18n } = useTranslation();
    const isKa = i18n.language === 'ka';

    const toggle = () => {
        const next = isKa ? 'en' : 'ka';
        i18n.changeLanguage(next);
        localStorage.setItem('kere_lang', next);
    };

    return (
        <button
            onClick={toggle}
            className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-55 ${isOverDark ? 'text-white' : 'text-[#111111]'}`}
            title={isKa ? 'Switch to English' : 'ქართულზე გადართვა'}
        >
            {isKa ? 'EN' : 'ქართ'}
        </button>
    );
}

export function Navigation() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isOverDark, setIsOverDark] = useState(false);
    const { t } = useTranslation();
    const user  = getAuthToken() ? getAuthUser() : null;
    useEffect(() => {
        function isDarkElement(element: Element | null) {
            const section = element?.closest?.('section, main, [data-nav-theme]');

            if (!section) {
                return false;
            }

            if (
                section.matches(
                    '[data-nav-theme="dark"], .partners-benefits-design, .kere-brand-dark-section, .bg-slate-900, .bg-slate-800',
                )
            ) {
                return true;
            }

            const background = window.getComputedStyle(section).backgroundColor;
            const match = background.match(/\d+(\.\d+)?/g);

            if (!match || match.length < 3) {
                return false;
            }

            const [r, g, b] = match.slice(0, 3).map(Number);
            const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

            return luminance < 0.42;
        }

        function updateTone() {
            const probeY = Math.min(92, window.innerHeight - 1);
            const probeX = Math.floor(window.innerWidth / 2);
            setIsOverDark(isDarkElement(document.elementFromPoint(probeX, probeY)));
        }

        updateTone();
        window.addEventListener('scroll', updateTone, { passive: true });
        window.addEventListener('resize', updateTone);

        return () => {
            window.removeEventListener('scroll', updateTone);
            window.removeEventListener('resize', updateTone);
        };
    }, []);

    const navTextClass = isOverDark ? 'text-white' : 'text-[#111111]';
    const navDividerClass = isOverDark ? 'border-white/25' : 'border-black/15';

    return (
        <header
            data-nav-tone={isOverDark ? 'dark' : 'light'}
            className="kere-site-header fixed inset-x-0 top-0 z-[100] bg-transparent transition-colors duration-300"
        >
            <div className="kere-site-header-bar mx-auto grid h-14 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-16 sm:px-6 lg:h-[68px] lg:px-10">
                <div className="flex min-w-0 items-center gap-4 sm:gap-7">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`inline-flex items-center gap-2 transition-opacity hover:opacity-55 lg:hidden ${navTextClass}`}
                        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                    >
                        {mobileOpen ? <X className="h-[18px] w-[18px] stroke-[1.5]" /> : <Menu className="h-[18px] w-[18px] stroke-[1.5]" />}
                        <span className="hidden text-[11px] font-semibold uppercase tracking-[0.08em] sm:inline">
                            {mobileOpen ? 'Close' : 'Menu'}
                        </span>
                    </button>

                    <div className="hidden items-center gap-7 lg:flex">
                        <a
                            href="#how-it-works"
                            className={`text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                        >
                            {t('nav.howItWorks')}
                        </a>
                        <Link
                            to="/marketplace"
                            className={`text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                        >
                            {t('marketplace.title')}
                        </Link>
                        <Link
                            to="/design"
                            className={`text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                        >
                            {t('nav.startDesigning')}
                        </Link>
                        <a
                            href="#faq"
                            className={`text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                        >
                            {t('nav.faq')}
                        </a>
                    </div>
                </div>

                <Link
                    to="/"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`justify-self-center text-[22px] font-medium leading-none tracking-normal transition-opacity hover:opacity-70 sm:text-[24px] lg:text-[26px] ${navTextClass}`}
                >
                    Kere
                </Link>

                <div className="flex min-w-0 items-center justify-end gap-4 sm:gap-7">
                    <Link
                        to="/partners"
                        className={`hidden text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 md:inline ${navTextClass}`}
                    >
                        {t('nav.forTailors')}
                    </Link>

                    {user ? (
                        <>
                            <Link
                                to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                className={`hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 sm:inline-flex ${navTextClass}`}
                            >
                                <User className="h-[18px] w-[18px] stroke-[1.5]" />
                                <span>{user.first_name} {user.last_name}</span>
                            </Link>

                            <div>
                                <NotificationBell />
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/signin"
                                className={`hidden text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 sm:inline ${navTextClass}`}
                            >
                                {t('nav.signIn')}
                            </Link>

                            <Link to="/signin" aria-label={t('nav.signIn')} className={`inline-flex transition-opacity hover:opacity-55 sm:hidden ${navTextClass}`}>
                                <User className="h-[18px] w-[18px] stroke-[1.5]" />
                            </Link>
                        </>
                    )}

                    <div className={`hidden h-5 items-center border-l pl-5 lg:flex ${navDividerClass}`}>
                        <LanguageToggle isOverDark={isOverDark} />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[130] bg-white lg:hidden"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                setMobileOpen(false);
                            }
                        }}
                    >
                        <motion.aside
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.5 }}
                            className="flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-white px-6 pb-8 pt-6 text-[#111111] sm:px-10 lg:px-16"
                        >
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    aria-label="Close navigation"
                                    className="justify-self-start text-[#111111] transition-opacity hover:opacity-55"
                                >
                                    <X className="h-7 w-7 stroke-[1.4] sm:h-8 sm:w-8" />
                                </button>

                                <Link
                                    to="/"
                                    onClick={() => setMobileOpen(false)}
                                    className="justify-self-center text-center text-[clamp(1.5rem,5vw,2.4rem)] font-semibold uppercase leading-none tracking-[0.1em] text-[#111111]"
                                >
                                    Kere
                                </Link>

                                <Link
                                    to="/marketplace"
                                    onClick={() => setMobileOpen(false)}
                                    aria-label="Marketplace"
                                    className="justify-self-end text-[#111111] transition-opacity hover:opacity-55"
                                >
                                    <ShoppingBag className="h-7 w-7 stroke-[1.6] sm:h-8 sm:w-8" />
                                </Link>
                            </div>

                            <div className="mx-auto mt-14 flex w-full max-w-[620px] items-center gap-4 border-b border-black/14 pb-3 sm:mt-16 sm:gap-5">
                                <Search className="h-6 w-6 shrink-0 text-black/22 sm:h-7 sm:w-7" />
                                <input
                                    readOnly
                                    aria-label={t('marketplace.searchPlaceholder')}
                                    placeholder={t('marketplace.searchPlaceholder')}
                                    className="w-full border-0 bg-transparent p-0 text-[clamp(0.95rem,3vw,1.35rem)] font-light tracking-[0.03em] text-[#111111] placeholder:text-black/48 focus:outline-none focus:ring-0"
                                />
                            </div>

                            <nav className="mx-auto mt-10 flex w-full max-w-[620px] flex-1 flex-col gap-5 sm:mt-12 sm:gap-6 lg:mt-10 lg:grid lg:grid-cols-2 lg:gap-x-14 lg:gap-y-5">
                                <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-[clamp(1.1rem,3.2vw,1.8rem)] font-light lowercase leading-[1.25] tracking-[0.04em] text-[#111111] transition-opacity hover:opacity-45">
                                    {t('nav.howItWorks')}
                                </a>
                                <Link to="/marketplace" onClick={() => setMobileOpen(false)} className="text-[clamp(1.1rem,3.2vw,1.8rem)] font-light lowercase leading-[1.25] tracking-[0.04em] text-[#111111] transition-opacity hover:opacity-45">
                                    {t('marketplace.title')}
                                </Link>
                                <Link to="/design" onClick={() => setMobileOpen(false)} className="text-[clamp(1.1rem,3.2vw,1.8rem)] font-light lowercase leading-[1.25] tracking-[0.04em] text-[#111111] transition-opacity hover:opacity-45">
                                    {t('nav.startDesigning')}
                                </Link>
                                <Link to="/partners" onClick={() => setMobileOpen(false)} className="text-[clamp(1.1rem,3.2vw,1.8rem)] font-light lowercase leading-[1.25] tracking-[0.04em] text-[#111111] transition-opacity hover:opacity-45">
                                    {t('nav.forTailors')}
                                </Link>
                                <a href="#faq" onClick={() => setMobileOpen(false)} className="text-[clamp(1.1rem,3.2vw,1.8rem)] font-light lowercase leading-[1.25] tracking-[0.04em] text-[#111111] transition-opacity hover:opacity-45">
                                    {t('nav.faq')}
                                </a>
                                <Link
                                    to={user ? (user.role === 'admin' ? '/admin-dashboard' : user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard') : '/signin'}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-[clamp(1.1rem,3.2vw,1.8rem)] font-light lowercase leading-[1.25] tracking-[0.04em] text-[#111111] transition-opacity hover:opacity-45"
                                >
                                    {user ? `${user.first_name} ${user.last_name}` : t('nav.signIn')}
                                </Link>
                            </nav>

                            <div className="mx-auto mt-10 flex w-full max-w-[620px] items-center justify-between border-t border-black/10 pt-5">
                                <LanguageToggle isOverDark={false} />
                                {!user && (
                                    <Link
                                        to="/signin"
                                        onClick={() => setMobileOpen(false)}
                                        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111] transition-opacity hover:opacity-55"
                                    >
                                        <User className="h-4 w-4" />
                                        {t('nav.signIn')}
                                    </Link>
                                )}
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
