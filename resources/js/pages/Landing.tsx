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

export default function Landing() {
    return (
        <div className="kere-landing min-h-screen overflow-x-hidden bg-[#F4EBD4]">
            <Helmet>
                <title>Kere — Custom Clothing Marketplace | Tbilisi</title>
                <meta name="description" content="Connect with expert Georgian tailors for bespoke clothing. Design custom garments or browse our curated marketplace. Handcrafted in Tbilisi." />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": "Kere",
                    "description": "Custom clothing marketplace connecting customers with local Georgian tailors.",
                    "url": "https://kere.ge",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Tbilisi",
                        "addressCountry": "GE"
                    },
                    "currenciesAccepted": "GEL",
                    "priceRange": "₾₾"
                })}</script>
            </Helmet>
            <Navigation />
            <HeroSection />
            <MarketplaceCarousel />
            <FeaturesSection />
            <HowItWorksSection />
            <SizeFitSection />
            <GuaranteeSection />
            <CTASection />
            <FAQSection />

            <Footer />
        </div>
    );
}
