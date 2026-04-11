import { createBrowserRouter } from 'react-router';
import { type ReactElement } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import HowItWorks from './pages/HowItWorks';
import AboutUs from './pages/AboutUs';
import OurTailors from './pages/OurTailors';
import HelpCenter from './pages/HelpCenter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import Contact from './pages/Contact';
import TailorProfile from './pages/TailorProfile';

function wrap(el: ReactElement) {
    return <ErrorBoundary>{el}</ErrorBoundary>;
}

export const router = createBrowserRouter([
    { path: '/',                    element: wrap(<Landing />) },
    { path: '/design',              element: wrap(<DesignerApp />) },
    { path: '/marketplace',         element: wrap(<Marketplace />) },
    { path: '/product/:id',         element: wrap(<ProductCustomization />) },
    { path: '/signin',              element: wrap(<RoleSelection />) },
    { path: '/login/:role',         element: wrap(<Login />) },
    { path: '/register/customer',   element: wrap(<RegisterCustomer />) },
    { path: '/register/tailor',     element: wrap(<RegisterTailor />) },
    { path: '/tailor-dashboard',    element: wrap(<TailorDashboard />) },
    { path: '/customer-dashboard',  element: wrap(<CustomerDashboard />) },
    // Info pages
    { path: '/how-it-works',        element: wrap(<HowItWorks />) },
    { path: '/about',               element: wrap(<AboutUs />) },
    { path: '/our-tailors',         element: wrap(<OurTailors />) },
    { path: '/help',                element: wrap(<HelpCenter />) },
    { path: '/privacy',             element: wrap(<PrivacyPolicy />) },
    { path: '/terms',               element: wrap(<TermsOfService />) },
    { path: '/refund-policy',       element: wrap(<RefundPolicy />) },
    { path: '/contact',             element: wrap(<Contact />) },
    { path: '/tailor/:id',          element: wrap(<TailorProfile />) },
    { path: '*',                    element: wrap(<NotFound />) },
]);
