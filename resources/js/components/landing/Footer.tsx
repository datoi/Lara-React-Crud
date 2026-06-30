import { useState } from 'react';
import { Link } from 'react-router';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { MeasurementGuideModal } from '../MeasurementGuideModal';
import { EmailSupportModal } from '../EmailSupportModal';

const linkClass = 'text-sm hover:text-white transition-colors';

export function Footer() {
    const [sizeGuideOpen,    setSizeGuideOpen]    = useState(false);
    const [emailSupportOpen, setEmailSupportOpen] = useState(false);
    const { t } = useTranslation();

    // link type: 'router' = <Link to>, 'hash' = <a href> (scrolls on landing), 'modal' = button
    type FooterLink =
        | { label: string; type: 'router'; to: string }
        | { label: string; type: 'hash'; href: string }
        | { label: string; type: 'modal'; modal: 'size-guide' | 'email-support' };

    const footerColumns: { title: string; links: FooterLink[] }[] = [
        {
            title: t('footer.product'),
            links: [
                { label: t('footer.howItWorks'),   type: 'hash',   href: '/#how-it-works' },
                { label: t('footer.categories'),   type: 'hash',   href: '/#categories'   },
                { label: t('footer.designGallery'), type: 'router', to: '/marketplace'   },
            ],
        },
        {
            title: t('footer.company'),
            links: [
                { label: t('footer.aboutUs'),         type: 'router', to: '/about'            },
                { label: t('footer.ourTailors'),      type: 'router', to: '/our-tailors'      },
                { label: t('footer.tailorDashboard'), type: 'router', to: '/tailor-dashboard' },
            ],
        },
        {
            title: t('footer.support'),
            links: [
                { label: t('footer.helpCenter'),   type: 'router', to: '/help'           },
                { label: t('footer.contactUs'),    type: 'router', to: '/contact'        },
                { label: t('footer.emailSupport'), type: 'modal',  modal: 'email-support' },
                { label: t('footer.sizeGuide'),    type: 'modal',  modal: 'size-guide'   },
                { label: t('footer.faq'),          type: 'hash',   href: '/#faq'         },
            ],
        },
        {
            title: t('footer.legal'),
            links: [
                { label: t('footer.privacyPolicy'),   type: 'router', to: '/privacy'       },
                { label: t('footer.termsOfService'),  type: 'router', to: '/terms'         },
                { label: t('footer.refundPolicy'),    type: 'router', to: '/refund-policy' },
            ],
        },
    ];

    return (
        <>
            <MeasurementGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
            <EmailSupportModal open={emailSupportOpen} onClose={() => setEmailSupportOpen(false)} />

            <footer className="bg-slate-900 text-slate-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                    {/* Top row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-10 pb-12">
                        {/* Brand column */}
                        <div className="md:col-span-1">
                            <Link to="/" className="text-2xl font-bold text-white">Kere</Link>
                            <p className="mt-3 text-sm leading-relaxed mb-6">
                                {t('footer.tagline')}
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <span>{t('footer.location')}</span>
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
                                    <Button
                                        key={label}
                                        variant="ghost"
                                        size="icon"
                                        aria-label={label}
                                        className="w-9 h-9 rounded-full border border-slate-700 hover:border-slate-500 hover:text-white text-slate-400"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Link columns */}
                        {footerColumns.map((col) => (
                            <div key={col.title}>
                                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                                    {col.title}
                                </p>
                                <ul className="space-y-3">
                                    {col.links.map((l) => (
                                        <li key={l.label}>
                                            {l.type === 'router' && (
                                                <Link to={l.to} className={linkClass}>{l.label}</Link>
                                            )}
                                            {l.type === 'hash' && (
                                                <a href={l.href} className={linkClass}>{l.label}</a>
                                            )}
                                            {l.type === 'modal' && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (l.modal === 'size-guide') setSizeGuideOpen(true);
                                                        if (l.modal === 'email-support') setEmailSupportOpen(true);
                                                    }}
                                                    className={`${linkClass} h-auto p-0`}
                                                >
                                                    {l.label}
                                                </Button>
                                            )}
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
                        <p className="font-semibold text-white mb-1">{t('footer.stayUpdated')}</p>
                        <p className="text-sm text-slate-400 mb-5">
                            {t('footer.newsletterDesc')}
                        </p>
                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 max-w-sm mx-auto w-full px-2"
                        >
                            <input
                                type="email"
                                placeholder={t('footer.emailPlaceholder')}
                                className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm px-4 py-2.5 rounded-lg placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                            />
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-white text-slate-900 text-sm font-medium px-5 py-2.5 hover:bg-slate-100 flex-shrink-0"
                            >
                                {t('footer.subscribe')}
                            </Button>
                        </form>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-800" />

                    {/* Bottom bar */}
                    <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                        <span>© {new Date().getFullYear()} Kere. {t('footer.allRightsReserved')}</span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span>{t('footer.weAccept')}</span>
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
        </>
    );
}
