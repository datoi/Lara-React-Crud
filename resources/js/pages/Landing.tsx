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
