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
import { Link } from 'react-router';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, CreditCard } from 'lucide-react';

const footerLinks = [
    {
        title: 'Product',
        links: [
            { label: 'How It Works', to: '/how-it-works' },
            { label: 'Categories', to: '/marketplace' },
            { label: 'Design Gallery', to: '/marketplace' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About Us', to: '/about' },
            { label: 'Our Tailors', to: '/our-tailors' },
            { label: 'Tailor Dashboard', to: '/tailor-dashboard' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', to: '/help' },
            { label: 'Size Guide', to: '/size-guide' },
            { label: 'FAQ', to: '/help' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privacy Policy', to: '/privacy' },
            { label: 'Terms of Service', to: '/terms' },
            { label: 'Refund Policy', to: '/refund-policy' },
        ],
    },
];

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

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                    {/* Top row */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12">
                        {/* Brand column */}
                        <div className="md:col-span-1">
                            <Link to="/" className="text-2xl font-bold text-white">Kere</Link>
                            <p className="mt-3 text-sm leading-relaxed mb-6">
                                Creating custom clothing that's as unique as you are. Design, customize, and wear your perfect fit.
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <span>Tbilisi, Georgia</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <span>+995 XXX XXX XXX</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <span>hello@kere.com</span>
                                </div>
                            </div>
                            {/* Social icons */}
                            <div className="flex gap-3 mt-5">
                                {[
                                    { Icon: Facebook, label: 'Facebook' },
                                    { Icon: Instagram, label: 'Instagram' },
                                    { Icon: Twitter, label: 'Twitter' },
                                ].map(({ Icon, label }) => (
                                    <button
                                        key={label}
                                        aria-label={label}
                                        className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center hover:border-slate-500 hover:text-white transition-colors"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Link columns */}
                        {footerLinks.map((col) => (
                            <div key={col.title}>
                                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                                    {col.title}
                                </p>
                                <ul className="space-y-3">
                                    {col.links.map((l) => (
                                        <li key={l.label}>
                                            <Link
                                                to={l.to}
                                                className="text-sm hover:text-white transition-colors"
                                            >
                                                {l.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-800" />

                    {/* Newsletter */}
                    <div className="py-8 text-center">
                        <p className="font-semibold text-white mb-1">Stay Updated</p>
                        <p className="text-sm text-slate-400 mb-5">
                            Subscribe to our newsletter for design tips and exclusive offers
                        </p>
                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="flex items-center justify-center gap-2 max-w-sm mx-auto"
                        >
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                            />
                            <button
                                type="submit"
                                className="bg-white text-slate-900 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-800" />

                    {/* Bottom bar */}
                    <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                        <span>© {new Date().getFullYear()} Kere. All rights reserved.</span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span>We accept:</span>
                            <div className="flex items-center gap-2">
                                <div className="border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-300 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                </div>
                                <div className="border border-slate-700 rounded px-2 py-0.5 text-xs font-bold text-slate-300">
                                    VISA
                                </div>
                                <div className="border border-slate-700 rounded px-2 py-0.5 text-xs font-bold text-slate-300">
                                    MC
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
