import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { getAuthToken, getAuthUser } from '../hooks/useAuth';

interface RouteGuardProps {
    children: ReactNode;
    /** Required role to access this route. If omitted, any authenticated user passes. */
    role?: 'customer' | 'tailor' | 'admin';
}

/**
 * Redirects unauthenticated users to /signin.
 * Redirects authenticated users with the wrong role to their own dashboard.
 */
export function RouteGuard({ children, role }: RouteGuardProps) {
    const token = getAuthToken();
    const user  = getAuthUser();

    if (!token || !user) {
        return <Navigate to="/signin" replace />;
    }

    if (role && user.role !== role) {
        // Send each role to their own dashboard
        if (user.role === 'tailor')   return <Navigate to="/tailor-dashboard"   replace />;
        if (user.role === 'customer') return <Navigate to="/customer-dashboard" replace />;
        if (user.role === 'admin')    return <Navigate to="/admin-dashboard"    replace />;
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
}
