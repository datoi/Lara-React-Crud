import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import Customizer from '../components/customizer/Customizer';
import StudioBreadcrumb, { type StudioCrumb } from '../components/StudioBreadcrumb';
import { useProductData } from '../hooks/useProductData';
import { getAuthUser, saveReturnTo } from '../hooks/useAuth';
import { saveDraft } from '../hooks/useCustomOrderDraft';
import { categoryForProduct } from '../data/garmentTaxonomy';
import type { Section } from '../hooks/useSection';
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

    // The heading this garment is filed under. Drives the breadcrumb and, more
    // importantly, draft.garment_type — reaching the customizer directly (a
    // shared link, or "Edit design" from My Designs) never passed through
    // ProductStep, so the draft could arrive with no garment type at all, or
    // worse, with a stale one left over from a different category this session.
    const section: Section = product?.gender === 'men' ? 'men' : 'women';
    const category = product ? categoryForProduct(section, product.category) : undefined;

    const handleOrder = (configuration: DesignConfiguration, totalPrice: number) => {
        if (!authUser) {
            saveReturnTo('/design/tailor-select');
            navigate('/login/customer');
            return;
        }
        if (!product) return;

        // Save the customization to the shared draft, then continue to tailor
        // selection. estimated_price is the configured total the customer just
        // read on the button — the base price alone ignores every option
        // modifier and can understate the garment by most of its value.
        saveDraft({
            garment_type:    category?.orderKey ?? product.category,
            customization:   configuration as unknown as Record<string, unknown>,
            design_file_url: null,
            estimated_price: totalPrice,
        });
        navigate('/design/tailor-select');
    };

    if (loading) {
        return (
            <div className="kere-workflow-page min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    // Rebuilt from the product rather than passed through the flow, so the trail
    // is correct on a direct link or a refresh. A unisex garment is filed under
    // whichever section the customer is browsing.
    const buildCrumbs = (): StudioCrumb[] => {
        if (!product) return [];
        const crumbs: StudioCrumb[] = [
            { label: t(`section.${section}`), to: `/design?gender=${section}` },
        ];
        if (category) {
            crumbs.push({ label: t(category.tKey), to: `/design?gender=${section}&cat=${category.key}` });
        }
        crumbs.push({ label: product.name });
        return crumbs;
    };

    if (error || !product) {
        return (
            <div className="kere-workflow-page min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <p className="text-destructive">{error ?? t('productCustomization.productNotFound')}</p>
                <Link to="/marketplace" className="text-slate-900 underline text-sm">
                    {t('productCustomization.backToMarketplace')}
                </Link>
            </div>
        );
    }

    return (
        <div className="kere-workflow-page min-h-screen bg-white">
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
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('tailorSelect.back')}
                    </Button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <StudioBreadcrumb tone="light" className="mb-6" crumbs={buildCrumbs()} />

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
