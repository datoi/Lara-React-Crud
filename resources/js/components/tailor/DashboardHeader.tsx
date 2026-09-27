import { Link, useNavigate } from 'react-router';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { getAuthUser, clearAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../NotificationBell';

export function DashboardHeader() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = getAuthUser();
    const displayName = user ? `${user.first_name} ${user.last_name}` : t('tailorComponents.myProfile');

    function handleSignOut() {
        clearAuth();
        navigate('/');
    }

    return (
        <header className="tailor-studio-header sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-12 flex flex-wrap items-center justify-between gap-x-4">
                <Link to="/" className="store-logo text-[var(--store-ink)]" aria-label="Kere">
                    <span className="kere-nav-logo" aria-hidden="true" />
                </Link>

                <nav className="tailor-studio-nav" aria-label={t('tailorComponents.siteNavigation')}>
                    <Link to="/"><span className="hidden sm:inline">{t('tailorComponents.backHome')}</span><span className="sm:hidden">{t('studio.home')}</span></Link>
                    <Link to="/marketplace">{t('marketplace.title')}</Link>
                    <Link to="/remodel">{t('nav.remodel')}</Link>
                </nav>
                <div className="studio-header-actions flex items-center gap-3">
                    <NotificationBell />

                    <a href="#profile-section" className="flex items-center gap-2 text-[var(--store-ink)] px-1 py-2 text-xs font-normal" aria-label={t('tailorComponents.myProfile')}>
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{displayName}</span>
                    </a>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                    >
                        {t('tailorComponents.signOut')}
                    </Button>
                </div>
            </div>
        </header>
    );
}
