import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Menu, X, User } from 'lucide-react';
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
            className="kere-site-header fixed inset-x-0 top-0 z-[100] border-b border-transparent bg-transparent transition-colors duration-300"
        >
            <div className="kere-site-header-bar mx-auto grid h-14 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:h-16 sm:px-6 lg:h-[68px] lg:px-10">
                <div className="flex min-w-0 items-center gap-4 sm:gap-7">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`inline-flex items-center gap-2 transition-opacity hover:opacity-55 ${navTextClass}`}
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

                    <Link
                        to="/design"
                        className={`hidden text-[11px] font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-55 md:inline ${navTextClass}`}
                    >
                        {t('nav.startDesigning')}
                    </Link>

                    <div className={`hidden h-5 border-l pl-5 lg:block ${navDividerClass}`}>
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
                        className="fixed inset-0 z-[130] bg-black/35 md:hidden"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                setMobileOpen(false);
                            }
                        }}
                    >
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-y-0 left-0 flex w-full max-w-[580px] flex-col bg-[#f7f6f3] px-6 py-6 sm:px-10 sm:py-8"
                        >
                            <div className="flex items-center justify-between border-b border-black/15 pb-6">
                                <Link
                                    to="/"
                                    onClick={() => setMobileOpen(false)}
                                    className="text-[24px] font-medium tracking-normal text-[#111111]"
                                >
                                    Kere
                                </Link>

                                <button
                                    onClick={() => setMobileOpen(false)}
                                    aria-label="Close navigation"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/20 transition-colors hover:bg-[#111111] hover:text-white"
                                >
                                    <X className="h-5 w-5 stroke-[1.5]" />
                                </button>
                            </div>

                            <nav className="flex flex-1 flex-col justify-center py-12">
                            {[
                                { to: '#how-it-works', label: t('nav.howItWorks'), isAnchor: true },
                                { to: '#faq',          label: t('nav.faq'), isAnchor: true },
                            ].map(link => (
                                link.isAnchor ? (
                                    <a
                                        key={link.to}
                                        href={link.to}
                                        onClick={() => setMobileOpen(false)}
                                        className="group grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-black/15 py-5 sm:py-7"
                                    >
                                        <span className="text-[10px] font-bold tracking-[0.14em] text-black/40">
                                            {link.to === '#how-it-works' ? '01' : '02'}
                                        </span>
                                        <span className="font-serif text-[clamp(1.25rem,3.6vw,2.15rem)] font-medium leading-tight tracking-normal text-[#111111]">
                                            {link.label}
                                        </span>
                                        <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">→</span>
                                    </a>
                                ) : (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileOpen(false)}
                                        className="group grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-black/15 py-5 sm:py-7"
                                    >
                                        <span className="text-[10px] font-bold tracking-[0.14em] text-black/40">01</span>
                                        <span className="font-serif text-[clamp(1.25rem,3.6vw,2.15rem)] font-medium leading-tight tracking-normal text-[#111111]">
                                            {link.label}
                                        </span>
                                        <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">→</span>
                                    </Link>
                                )
                            ))}
                            <Link
                                to="/partners"
                                onClick={() => setMobileOpen(false)}
                                className="group grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-black/15 py-5 sm:py-7"
                            >
                                <span className="text-[10px] font-bold tracking-[0.14em] text-black/40">03</span>
                                <span className="font-serif text-[clamp(1.25rem,3.6vw,2.15rem)] font-medium leading-tight tracking-normal text-[#111111]">
                                    {t('nav.forTailors')}
                                </span>
                                <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">→</span>
                            </Link>
                            </nav>

                            <div className="pb-5">
                                <LanguageToggle isOverDark={false} />
                            </div>

                            {user ? (
                                <div className="pt-2">
                                    <Link
                                        to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                        onClick={() => setMobileOpen(false)}
                                        className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 border border-black/25 text-[11px] font-bold uppercase tracking-[0.12em] text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
                                    >
                                        <User className="h-4 w-4" />
                                        {user.first_name} {user.last_name}
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 border-t border-black/15 pt-6">
                                    <Link
                                        to="/signin"
                                        onClick={() => setMobileOpen(false)}
                                        className="inline-flex min-h-[50px] items-center justify-center border border-black/25 text-[11px] font-bold uppercase tracking-[0.12em] text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
                                    >
                                        {t('nav.signIn')}
                                    </Link>
                                    <Link
                                        to="/design"
                                        onClick={() => setMobileOpen(false)}
                                        className="inline-flex min-h-[50px] items-center justify-center bg-[#111111] text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#333333]"
                                    >
                                        {t('nav.startDesigning')}
                                    </Link>
                                </div>
                            )}
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
