import { useState } from 'react';
import { Link } from 'react-router';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MeasurementGuideModal } from '../MeasurementGuideModal';
import { PaymentMarks } from '../PaymentMarks';
import { EmailSupportModal } from '../EmailSupportModal';
import { COMPANY_ID_CODE } from '../../data/company';

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
    const { t } = useTranslation();

    const handleModalOpen = (modal: 'size-guide' | 'email-support') => {
        if (modal === 'size-guide') setSizeGuideOpen(true);
        if (modal === 'email-support') setEmailSupportOpen(true);
    };

    const footerColumns: { title: string; links: FooterLink[] }[] = [
        {
            title: t('footer.product'),
            links: [
                { label: t('footer.howItWorks'), type: 'hash', href: '/#how-it-works' },
                { label: t('footer.categories'), type: 'hash', href: '/#categories' },
                { label: t('footer.designGallery'), type: 'router', to: '/marketplace' },
                { label: t('footer.sizeGuide'), type: 'modal', modal: 'size-guide' },
                { label: t('footer.faq'), type: 'hash', href: '/#faq' },
            ],
        },
        {
            title: t('footer.company'),
            links: [
                { label: t('footer.aboutUs'), type: 'router', to: '/about' },
                { label: t('footer.ourTailors'), type: 'router', to: '/our-tailors' },
                { label: t('footer.tailorDashboard'), type: 'router', to: '/tailor-dashboard' },
                { label: t('footer.helpCenter'), type: 'router', to: '/help' },
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

            <footer className="kere-footer">
                <div className="kere-footer-inner">
                    <div className="kere-footer-brand">
                        <Link to="/" aria-label="Kere"><span className="kere-nav-logo" aria-hidden="true" /></Link>
                        <p>{t('footer.tagline')}</p>
                    </div>
                    <div className="kere-footer-columns">
                        <section className="kere-footer-contact" aria-labelledby="footer-contact-title">
                            <h3 id="footer-contact-title">{t('footer.contactUs')}</h3>
                            <a href="tel:+995597032348"><Phone aria-hidden="true" /><span>+995 597 03 23 48</span></a>
                            <a href="mailto:kereforyou@gmail.com"><Mail aria-hidden="true" /><span>kereforyou@gmail.com</span></a>
                            <div className="kere-footer-social">
                                <a href="https://www.instagram.com/kereforyou/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram aria-hidden="true" /></a>
                            </div>
                        </section>
                        {footerColumns.map(column => <FooterColumn key={column.title} {...column} onModalOpen={handleModalOpen} />)}
                    </div>
                    <PaymentMarks label={t('footer.weAccept')} className="kere-footer-payments" />
                    <div className="kere-footer-legal">
                        <nav aria-label={t('footer.legal')}>
                            {legalLinks.map(item => <FooterItem key={item.label} item={item} onModalOpen={handleModalOpen} />)}
                        </nav>
                    </div>
                    <p className="kere-footer-location"><MapPin aria-hidden="true" /><span>{t('company.address')}</span></p>
                    <p className="kere-footer-copyright">© {new Date().getFullYear()} {t('company.legalName')} · {t('company.idCodeLabel')} {COMPANY_ID_CODE}</p>
                </div>
            </footer>
        </>
    );
}

function FooterColumn({ title, links, onModalOpen }: FooterColumnProps) {
    return (
        <div>
            <h3 className="kere-footer-heading">{title}</h3>

            <div className="kere-footer-links">
                {links.map((item) => (
                    <FooterItem key={item.label} item={item} onModalOpen={onModalOpen} />
                ))}
            </div>
        </div>
    );
}

function FooterItem({ item, onModalOpen }: { item: FooterLink; onModalOpen: (modal: 'size-guide' | 'email-support') => void }) {
    const className = 'kere-footer-link';

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
