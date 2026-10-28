import '../css/app.css';
import './i18n';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { router } from './routes';

// Microsoft Clarity ran here, after consent, until October 2026. The privacy
// policy now says the site sets no analytics cookies, so the ones it left with
// returning visitors are expired, together with their stored answer.
for (const name of ['_clck', '_clsk']) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname.replace(/^www\./, '')}`;
}
try {
    localStorage.removeItem('kere_analytics_consent');
} catch {
    // Storage blocked: there is nothing stored to remove either.
}

const el = document.getElementById('app');
if (el) {
    createRoot(el).render(
        <HelmetProvider>
            <RouterProvider router={router} />
        </HelmetProvider>
    );
}
