import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './routes';

const el = document.getElementById('app');
if (el) {
    createRoot(el).render(<RouterProvider router={router} />);
}
