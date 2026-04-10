import { createBrowserRouter } from 'react-router';
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

export const router = createBrowserRouter([
    { path: '/',                    element: <Landing /> },
    { path: '/design',              element: <DesignerApp /> },
    { path: '/marketplace',         element: <Marketplace /> },
    { path: '/product/:id',         element: <ProductCustomization /> },
    { path: '/signin',              element: <RoleSelection /> },
    { path: '/login/:role',          element: <Login /> },
    { path: '/register/customer',   element: <RegisterCustomer /> },
    { path: '/register/tailor',     element: <RegisterTailor /> },
    { path: '/tailor-dashboard',    element: <TailorDashboard /> },
    { path: '/customer-dashboard',  element: <CustomerDashboard /> },
    // Info pages
    { path: '/how-it-works',        element: <HowItWorks /> },
    { path: '/about',               element: <AboutUs /> },
    { path: '/our-tailors',         element: <OurTailors /> },
    { path: '/help',                element: <HelpCenter /> },
    { path: '/privacy',             element: <PrivacyPolicy /> },
    { path: '/terms',               element: <TermsOfService /> },
    { path: '/refund-policy',       element: <RefundPolicy /> },
    { path: '*',                    element: <NotFound /> },
]);
