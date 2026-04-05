import { Link, useNavigate } from 'react-router';
import { Bell, User, LogOut } from 'lucide-react';
import { getAuthUser, clearAuth } from '../../hooks/useAuth';

interface DashboardHeaderProps {
    earnings: number;
}

export function DashboardHeader({ earnings }: DashboardHeaderProps) {
    const navigate = useNavigate();
    const user = getAuthUser();
    const displayName = user ? `${user.first_name} ${user.last_name}` : 'My Profile';

    function handleSignOut() {
        clearAuth();
        navigate('/');
    }

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                    Kere
                </Link>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                        <span className="text-xs text-slate-500">Total Earnings</span>
                        <span className="font-bold text-slate-900">₾{earnings.toLocaleString()}</span>
                    </div>

                    <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <Bell className="w-5 h-5 text-slate-600" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{displayName}</span>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
