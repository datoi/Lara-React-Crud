import { Link, useNavigate } from 'react-router';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { getAuthUser, clearAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../NotificationBell';

interface DashboardHeaderProps {
    earnings: number;
}

export function DashboardHeader({ earnings }: DashboardHeaderProps) {
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
                <Link to="/" className="store-logo text-[var(--store-ink)]" aria-label="Kere">
                    <span className="kere-nav-logo" aria-hidden="true" />
                </Link>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-1 py-1">
                        <span className="text-xs text-slate-500 hidden sm:inline">{t('tailorComponents.totalEarnings')}</span>
                        <span className="font-medium text-slate-900 text-xs">₾{earnings.toLocaleString()}</span>
                    </div>

                    <NotificationBell />

                    <div className="flex items-center gap-2 text-[var(--store-ink)] px-1 py-2 text-xs font-normal">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{displayName}</span>
                    </div>

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
