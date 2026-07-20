import '../css/app.css';
import './i18n';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { router } from './routes';
import { AnalyticsConsent } from './components/AnalyticsConsent';

const el = document.getElementById('app');
if (el) {
    createRoot(el).render(
        <HelmetProvider>
            <RouterProvider router={router} />
            <AnalyticsConsent />
        </HelmetProvider>
    );
}
