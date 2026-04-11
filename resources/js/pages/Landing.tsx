import { Helmet } from 'react-helmet-async';
import { Navigation } from '../components/landing/Navigation';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ProcessSection } from '../components/landing/ProcessSection';
import { SizeFitSection } from '../components/landing/SizeFitSection';
import { LocalTailorsSection } from '../components/landing/LocalTailorsSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { GuaranteeSection } from '../components/landing/GuaranteeSection';
import { CTASection } from '../components/landing/CTASection';
import { FAQSection } from '../components/landing/FAQSection';
import { Footer } from '../components/landing/Footer';

export default function Landing() {
    return (
        <div className="min-h-screen bg-white">
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
            <FeaturesSection />
            <ProcessSection />
            <CategoriesSection />
            <SizeFitSection />
            <LocalTailorsSection />
            <GuaranteeSection />
            <CTASection />
            <FAQSection />

            <Footer />
        </div>
    );
}
