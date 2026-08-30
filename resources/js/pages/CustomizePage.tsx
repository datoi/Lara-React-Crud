import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import Customizer from '../components/customizer/Customizer';
import StudioBreadcrumb from '../components/StudioBreadcrumb';
import { Navigation } from '../components/landing/Navigation';
import { useProductData } from '../hooks/useProductData';
import { getAuthUser, getAuthToken, saveReturnTo } from '../hooks/useAuth';
import { saveDraft } from '../hooks/useCustomOrderDraft';
import { categoryForProduct } from '../data/garmentTaxonomy';
import type { Section } from '../hooks/useSection';
import type { DesignConfiguration } from '../types/customizer';
import { useTranslation } from 'react-i18next';

export default function CustomizePage() {
    const { slug }   = useParams<{ slug: string }>();
    const navigate   = useNavigate();
    const [searchParams] = useSearchParams();
    const { t }      = useTranslation();
    const authUser   = getAuthUser();

    const { product, layerCategories, fabrics, loading, error } = useProductData(slug);

    /**
     * Reopening a saved design. My Designs links here with ?design=<id>; without
     * it the page behaves exactly as before. The customizer must not mount until
     * this has resolved, or it would seed from defaults and then be re-seeded,
     * flashing the wrong configuration and overwriting the session copy.
     */
    const designId = searchParams.get('design');
    const [savedConfiguration, setSavedConfiguration] = useState<DesignConfiguration | null>(null);
    const [designLoading, setDesignLoading] = useState(Boolean(designId));

    useEffect(() => {
        if (!designId) { setSavedConfiguration(null); setDesignLoading(false); return; }

        let cancelled = false;
        setDesignLoading(true);
        fetch(`/api/customizer/designs/${designId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' },
        })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then(data => {
                if (cancelled) return;
                setSavedConfiguration((data.design?.configuration ?? null) as DesignConfiguration | null);
            })
            // A design that cannot be loaded (deleted, or someone else's) falls
            // back to a fresh garment rather than blocking the page.
            .catch(() => { if (!cancelled) setSavedConfiguration(null); })
            .finally(() => { if (!cancelled) setDesignLoading(false); });

        return () => { cancelled = true; };
    }, [designId]);

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
            // garment_type is the taxonomy bucket the tailor is matched on, and
            // every Tops garment files under one key — so the order would name a
            // corset top and a hoodie identically. The garment itself travels
            // with the configuration.
            customization:   {
                ...(configuration as unknown as Record<string, unknown>),
                product_name: product.name,
                product_slug: product.slug,
            },
            design_file_url: null,
            estimated_price: totalPrice,
        });
        navigate('/design/tailor-select');
    };

    if (loading || designLoading) {
        return (
            <div className="kere-workflow-page min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

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
        <div className="min-h-screen bg-[#E4E0D7] text-[#111111]">
            <Helmet>
                <title>Design Your {product.name} | Kere</title>
                <meta
                    name="description"
                    content={`Customize your ${product.name.toLowerCase()} — choose collar, sleeves, fabric and more. Made to order by a Georgian tailor on Kere.`}
                />
            </Helmet>

            <Navigation />
            <div className="h-11" />
            <main className="w-full">
                <Customizer
                    product={product}
                    savedConfiguration={savedConfiguration}
                    layerCategories={layerCategories}
                    fabrics={fabrics}
                    onOrder={handleOrder}
                    breadcrumb={
                        <StudioBreadcrumb
                            tone="paper"
                            crumbs={[
                                { label: t(`section.${section}`), to: `/design?gender=${section}` },
                                ...(category
                                    ? [{ label: t(category.tKey), to: `/design?gender=${section}&cat=${category.key}` }]
                                    : []),
                                { label: product.name },
                            ]}
                        />
                    }
                />
            </main>
        </div>
    );
}
