import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { useTranslation } from 'react-i18next';
import { COMPANY_EMAIL, COMPANY_ID_CODE, COMPANY_PHONE, COMPANY_PHONE_HREF } from '../data/company';

export default function TermsOfService() {
    const { t } = useTranslation();

    const sections = [
        { titleKey: 'terms.s1Title', bullets: ['terms.s1b1', 'terms.s1b2', 'terms.s1b3'] },
        { titleKey: 'terms.s2Title', bullets: ['terms.s2b1', 'terms.s2b2', 'terms.s2b3'] },
        { titleKey: 'terms.s3Title', bullets: ['terms.s3b1', 'terms.s3b2', 'terms.s3b3', 'terms.s3b4'] },
        { titleKey: 'terms.s4Title', bullets: ['terms.s4b1', 'terms.s4b2', 'terms.s4b3', 'terms.s4b4'] },
        { titleKey: 'terms.s5Title', bullets: ['terms.s5b1', 'terms.s5b2', 'terms.s5b3', 'terms.s5b4', 'terms.s5b5', 'terms.s5b6'] },
        { titleKey: 'terms.s6Title', bullets: ['terms.s6b1', 'terms.s6b2', 'terms.s6b3', 'terms.s6b4'] },
        { titleKey: 'terms.s7Title', bullets: ['terms.s7b1', 'terms.s7b2', 'terms.s7b3'] },
        { titleKey: 'terms.s8Title', bullets: ['terms.s8b1', 'terms.s8b2', 'terms.s8b3'] },
        { titleKey: 'terms.s9Title', bullets: ['terms.s9b1', 'terms.s9b2'] },
        { titleKey: 'terms.s10Title', bullets: ['terms.s10b1', 'terms.s10b2', 'terms.s10b3'] },
    ];

    return (
        <div className="kere-info-page kere-refined-page min-h-screen bg-white">
            <Navigation />

            <section className="kere-page-intro pt-24 pb-8 md:pt-28 md:pb-12 border-b border-[#e5dfd8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-2xl md:text-4xl font-normal mb-4">{t('terms.title')}</h1>
                        <p className="text-slate-400 text-sm">{t('terms.lastUpdated')}</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-10 md:py-14">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-slate-600 leading-relaxed mb-8"
                    >
                        {t('terms.intro')}
                    </motion.p>

                    {/* Who the merchant actually is. A card scheme requires a
                        shopper to be able to identify and reach the seller
                        without going through their bank, so this is published
                        rather than only held with the acquirer. */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        aria-labelledby="merchant-details"
                        className="mb-12 border border-[#e5dfd8] bg-[#faf7f3] p-5 sm:p-6"
                    >
                        <h2 id="merchant-details" className="text-lg font-bold text-slate-900">
                            {t('company.merchantTitle')}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('company.merchantIntro')}</p>

                        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-[max-content_1fr]">
                            <dt className="text-sm text-slate-500">{t('company.legalNameLabel')}</dt>
                            <dd className="text-sm font-medium text-slate-900">{t('company.legalName')}</dd>

                            <dt className="text-sm text-slate-500">{t('company.idCodeLabel')}</dt>
                            <dd className="text-sm font-medium tabular-nums text-slate-900">{COMPANY_ID_CODE}</dd>

                            <dt className="text-sm text-slate-500">{t('company.addressLabel')}</dt>
                            <dd className="text-sm font-medium text-slate-900">{t('company.address')}</dd>

                            <dt className="text-sm text-slate-500">{t('company.phoneLabel')}</dt>
                            <dd className="text-sm font-medium text-slate-900">
                                <a href={`tel:${COMPANY_PHONE_HREF}`} className="underline underline-offset-4 hover:text-brand">
                                    {COMPANY_PHONE}
                                </a>
                            </dd>

                            <dt className="text-sm text-slate-500">{t('company.emailLabel')}</dt>
                            <dd className="text-sm font-medium text-slate-900">
                                <a href={`mailto:${COMPANY_EMAIL}`} className="underline underline-offset-4 hover:text-brand">
                                    {COMPANY_EMAIL}
                                </a>
                            </dd>
                        </dl>
                    </motion.section>

                    <div className="space-y-10">
                        {sections.map((s, i) => (
                            <motion.div
                                key={s.titleKey}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.04 }}
                            >
                                <h2 className="text-lg font-bold text-slate-900 mb-3">{t(s.titleKey)}</h2>
                                <ul className="space-y-2">
                                    {s.bullets.map((bKey) => (
                                        <li key={bKey} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
                                            {t(bKey, { email: COMPANY_EMAIL, phone: COMPANY_PHONE })}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
