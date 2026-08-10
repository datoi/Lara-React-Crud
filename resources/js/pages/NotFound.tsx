import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Footer } from '../components/landing/Footer';
import { Navigation } from '../components/landing/Navigation';

export default function NotFound() {
    const { t } = useTranslation();
    return (
        <div className="kere-info-page flex min-h-screen flex-col bg-slate-50 text-center">
            <Navigation />
            <main className="flex min-h-[72svh] flex-1 items-center justify-center px-4 pt-20 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-4 select-none font-serif text-[clamp(6rem,18vw,14rem)] leading-none font-normal text-[#6F1D24]/16">404</div>
                    <h1 className="mb-3 text-3xl text-slate-900 sm:text-5xl">{t('notFound.title')}</h1>
                    <p className="mx-auto mb-8 max-w-sm text-slate-500">{t('notFound.desc')}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-slate-900 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('notFound.backHome')}
                    </Link>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
}
