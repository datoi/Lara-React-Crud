import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ChevronDown, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MeasurementGuideModal } from '../MeasurementGuideModal';
import { EmailSupportModal } from '../EmailSupportModal';

type FooterLink =
    | { label: string; type: 'router'; to: string }
    | { label: string; type: 'hash'; href: string }
    | { label: string; type: 'modal'; modal: 'size-guide' | 'email-support' };

interface FooterColumnProps {
    title: string;
    links: FooterLink[];
    onModalOpen: (modal: 'size-guide' | 'email-support') => void;
}

export function Footer() {
    const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
    const [emailSupportOpen, setEmailSupportOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { t, i18n } = useTranslation();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email.trim()) return;

        setSubmitted(true);
        setEmail('');
    };

    const handleModalOpen = (modal: 'size-guide' | 'email-support') => {
        if (modal === 'size-guide') setSizeGuideOpen(true);
        if (modal === 'email-support') setEmailSupportOpen(true);
    };

    const toggleLanguage = () => {
        void i18n.changeLanguage(i18n.language === 'ka' ? 'en' : 'ka');
    };

    const footerColumns: { title: string; links: FooterLink[] }[] = [
        {
            title: t('footer.product'),
            links: [
                { label: t('footer.howItWorks'), type: 'hash', href: '/#how-it-works' },
                { label: t('footer.categories'), type: 'hash', href: '/#categories' },
                { label: t('footer.designGallery'), type: 'router', to: '/marketplace' },
            ],
        },
        {
            title: t('footer.company'),
            links: [
                { label: t('footer.aboutUs'), type: 'router', to: '/about' },
                { label: t('footer.ourTailors'), type: 'router', to: '/our-tailors' },
                { label: t('footer.tailorDashboard'), type: 'router', to: '/tailor-dashboard' },
            ],
        },
        {
            title: t('footer.support'),
            links: [
                { label: t('footer.helpCenter'), type: 'router', to: '/help' },
                { label: t('footer.contactUs'), type: 'router', to: '/contact' },
                { label: t('footer.emailSupport'), type: 'modal', modal: 'email-support' },
                { label: t('footer.sizeGuide'), type: 'modal', modal: 'size-guide' },
                { label: t('footer.faq'), type: 'hash', href: '/#faq' },
            ],
        },
    ];

    const legalLinks: FooterLink[] = [
        { label: t('footer.privacyPolicy'), type: 'router', to: '/privacy' },
        { label: t('footer.termsOfService'), type: 'router', to: '/terms' },
        { label: t('footer.refundPolicy'), type: 'router', to: '/refund-policy' },
    ];

    return (
        <>
            <MeasurementGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
            <EmailSupportModal open={emailSupportOpen} onClose={() => setEmailSupportOpen(false)} />

            <footer className="overflow-hidden border-t border-black/15 bg-[#f7f6f3] text-[#111111]">
                <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-14 sm:px-8 sm:pb-10 sm:pt-16 lg:px-10 lg:pt-20">
                    <div className="grid gap-14 border-b border-black/15 pb-16 md:grid-cols-2 lg:grid-cols-[1.55fr_0.8fr_0.9fr_0.7fr] lg:gap-16 lg:pb-20">
                        <div>
                            <h2 className="text-xl font-medium uppercase tracking-normal text-[#111111] sm:text-2xl">
                                {t('footer.stayUpdated')}
                            </h2>

                            <form onSubmit={handleSubmit} className="mt-7 max-w-md">
                                <div className="grid grid-cols-[1fr_auto] items-center border-b border-black/35">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder={t('footer.emailPlaceholder')}
                                        aria-label={t('footer.emailPlaceholder')}
                                        required
                                        className="min-w-0 bg-transparent py-3 text-sm text-[#111111] outline-none placeholder:text-black/35"
                                    />

                                    <button
                                        type="submit"
                                        aria-label={t('footer.subscribe')}
                                        className="inline-flex h-10 w-10 items-center justify-center transition-transform hover:translate-x-1"
                                    >
                                        <ArrowRight className="h-5 w-5 stroke-[1.4]" />
                                    </button>
                                </div>

                                {submitted && (
                                    <p className="mt-3 max-w-sm text-[9px] leading-4 text-black/45">
                                        {t('footer.newsletterSuccess')}
                                    </p>
                                )}
                            </form>
                        </div>

                        {footerColumns.map((column) => (
                            <FooterColumn key={column.title} title={column.title} links={column.links} onModalOpen={handleModalOpen} />
                        ))}
                    </div>

                    <div className="grid gap-10 border-b border-black/15 py-12 lg:grid-cols-[1.55fr_0.8fr_0.9fr_0.7fr] lg:gap-16">
                        <div>
                            <p className="max-w-sm text-sm leading-7 text-black/55">
                                {t('footer.tagline')}
                            </p>

                            <div className="mt-5 flex flex-col gap-2 text-xs uppercase tracking-[0.02em] text-black/55">
                                <span>{t('footer.location')}</span>
                                <a href="mailto:kereforyou@gmail.com" className="w-fit transition-opacity hover:opacity-45">
                                    kereforyou@gmail.com
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <h3 className="text-sm font-medium uppercase tracking-normal">{t('footer.legal')}</h3>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
                                {legalLinks.map((item) => (
                                    <FooterItem key={item.label} item={item} onModalOpen={handleModalOpen} />
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium uppercase tracking-normal">Social</h3>

                            <div className="mt-5 flex flex-col gap-3">
                                <a
                                    href="https://www.instagram.com/kereforyou?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    className="w-fit text-xs uppercase tracking-[0.02em] text-black/60 transition-opacity hover:opacity-45"
                                >
                                    Instagram
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="grid items-end gap-10 pt-8 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr]">
                        <div className="flex flex-wrap items-center gap-7">
                            <Link to="/" className="font-serif text-[30px] font-medium leading-none tracking-normal sm:text-[34px]">
                                Kere
                            </Link>

                            <button
                                type="button"
                                onClick={toggleLanguage}
                                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.04em] text-black/65 transition-opacity hover:opacity-45"
                            >
                                {i18n.language === 'ka' ? 'KA' : 'EN'}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </button>

                            <span className="inline-flex items-center gap-1.5 text-xs text-black/65">
                                {t('footer.location')}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </span>
                        </div>

                        <p className="text-left text-xl uppercase tracking-normal sm:text-right lg:text-center lg:text-2xl">#KERE CRAFT</p>

                        <div className="text-left sm:text-right">
                            <p className="text-xl uppercase tracking-normal lg:text-2xl">#MADE FOR YOU</p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-black/45 sm:justify-end">
                                <span>{t('footer.weAccept')}</span>
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>VISA</span>
                                <span>MC</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-9 flex flex-col gap-3 border-t border-black/10 pt-5 text-[10px] uppercase tracking-[0.08em] text-black/40 sm:flex-row sm:items-center sm:justify-between">
                        <p>© {new Date().getFullYear()} Kere. {t('footer.allRightsReserved')}</p>

                        <p>{t('footer.location')}</p>
                    </div>
                </div>
            </footer>
        </>
    );
}

function FooterColumn({ title, links, onModalOpen }: FooterColumnProps) {
    return (
        <div>
            <h3 className="text-sm font-medium uppercase tracking-normal text-[#111111] sm:text-base">{title}</h3>

            <div className="mt-6 flex flex-col gap-4">
                {links.map((item) => (
                    <FooterItem key={item.label} item={item} onModalOpen={onModalOpen} />
                ))}
            </div>
        </div>
    );
}

function FooterItem({ item, onModalOpen }: { item: FooterLink; onModalOpen: (modal: 'size-guide' | 'email-support') => void }) {
    const className = 'w-fit text-xs uppercase tracking-[0.02em] text-black/60 transition-opacity hover:opacity-45';

    if (item.type === 'router') {
        return (
            <Link to={item.to} className={className}>
                {item.label}
            </Link>
        );
    }

    if (item.type === 'hash') {
        return (
            <a href={item.href} className={className}>
                {item.label}
            </a>
        );
    }

    return (
        <button type="button" onClick={() => onModalOpen(item.modal)} className={className}>
            {item.label}
        </button>
    );
}
