import { useTranslation } from 'react-i18next';
import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { COMPANY_EMAIL, COMPANY_ID_CODE, COMPANY_PHONE, COMPANY_PHONE_HREF } from '../data/company';
import { termsOfService } from '../data/termsOfService';

export default function TermsOfService() {
    const { t, i18n } = useTranslation();

    return (
        <LegalDocumentPage doc={termsOfService[i18n.language === 'ka' ? 'ka' : 'en']}>
            {/* Who the merchant actually is. A card scheme requires a shopper to
                be able to identify and reach the seller without going through
                their bank; this block also carries the phone number, which the
                terms themselves do not. */}
            <section aria-labelledby="merchant-details" className="mt-12 border border-[#e5dfd8] bg-[#faf7f3] p-5 sm:p-6">
                <h2 id="merchant-details" className="text-lg text-slate-900">
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
            </section>
        </LegalDocumentPage>
    );
}
