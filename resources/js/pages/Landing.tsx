import { BrandStorySection } from '../components/landing/BrandStorySection';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '../components/landing/Navigation';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { SizeFitSection } from '../components/landing/SizeFitSection';
import { MarketplaceCarousel } from '../components/landing/MarketplaceCarousel';
import { GuaranteeSection } from '../components/landing/GuaranteeSection';
import { CTASection } from '../components/landing/CTASection';
import { FAQSection } from '../components/landing/FAQSection';
import { Footer } from '../components/landing/Footer';
import { NewsletterPopup } from '../components/landing/NewsletterPopup';
import { JoinSection } from '../components/landing/JoinSection';
import { useTranslation } from 'react-i18next';

export default function Landing() {
    const { t } = useTranslation();

    return (
        <div className="kere-landing min-h-screen overflow-x-clip bg-[#E4E0D7]">
            <Helmet>
                <title>{t('seo.homeTitle')}</title>
                <meta name="description" content={t('seo.homeDescription')} />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": "Kere",
                    "description": "Made-to-fit clothing and remodels of your own garments, made in Tbilisi.",
                    "url": "https://kereforyou.com",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Tbilisi",
                        "addressCountry": "GE"
                    },
                    "currenciesAccepted": "GEL",
                    "priceRange": "₾₾"
                })}</script>
            </Helmet>
            <NewsletterPopup />
            <Navigation />
            <HeroSection />
            <MarketplaceCarousel />
            <BrandStorySection />
            <FeaturesSection />
            <HowItWorksSection />
            <SizeFitSection />
            <GuaranteeSection />
            <CTASection />
            <FAQSection />
            <JoinSection />
            <Footer />
        </div>
    );
}
