import { useTranslation } from 'react-i18next';
import { LegalDocumentPage } from '../components/LegalDocumentPage';
import { privacyPolicy } from '../data/privacyPolicy';

export default function PrivacyPolicy() {
    const { i18n } = useTranslation();

    return <LegalDocumentPage doc={privacyPolicy[i18n.language === 'ka' ? 'ka' : 'en']} />;
}
