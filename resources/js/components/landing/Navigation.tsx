import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Menu, X, User, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAuthUser, clearAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../NotificationBell';
import { useCart } from '../../context/CartContext';

export function Navigation() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled]     = useState(false);
    const navigate                    = useNavigate();
    const user                        = getAuthUser();
    const { count: cartCount, openCart } = useCart();

    useEffect(() => {
        function onScroll() {
            setScrolled(window.scrollY > 60);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    function handleSignOut() {
        clearAuth();
        navigate('/');
    }

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
                    </div>

                    {/* Desktop right */}
                    <div className="hidden md:flex items-center gap-2">
                        {user ? (
                            <>
                                {/* Notification bell */}
                                <div className={scrolled ? '' : 'invert'}>
                                    <NotificationBell />
                                </div>

                                {/* Cart icon */}
                                <button
                                    onClick={openCart}
                                    className={`relative p-2 rounded-lg transition-colors ${scrolled ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>

                                <div className={`flex items-center gap-2 text-sm ${scrolled ? 'text-slate-700' : 'text-white/90'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${scrolled ? 'bg-slate-200' : 'bg-white/20'}`}>
                                        <User className={`w-4 h-4 ${scrolled ? 'text-slate-600' : 'text-white'}`} />
                                    </div>
                                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                                </div>

                                {user.role === 'tailor' ? (
                                    <Link
                                        to="/tailor-dashboard"
                                        className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${scrolled ? 'text-slate-700 border border-slate-300 hover:bg-slate-50' : 'text-white border border-white/40 hover:bg-white/10'}`}
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        to="/customer-dashboard"
                                        className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${scrolled ? 'text-slate-700 border border-slate-300 hover:bg-slate-50' : 'text-white border border-white/40 hover:bg-white/10'}`}
                                    >
                                        My Orders
                                    </Link>
                                )}

                                <button
                                    onClick={handleSignOut}
                                    className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-500 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
                                >
                                    Sign Out
                                </button>
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

                            {user ? (
                                <div className="pt-2 space-y-2">
                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-white font-medium">
                                        <User className="w-4 h-4 text-white/70" />
                                        {user.first_name} {user.last_name}
                                    </div>
                                    {user.role === 'tailor' ? (
                                        <Link
                                            to="/tailor-dashboard"
                                            onClick={() => setMobileOpen(false)}
                                            className="block text-center border border-white/30 text-white px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                                        >
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            to="/customer-dashboard"
                                            onClick={() => setMobileOpen(false)}
                                            className="block text-center border border-white/30 text-white px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                                        >
                                            My Orders
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => { handleSignOut(); setMobileOpen(false); }}
                                        className="w-full text-center border border-white/30 text-white px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                                    >
                                        Sign Out
                                    </button>
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
