import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
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
    const [isScrolled, setIsScrolled] = useState(false);
    const { t } = useTranslation();
    const user  = getAuthToken() ? getAuthUser() : null;
    const { pathname } = useLocation();
    // The #how-it-works / #faq sections exist on the landing and "for tailors" pages,
    // so the navbar anchors show there (and scroll to whichever page you're on).
    const isLanding = pathname === '/';
    const isPartners = pathname === '/partners' || pathname === '/become-a-tailor';
    const showSiteAnchors = isLanding || isPartners;
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
            setIsScrolled(window.scrollY > 8);
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
            data-scrolled={isScrolled ? 'true' : 'false'}
            className={`kere-site-header fixed inset-x-0 top-0 z-[100] backdrop-blur-xl transition-all duration-500 ${isOverDark ? 'bg-[#1c1c1c] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]' : 'bg-[#F4F0E9] text-[#111111] shadow-[0_1px_0_rgba(0,0,0,0.06)]'}`}
        >
            <div className="kere-site-header-bar mx-auto grid h-10 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-11 sm:px-6 lg:h-11 lg:px-10">
                <div className="flex min-w-0 items-center gap-4 sm:gap-7">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`inline-flex items-center gap-2 transition-opacity hover:opacity-55 lg:hidden ${navTextClass}`}
                        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                    >
                        {mobileOpen ? <X className="h-4 w-4 stroke-[1.5]" /> : <Menu className="h-4 w-4 stroke-[1.5]" />}
                        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.08em] sm:inline">
                            {mobileOpen ? 'Close' : 'Menu'}
                        </span>
                    </button>

                    <div className="hidden items-center gap-7 lg:flex">
                        {showSiteAnchors && (
                            <a
                                href="#how-it-works"
                                className={`text-[10px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                            >
                                {t('nav.howItWorks')}
                            </a>
                        )}
                        <Link
                            to="/marketplace"
                            className={`text-[10px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                        >
                            {t('marketplace.title')}
                        </Link>
                        <Link
                            to="/design"
                            className={`text-[10px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                        >
                            {t('nav.startDesigning')}
                        </Link>
                        {showSiteAnchors && (
                            <a
                                href="#faq"
                                className={`text-[10px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 ${navTextClass}`}
                            >
                                {t('nav.faq')}
                            </a>
                        )}
                    </div>
                </div>

                <Link
                    to="/"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`justify-self-center text-[18px] font-medium leading-none tracking-normal transition-opacity hover:opacity-70 sm:text-[19px] lg:text-[20px] ${navTextClass}`}
                >
                    Kere
                </Link>

                <div className="flex min-w-0 items-center justify-end gap-4 sm:gap-7">
                    <Link
                        to="/partners"
                        className={`hidden text-[10px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 md:inline ${navTextClass}`}
                    >
                        {t('nav.forTailors')}
                    </Link>

                    <div className="inline-flex sm:hidden">
                        <LanguageToggle isOverDark={isOverDark} />
                    </div>

                    {user ? (
                        <>
                            <Link
                                to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                className={`hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 sm:inline-flex ${navTextClass}`}
                            >
                                <User className="h-4 w-4 stroke-[1.5]" />
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
                                className={`hidden text-[10px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 sm:inline ${navTextClass}`}
                            >
                                {t('nav.signIn')}
                            </Link>

                            <Link to="/signin" aria-label={t('nav.signIn')} className={`inline-flex transition-opacity hover:opacity-55 sm:hidden ${navTextClass}`}>
                                <User className="h-4 w-4 stroke-[1.5]" />
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
                        className="fixed inset-0 z-[1000] bg-[#E4E0D7] lg:hidden"
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
                            className="flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-[#E4E0D7] px-5 pb-7 pt-5 text-[#111111] sm:px-8 sm:pb-9 sm:pt-7 lg:px-12"
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
                                    className="justify-self-center text-center text-[clamp(1.45rem,4vw,2.15rem)] font-medium leading-none tracking-normal text-[#111111]"
                                >
                                    Kere
                                </Link>

                                <div className="flex items-center justify-end gap-4">
                                    <LanguageToggle isOverDark={false} />

                                    <Link
                                        to="/marketplace"
                                        onClick={() => setMobileOpen(false)}
                                        aria-label="Marketplace"
                                        className="text-[#111111] transition-opacity hover:opacity-55"
                                    >
                                        <ShoppingBag className="h-6 w-6 stroke-[1.6] sm:h-7 sm:w-7" />
                                    </Link>
                                </div>
                            </div>

                            <div className="mx-auto mt-10 flex w-full max-w-[720px] items-center gap-4 border-b border-black/14 pb-3 sm:mt-12 sm:gap-5">
                                <Search className="h-5 w-5 shrink-0 text-black/28 sm:h-6 sm:w-6" />
                                <input
                                    readOnly
                                    aria-label={t('marketplace.searchPlaceholder')}
                                    placeholder={t('marketplace.searchPlaceholder')}
                                    className="w-full border-0 bg-transparent p-0 text-[clamp(0.9rem,2.1vw,1.12rem)] font-light tracking-normal text-[#111111] placeholder:text-black/50 focus:outline-none focus:ring-0"
                                />
                            </div>

                            <nav className="mx-auto mt-8 grid w-full max-w-[720px] flex-1 gap-0 border-t border-black/10 sm:mt-10 md:grid-cols-2">
                                {showSiteAnchors && (
                                    <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] font-light lowercase leading-none tracking-normal text-[#111111] transition-opacity hover:opacity-45 md:px-5">
                                        {t('nav.howItWorks')}
                                    </a>
                                )}
                                <Link to="/marketplace" onClick={() => setMobileOpen(false)} className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] font-light lowercase leading-none tracking-normal text-[#111111] transition-opacity hover:opacity-45 md:px-5">
                                    {t('marketplace.title')}
                                </Link>
                                <Link to="/design" onClick={() => setMobileOpen(false)} className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] font-light lowercase leading-none tracking-normal text-[#111111] transition-opacity hover:opacity-45 md:px-5">
                                    {t('nav.startDesigning')}
                                </Link>
                                <Link to="/partners" onClick={() => setMobileOpen(false)} className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] font-light lowercase leading-none tracking-normal text-[#111111] transition-opacity hover:opacity-45 md:px-5">
                                    {t('nav.forTailors')}
                                </Link>
                                {showSiteAnchors && (
                                    <a href="#faq" onClick={() => setMobileOpen(false)} className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] font-light lowercase leading-none tracking-normal text-[#111111] transition-opacity hover:opacity-45 md:px-5">
                                        {t('nav.faq')}
                                    </a>
                                )}
                                <Link
                                    to={user ? (user.role === 'admin' ? '/admin-dashboard' : user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard') : '/signin'}
                                    onClick={() => setMobileOpen(false)}
                                    className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] font-light lowercase leading-none tracking-normal text-[#111111] transition-opacity hover:opacity-45 md:px-5"
                                >
                                    {user ? `${user.first_name} ${user.last_name}` : t('nav.signIn')}
                                </Link>
                            </nav>

                            <div className="mx-auto mt-6 flex w-full max-w-[720px] items-center justify-end pt-2">
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
