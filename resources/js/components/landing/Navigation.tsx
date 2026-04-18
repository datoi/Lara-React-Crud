import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAuthUser } from '../../hooks/useAuth';
import { NotificationBell } from '../NotificationBell';

export function Navigation() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled]     = useState(false);
    const user                        = getAuthUser();
    useEffect(() => {
        function onScroll() {
            setScrolled(window.scrollY > 60);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav className={`fixed top-0 z-50 w-full backdrop-blur transition-colors duration-300 ${scrolled ? 'bg-white/90 border-b border-slate-200' : 'bg-slate-900/30 border-b border-white/10'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        to="/"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className={`text-2xl font-bold transition-colors ${scrolled ? 'text-slate-900 hover:text-slate-700' : 'text-white hover:text-white/80'}`}
                    >
                        Kere
                    </Link>

                    {/* Desktop center links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#how-it-works" className={`text-sm transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
                            How It Works
                        </a>
                        <a href="#categories" className={`text-sm transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
                            Categories
                        </a>
                        <a href="#faq" className={`text-sm transition-colors ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>
                            FAQ
                        </a>
                        <Link
                            to="/partners"
                            className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-500 hover:text-slate-900' : 'text-white/60 hover:text-white/90'}`}
                        >
                            For Tailors
                        </Link>
                    </div>

                    {/* Desktop right */}
                    <div className="hidden md:flex items-center gap-2">
                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                    className={`flex items-center gap-2 text-sm transition-colors ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/90 hover:text-white'}`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${scrolled ? 'bg-slate-200' : 'bg-white/20'}`}>
                                        <User className={`w-4 h-4 ${scrolled ? 'text-slate-600' : 'text-white'}`} />
                                    </div>
                                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                                </Link>

                                {/* Notification bell */}
                                <div className={scrolled ? '' : 'invert'}>
                                    <NotificationBell />
                                </div>

                            </>
                        ) : (
                            <>
                                <Link
                                    to="/signin"
                                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${scrolled ? 'text-slate-700 border border-slate-300 hover:bg-slate-50' : 'text-white border border-white/40 hover:bg-white/10'}`}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/design"
                                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${scrolled ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-white/90'}`}
                                >
                                    Start Designing
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white/80 hover:bg-white/10'}`}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/10 bg-slate-900/80"
                    >
                        <div className="px-4 py-4 space-y-2">
                            {[
                                { to: '#how-it-works', label: 'How It Works' },
                                { to: '#categories',   label: 'Categories' },
                                { to: '#faq',          label: 'FAQ' },
                            ].map(link => (
                                <a
                                    key={link.to}
                                    href={link.to}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <Link
                                to="/partners"
                                onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
                            >
                                For Tailors
                            </Link>

                            {user ? (
                                <div className="pt-2">
                                    <Link
                                        to={user.role === 'tailor' ? '/tailor-dashboard' : '/customer-dashboard'}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-white font-medium hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <User className="w-4 h-4 text-white/70" />
                                        {user.first_name} {user.last_name}
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex gap-2 pt-2">
                                    <Link
                                        to="/signin"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex-1 text-center border border-white/30 text-white px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/design"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex-1 text-center bg-white text-slate-900 px-4 py-2.5 rounded-lg hover:bg-white/90 transition-colors text-sm font-medium"
                                    >
                                        Start Designing
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
