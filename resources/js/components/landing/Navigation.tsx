import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { getAuthToken, getAuthUser } from '../../hooks/useAuth';
import { cartCount, openCart, useCart } from '../../hooks/useCart';
import { CartDrawer } from '../CartDrawer';
import { NotificationBell } from '../NotificationBell';

/**
 * Underlines the label and grows it slightly on hover of the parent `group`.
 * The size change is `font-size`, not `scale` — a transform hands the browser a
 * rasterised bitmap to stretch, which reads as blur until the animation ends.
 * The hidden copy holds the box at the label's *resting* width and the visible
 * copy is taken out of flow, so growing it overflows symmetrically instead of
 * either shifting neighbours or padding the bar out by 10% at every width.
 */
function AnimatedNavText({ children }: { children: ReactNode }) {
    return (
        <span className="relative inline-block align-middle">
            <span aria-hidden className="invisible">
                {children}
            </span>
            <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap underline decoration-transparent decoration-1 underline-offset-4 transition-all duration-300 ease-out group-hover:text-[1.1em] group-hover:decoration-current">
                {children}
            </span>
        </span>
    );
}

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
            className={`text-[10px] font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-55 ${isOverDark ? 'text-white' : 'text-[#111111]'}`}
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
    const user = getAuthToken() ? getAuthUser() : null;
    const cartItems = useCart();
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

            if (section.matches('[data-nav-theme="dark"], .partners-benefits-design, .kere-brand-dark-section, .bg-slate-900, .bg-slate-800')) {
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
    const itemCount = cartCount(cartItems);

    return (
        <header
            data-nav-tone={isOverDark ? 'dark' : 'light'}
            data-scrolled={isScrolled ? 'true' : 'false'}
            className={`kere-site-header fixed inset-x-0 top-0 z-[100] pt-1.5 backdrop-blur-xl transition-all duration-500 ${isOverDark ? 'bg-[#1c1c1c] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)]' : 'bg-[#F4F0E9] text-[#111111] shadow-[0_1px_0_rgba(0,0,0,0.06)]'}`}
        >
            <div className="kere-site-header-bar mx-auto grid h-10 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-11 sm:px-6 lg:h-11 lg:px-10">
                <div className="col-start-1 flex min-w-0 items-center gap-4 sm:gap-7">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`inline-flex items-center gap-2 transition-opacity hover:opacity-55 xl:hidden ${navTextClass}`}
                        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                    >
                        {mobileOpen ? <X className="h-4 w-4 stroke-[1.5]" /> : <Menu className="h-4 w-4 stroke-[1.5]" />}
                        <span className="hidden text-[10px] font-semibold tracking-[0.08em] uppercase sm:inline">
                            {mobileOpen ? 'Close' : 'Menu'}
                        </span>
                    </button>

                    <Link
                        to="/"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        aria-label="Kere"
                        className={`inline-flex items-center ${navTextClass}`}
                    >
                        <span aria-hidden className="kere-nav-logo h-[14px] sm:h-[15px] lg:h-4" />
                    </Link>
                </div>

                <div className="col-start-2 hidden items-center gap-7 xl:flex">
                    <Link
                        to="/marketplace"
                        className={`group text-[10px] font-semibold tracking-[0.08em] uppercase ${navTextClass}`}
                    >
                        <AnimatedNavText>{t('marketplace.title')}</AnimatedNavText>
                    </Link>
                    <Link
                        to="/design"
                        className={`group text-[10px] font-semibold tracking-[0.08em] uppercase ${navTextClass}`}
                    >
                        <AnimatedNavText>{t('nav.startDesigning')}</AnimatedNavText>
                    </Link>
                    <Link
                        to="/remodel"
                        className={`group text-[10px] font-semibold tracking-[0.08em] uppercase ${navTextClass}`}
                    >
                        <AnimatedNavText>{t('nav.remodel')}</AnimatedNavText>
                    </Link>
                    {showSiteAnchors && (
                        <>
                            <a
                                href="#how-it-works"
                                className={`group text-[10px] font-semibold tracking-[0.08em] uppercase ${navTextClass}`}
                            >
                                <AnimatedNavText>{t('nav.howItWorks')}</AnimatedNavText>
                            </a>
                            <a
                                href="#faq"
                                className={`group text-[10px] font-semibold tracking-[0.08em] uppercase ${navTextClass}`}
                            >
                                <AnimatedNavText>{t('nav.faq')}</AnimatedNavText>
                            </a>
                        </>
                    )}
                </div>

                <div className="col-start-3 flex min-w-0 items-center justify-end gap-4 sm:gap-7">
                    <Link
                        to="/partners"
                        className={`group hidden text-[10px] font-semibold tracking-[0.08em] uppercase md:inline ${navTextClass}`}
                    >
                        <AnimatedNavText>{t('nav.forTailors')}</AnimatedNavText>
                    </Link>

                    <div className="inline-flex sm:hidden">
                        <LanguageToggle isOverDark={isOverDark} />
                    </div>

                    <button
                        type="button"
                        onClick={openCart}
                        aria-label={itemCount > 0 ? t('cart.openWithCount', { n: itemCount }) : t('cart.open')}
                        className={`relative inline-flex transition-opacity hover:opacity-55 ${navTextClass}`}
                    >
                        <ShoppingBag className="h-4 w-4 stroke-[1.5]" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-[var(--color-brand)] px-1 text-center text-[9px] leading-4 font-bold text-white">
                                {itemCount > 99 ? '99+' : itemCount}
                            </span>
                        )}
                    </button>

                    {user ? (
                        <>
                            <Link
                                to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                className={`group hidden items-center gap-2 text-[10px] font-semibold tracking-[0.08em] uppercase sm:inline-flex ${navTextClass}`}
                            >
                                <User className="h-4 w-4 stroke-[1.5]" />
                                <AnimatedNavText>{user.first_name} {user.last_name}</AnimatedNavText>
                            </Link>

                            <div>
                                <NotificationBell />
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/signin"
                                className="kere-sign-in-link group hidden min-h-9 items-center bg-[#111111] px-4 text-sm font-normal !text-white transition-colors hover:bg-[#2b2b2b] hover:!text-white sm:inline-flex"
                            >
                                <AnimatedNavText>{t('nav.signIn')}</AnimatedNavText>
                            </Link>

                            <Link
                                to="/signin"
                                aria-label={t('nav.signIn')}
                                className={`inline-flex transition-opacity hover:opacity-55 sm:hidden ${navTextClass}`}
                            >
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
                        className="fixed inset-0 z-[1000] bg-[#E4E0D7] xl:hidden"
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
                            className="flex min-h-[100dvh] w-full flex-col overflow-y-auto bg-[#E4E0D7] px-5 pt-5 pb-7 text-[#111111] sm:px-8 sm:pt-7 sm:pb-9 lg:px-12"
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
                                    aria-label="Kere"
                                    className="inline-flex justify-self-center text-[#111111]"
                                >
                                    <span aria-hidden className="kere-nav-logo h-[clamp(17px,2.9vw,26px)]" />
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

                            <nav className="mx-auto mt-10 grid w-full max-w-[720px] flex-1 gap-0 border-t border-black/10 sm:mt-12 md:grid-cols-2">

                                {showSiteAnchors && (
                                    <a
                                        href="#how-it-works"
                                        onClick={() => setMobileOpen(false)}
                                        className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] leading-none font-light tracking-normal text-[#111111] lowercase transition-opacity hover:opacity-45 md:px-5"
                                    >
                                        {t('nav.howItWorks')}
                                    </a>
                                )}
                                <Link
                                    to="/marketplace"
                                    onClick={() => setMobileOpen(false)}
                                    className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] leading-none font-light tracking-normal text-[#111111] lowercase transition-opacity hover:opacity-45 md:px-5"
                                >
                                    {t('marketplace.title')}
                                </Link>
                                <Link
                                    to="/design"
                                    onClick={() => setMobileOpen(false)}
                                    className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] leading-none font-light tracking-normal text-[#111111] lowercase transition-opacity hover:opacity-45 md:px-5"
                                >
                                    {t('nav.startDesigning')}
                                </Link>
                                <Link
                                    to="/remodel"
                                    onClick={() => setMobileOpen(false)}
                                    className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] leading-none font-light tracking-normal text-[#111111] lowercase transition-opacity hover:opacity-45 md:px-5"
                                >
                                    {t('nav.remodel')}
                                </Link>
                                <Link
                                    to="/partners"
                                    onClick={() => setMobileOpen(false)}
                                    className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] leading-none font-light tracking-normal text-[#111111] lowercase transition-opacity hover:opacity-45 md:px-5"
                                >
                                    {t('nav.forTailors')}
                                </Link>
                                {showSiteAnchors && (
                                    <a
                                        href="#faq"
                                        onClick={() => setMobileOpen(false)}
                                        className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] leading-none font-light tracking-normal text-[#111111] lowercase transition-opacity hover:opacity-45 md:px-5"
                                    >
                                        {t('nav.faq')}
                                    </a>
                                )}
                                <Link
                                    to={
                                        user
                                            ? user.role === 'admin'
                                                ? '/admin-dashboard'
                                                : user.role === 'tailor'
                                                  ? '/tailor-dashboard'
                                                  : '/customer-dashboard'
                                            : '/signin'
                                    }
                                    onClick={() => setMobileOpen(false)}
                                    className="border-b border-black/10 py-5 text-[clamp(1.05rem,2.5vw,1.55rem)] leading-none font-light tracking-normal text-[#111111] lowercase transition-opacity hover:opacity-45 md:px-5"
                                >
                                    {user ? `${user.first_name} ${user.last_name}` : t('nav.signIn')}
                                </Link>
                            </nav>

                            <div className="mx-auto mt-6 flex w-full max-w-[720px] items-center justify-end pt-2">
                                {!user && (
                                    <Link
                                        to="/signin"
                                        onClick={() => setMobileOpen(false)}
                                        className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.14em] text-[#111111] uppercase transition-opacity hover:opacity-55"
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

            <CartDrawer />
        </header>
    );
}
