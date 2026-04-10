import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/CartDrawer';
import { router } from './routes';

function Root() {
    return (
        <CartProvider>
            <RouterProvider router={router} />
            <CartDrawer />
        </CartProvider>
    );
}

const el = document.getElementById('app');
if (el) {
    createRoot(el).render(<Root />);
}
