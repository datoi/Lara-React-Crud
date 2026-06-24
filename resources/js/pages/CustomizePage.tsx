import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Customizer from '../components/customizer/Customizer';
import { useProductData } from '../hooks/useProductData';
import { getAuthUser, saveReturnTo } from '../hooks/useAuth';
import { saveDraft } from '../hooks/useCustomOrderDraft';
import type { DesignConfiguration } from '../types/customizer';
import { useTranslation } from 'react-i18next';

export default function CustomizePage() {
    const { slug }   = useParams<{ slug: string }>();
    const navigate   = useNavigate();
    const { t }      = useTranslation();
    const authUser   = getAuthUser();

    const goBack = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate('/marketplace');
    };

    const { product, layerCategories, fabrics, loading, error } = useProductData(slug);

    const handleOrder = (configuration: DesignConfiguration) => {
        if (!authUser) {
            saveReturnTo('/design/tailor-select');
            navigate('/login/customer');
            return;
        }
        // Save the customization to the shared draft, then continue to tailor selection
        saveDraft({
            customization:   configuration as unknown as Record<string, unknown>,
            design_file_url: null,
            estimated_price: product?.base_price ?? 0,
        });
        navigate('/design/tailor-select');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500">{error ?? t('productCustomization.productNotFound')}</p>
                <Link to="/marketplace" className="text-slate-900 underline text-sm">
                    {t('productCustomization.backToMarketplace')}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>Design Your {product.name} | Kere</title>
                <meta
                    name="description"
                    content={`Customize your ${product.name.toLowerCase()} — choose collar, sleeves, fabric and more. Made to order by a Georgian tailor on Kere.`}
                />
            </Helmet>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                    <button
                        onClick={goBack}
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('tailorSelect.back')}
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Customizer
                        product={product}
                        layerCategories={layerCategories}
                        fabrics={fabrics}
                        onOrder={handleOrder}
                    />
                </motion.div>
            </main>
        </div>
    );
}
