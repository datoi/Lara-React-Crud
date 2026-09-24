import type { AuthUser } from '../hooks/useAuth';

/**
 * The only pages a tailor signed in as a tailor may open: their dashboard, the
 * two pages about the trade itself, and the legal pages — the terms they agreed
 * to when they registered stay readable. Everything else is the storefront —
 * buying, designing, remodelling — and that is a customer's business.
 *
 * One list, read by the router (which redirects), and by the header and footer
 * (which do not offer what the router would refuse). The API enforces the same
 * boundary with `role:customer`; this is what keeps the interface honest about it.
 */
const TAILOR_PAGES = new Set([
    '/tailor-dashboard', '/about', '/partners', '/become-a-tailor',
    '/terms', '/privacy', '/refund-policy',
]);

export const TAILOR_HOME = '/tailor-dashboard';

export function isRestrictedTailor(user: AuthUser | null): boolean {
    return user?.role === 'tailor';
}

/** Whether a tailor may open `href` — a path, optionally with a query or hash. */
export function tailorMayVisit(href: string): boolean {
    return TAILOR_PAGES.has(href.split(/[?#]/)[0]);
}
