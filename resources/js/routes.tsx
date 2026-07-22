import { createBrowserRouter } from 'react-router';
import { type ReactElement } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteGuard } from './components/RouteGuard';
import Landing from './pages/Landing';
import DesignerApp from './pages/DesignerApp';
import Marketplace from './pages/Marketplace';
import ProductCustomization from './pages/ProductCustomization';
import RoleSelection from './pages/RoleSelection';
import RegisterCustomer from './pages/RegisterCustomer';
import RegisterTailor from './pages/RegisterTailor';
import Login from './pages/Login';
import TailorDashboard from './pages/TailorDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import NotFound from './pages/NotFound';
import AboutUs from './pages/AboutUs';
import OurTailors from './pages/OurTailors';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import Contact from './pages/Contact';
import TailorProfile from './pages/TailorProfile';
import BecomePartner from './pages/BecomePartner';
import AdminDashboard from './pages/AdminDashboard';
import CustomizePage from './pages/CustomizePage';
import MyDesignsPage from './pages/MyDesignsPage';
import CustomizerAdminPage from './pages/CustomizerAdminPage';
import AdminLogin from './pages/AdminLogin';
import TailorSelectStep from './pages/TailorSelectStep';
import OrderReview from './pages/OrderReview';

function wrap(el: ReactElement) {
    return <ErrorBoundary>{el}</ErrorBoundary>;
}

function guard(el: ReactElement, role?: 'customer' | 'tailor' | 'admin') {
    return wrap(<RouteGuard role={role}>{el}</RouteGuard>);
}

export const router = createBrowserRouter([
    { path: '/',                    element: wrap(<Landing />) },
    { path: '/design',               element: wrap(<DesignerApp />) },
    { path: '/design/tailor-select', element: wrap(<TailorSelectStep />) },
    { path: '/design/review',        element: wrap(<OrderReview />) },
    { path: '/marketplace',         element: wrap(<Marketplace />) },
    { path: '/product/:id',         element: wrap(<ProductCustomization />) },
    { path: '/signin',              element: wrap(<RoleSelection />) },
    { path: '/login/:role',         element: wrap(<Login />) },
    { path: '/register/customer',   element: wrap(<RegisterCustomer />) },
    { path: '/register/tailor',     element: wrap(<RegisterTailor />) },
    { path: '/tailor-dashboard',    element: guard(<TailorDashboard />, 'tailor') },
    { path: '/customer-dashboard',  element: guard(<CustomerDashboard />, 'customer') },
    { path: '/admin-dashboard',     element: guard(<AdminDashboard />, 'admin') },
    // ── Customizer ───────────────────────────────────────────────────────────
    { path: '/customize/:slug',     element: wrap(<CustomizePage />) },
    { path: '/my-designs',          element: guard(<MyDesignsPage />) },
    { path: '/admin/login',         element: wrap(<AdminLogin />) },
    { path: '/admin/customizer',    element: guard(<CustomizerAdminPage />, 'admin') },
    // Info pages
    { path: '/about',               element: wrap(<AboutUs />) },
    { path: '/our-tailors',         element: wrap(<OurTailors />) },
    { path: '/help',                element: wrap(<HelpCenter />) },
    { path: '/privacy',             element: wrap(<PrivacyPolicy />) },
    { path: '/terms',               element: wrap(<TermsOfService />) },
    { path: '/refund-policy',       element: wrap(<RefundPolicy />) },
    { path: '/contact',             element: wrap(<Contact />) },
    { path: '/tailor/:id',          element: wrap(<TailorProfile />) },
    { path: '/partners',            element: wrap(<BecomePartner />) },
    { path: '/become-a-tailor',     element: wrap(<BecomePartner />) },
    { path: '*',                    element: wrap(<NotFound />) },
]);
