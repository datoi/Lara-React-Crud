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
import NotFound from './pages/NotFound';

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
    { path: '*',                    element: <NotFound /> },
]);
