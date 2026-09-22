import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { getAuthToken, getAuthUser } from '../../hooks/useAuth';
import { getSection } from '../../hooks/useSection';
import { cartCount, openCart, useCart } from '../../hooks/useCart';
import { CartDrawer } from '../CartDrawer';
import { ProductImage } from '../marketplace/ProductImage';
import { NotificationBell } from '../NotificationBell';

interface SearchProduct {
    id: number;
    name: string;
    price: number;
    images: string[];
}

export function Navigation() {
    const { t, i18n } = useTranslation();
    const { pathname } = useLocation();
    const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/categories', { signal: controller.signal })
            .then((response) => response.ok ? response.json() : [])
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {});
        return () => controller.abort();
    }, []);
    const marketGender = getSection('market') ?? 'women';
    const [marketOpen, setMarketOpen] = useState(false);
    const marketCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const marketOpenedByHover = useRef(false);
    const cancelMarketClose = () => {
        if (marketCloseTimer.current) clearTimeout(marketCloseTimer.current);
    };
    const scheduleMarketClose = () => {
        cancelMarketClose();
        marketCloseTimer.current = setTimeout(() => setMarketOpen(false), 180);
    };
    useEffect(() => () => {
        if (marketCloseTimer.current) clearTimeout(marketCloseTimer.current);
    }, []);
    const [menuProducts, setMenuProducts] = useState<SearchProduct[]>([]);
    useEffect(() => {
        if (!marketOpen) return;
        const controller = new AbortController();
        fetch(`/api/products?gender=${marketGender}`, { signal: controller.signal })
            .then(response => response.ok ? response.json() : { data: [] })
            .then(data => setMenuProducts((data.data ?? []).filter((product: SearchProduct) => product.images?.length).slice(0, 4)))
            .catch(() => {});
        return () => controller.abort();
    }, [marketOpen, marketGender]);
    const categoryLinks = [
        { to: `/marketplace?gender=${marketGender}`, label: t('marketplace.allClothing') },
        ...categories.map((category) => ({
            to: `/marketplace?gender=${marketGender}&category=${encodeURIComponent(category.slug)}`,
            label: category.name,
        })),
    ];
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const user = getAuthToken() ? getAuthUser() : null;
    const count = cartCount(useCart());
    const account = user
        ? user.role === 'admin'
            ? '/admin-dashboard'
            : user.role === 'tailor'
              ? '/tailor-dashboard'
              : '/customer-dashboard'
        : '/signin';
    const links = [
        { to: '/marketplace', label: t('marketplace.title') },
        { to: '/design', label: t('nav.startDesigning') },
        { to: '/remodel', label: t('nav.remodel') },
        { to: '/about', label: t('footer.aboutUs') },
        { to: '/partners', label: t('nav.forTailors') },
    ];
    useEffect(() => {
        if (!searchOpen || !query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        const timer = setTimeout(() => {
            fetch(`/api/products?search=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
                .then((r) => {
                    if (!r.ok) throw new Error('Search unavailable');
                    return r.json();
                })
                .then((data) => setResults((data.data ?? []).slice(0, 6)))
                .catch(() => {
                    if (!controller.signal.aborted) setError(true);
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, searchOpen]);
    const toggleLanguage = () => {
        const next = i18n.language === 'ka' ? 'en' : 'ka';
        void i18n.changeLanguage(next);
        try {
            localStorage.setItem('kere_lang', next);
        } catch {
            /* retain this session's language */
        }
    };
    return (
        <>
            <header className="store-header">
                <a
                    href="#main-content"
                    className="store-skip"
                    onClick={(event) => {
                        const content = document.querySelector<HTMLElement>('main, h1');
                        if (content) {
                            event.preventDefault();
                            content.tabIndex = -1;
                            content.focus();
                        }
                    }}
                >
                    {t('store.skip')}
                </a>
                <div className="store-header-inner">
                    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                        <Dialog.Trigger className="store-icon store-menu-trigger" aria-label={t('store.menu')}>
                            <Menu size={20} />
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="store-overlay" />
                            <Dialog.Content className="store-menu" aria-describedby={undefined}>
                                <Dialog.Title className="store-eyebrow">Kere · {t('store.menu')}</Dialog.Title>
                                <Dialog.Close className="store-dialog-close store-icon" aria-label={t('newsletterPopup.close')}>
                                    <X size={22} />
                                </Dialog.Close>
                                <nav>
                                    <details className="store-mobile-categories">
                                        <summary>{t('marketplace.title')} <ChevronDown size={16} /></summary>
                                        {categoryLinks.map((link) => (
                                            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>{link.label}</Link>
                                        ))}
                                    </details>
                                    {[...links.slice(1), { to: account, label: t('nav.signIn') }].map(
                                        (link) => (
                                            <Link
                                                key={link.to}
                                                to={link.to}
                                                onClick={() => setMobileOpen(false)}
                                                aria-current={pathname === link.to ? 'page' : undefined}
                                            >
                                                {link.label}
                                            </Link>
                                        ),
                                    )}
                                </nav>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                    <Link to="/" className="store-logo" aria-label="Kere">
                        <span className="kere-nav-logo" aria-hidden="true" />
                    </Link>
                    <nav className="store-desktop-nav">
                        <Dialog.Root modal={false} open={marketOpen} onOpenChange={setMarketOpen}>
                            <Dialog.Trigger className="store-market-trigger"
                                onPointerEnter={event => {
                                    if (event.pointerType !== 'mouse') return;
                                    cancelMarketClose();
                                    marketOpenedByHover.current = true;
                                    setMarketOpen(true);
                                }}
                                onPointerLeave={event => { if (event.pointerType === 'mouse') scheduleMarketClose(); }}
                                onPointerDown={() => { marketOpenedByHover.current = false; }}
                                onKeyDown={() => { marketOpenedByHover.current = false; }}
                            >
                                {t('marketplace.title')}
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="store-mega-overlay" />
                                <Dialog.Content className="store-mega-menu" aria-describedby={undefined}
                                    onPointerEnter={cancelMarketClose}
                                    onPointerLeave={event => { if (event.pointerType === 'mouse') scheduleMarketClose(); }}
                                    onOpenAutoFocus={event => { if (marketOpenedByHover.current) event.preventDefault(); }}
                                    onCloseAutoFocus={event => { if (marketOpenedByHover.current) event.preventDefault(); }}
                                >
                                    <Dialog.Title className="sr-only">{t('marketplace.title')}</Dialog.Title>
                                    <Dialog.Close className="store-mega-close" aria-label={t('newsletterPopup.close')}><X size={18} /></Dialog.Close>
                                    <div className="store-mega-inner">
                                        <nav className="store-mega-categories" aria-label={t('marketplace.categoryFilter')}>
                                            <p className="store-eyebrow">{t('marketplace.categoryFilter')}</p>
                                            {categoryLinks.map(link => (
                                                <Link key={link.to} to={link.to} onClick={() => setMarketOpen(false)}>{link.label}</Link>
                                            ))}
                                        </nav>
                                        <div className="store-mega-products">
                                            {menuProducts.map(product => (
                                                <Link key={product.id} to={`/product/${product.id}`} onClick={() => setMarketOpen(false)}>
                                                    <div className="store-mega-image"><ProductImage src={product.images[0]} alt={product.name} /></div>
                                                    <span>{product.name}</span>
                                                    <small>₾{Number(product.price).toFixed(2)}</small>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                        {links.slice(1).map((link) => (
                            <Link key={link.to} to={link.to} aria-current={pathname === link.to ? 'page' : undefined}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="store-header-actions">
                        <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
                            <Dialog.Trigger className="store-icon" aria-label={t('store.search')}>
                                <Search size={19} />
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="store-overlay" />
                                <Dialog.Content className="store-search" aria-describedby={undefined}>
                                    <Dialog.Title className="store-search-title">{t('store.search')}</Dialog.Title>
                                    <Dialog.Close className="store-dialog-close store-icon" aria-label={t('newsletterPopup.close')}>
                                        <X size={22} />
                                    </Dialog.Close>
                                    <label className="sr-only" htmlFor="store-search-input">
                                        {t('store.search')}
                                    </label>
                                    <input
                                        id="store-search-input"
                                        type="search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t('marketplace.searchPlaceholder')}
                                        autoComplete="off"
                                    />
                                    <div aria-live="polite" aria-busy={loading}>
                                        {loading ? (
                                            <p>{t('marketplace.loading')}</p>
                                        ) : error ? (
                                            <p role="alert">{t('marketplace.errorLoad')}</p>
                                        ) : query.trim() && results.length === 0 ? (
                                            <p>{t('marketplace.noProducts')}</p>
                                        ) : null}
                                    </div>
                                    {!loading && !error && (
                                        <ul>
                                            {results.map((product) => (
                                                <li key={product.id}>
                                                    <Link to={`/product/${product.id}`} onClick={() => setSearchOpen(false)}>
                                                        {product.images?.[0] && (
                                                            <ProductImage src={product.images[0]} alt="" width="64" height="80" />
                                                        )}
                                                        <span>{product.name}</span>
                                                        <span>₾{Number(product.price).toFixed(2)}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                        <Link to={account} className="store-icon" aria-label={user ? `${user.first_name} ${user.last_name}` : t('nav.signIn')}>
                            <User size={19} />
                        </Link>
                        {user && <NotificationBell />}
                        <button
                            className="store-icon store-bag"
                            onClick={openCart}
                            aria-label={count ? t('cart.openWithCount', { n: count }) : t('cart.open')}
                        >
                            <ShoppingBag size={19} />
                            {count > 0 && <span>{count > 99 ? '99+' : count}</span>}
                        </button>
                        <button
                            className="store-language"
                            onClick={toggleLanguage}
                            aria-label={i18n.language === 'ka' ? 'Switch to English' : 'ქართულზე გადართვა'}
                        >
                            {i18n.language === 'ka' ? 'EN' : 'ქართ'}
                        </button>
                    </div>
                </div>
            </header>
            <CartDrawer />
        </>
    );
}
