import { Navigation } from '../components/landing/Navigation';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ProcessSection } from '../components/landing/ProcessSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { GuaranteeSection } from '../components/landing/GuaranteeSection';
import { FAQSection } from '../components/landing/FAQSection';
import { CTASection } from '../components/landing/CTASection';
import { Link } from 'react-router';

export default function Landing() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />
            <HeroSection />
            <FeaturesSection />
            <ProcessSection />
            <CategoriesSection />
            <GuaranteeSection />
            <FAQSection />
            <CTASection />

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                        <div className="col-span-2 md:col-span-1">
                            <Link to="/" className="text-2xl font-bold text-white">Kere</Link>
                            <p className="mt-3 text-sm leading-relaxed">
                                Connecting you with skilled local Georgian tailors for custom clothing.
                            </p>
                        </div>
                        {[
                            { title: 'Shop', links: [{ label: 'Marketplace', to: '/marketplace' }, { label: 'Custom Design', to: '/design' }] },
                            { title: 'Tailors', links: [{ label: 'Join as Tailor', to: '/signin' }, { label: 'Tailor Dashboard', to: '/tailor-dashboard' }] },
                            { title: 'Company', links: [{ label: 'About', to: '/' }, { label: 'Contact', to: '/' }] },
                        ].map(col => (
                            <div key={col.title}>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{col.title}</div>
                                <ul className="space-y-2">
                                    {col.links.map(l => (
                                        <li key={l.label}>
                                            <Link to={l.to} className="text-sm hover:text-white transition-colors">{l.label}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-sm text-center">
                        © {new Date().getFullYear()} Kere. All rights reserved. Made in Georgia 🇬🇪
                    </div>
                </div>
            </footer>
        </div>
    );
}
