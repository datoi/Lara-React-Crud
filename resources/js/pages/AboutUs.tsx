import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

export default function AboutUs() {
    const { t } = useTranslation();

    return (
        <div className="kere-about-page">
            <Navigation />
            <main id="main-content" className="kere-about-story">
                <div className="kere-about-meta">
                    <span>{t('aboutUs.stat4Num')}, {t('aboutUs.locationCountry')}</span>
                    <span>{t('aboutUs.eyebrow')}</span>
                </div>
                <figure className="kere-about-portrait">
                    <img
                        src="/assets/hero/kere-look-4.jpeg"
                        alt={t('carousel.productGreenDress')}
                        width="900"
                        height="1200"
                        fetchPriority="high"
                    />
                    <figcaption>Kere — {t('aboutUs.eyebrow')}</figcaption>
                </figure>
                <h1>{t('aboutUs.heroTitle')}</h1>
                <div className="kere-about-copy">
                    <div>
                        <h2>{t('aboutUs.whyTitle')}</h2>
                        <p>{t('aboutUs.whyP1')}</p>
                        <p>{t('aboutUs.whyP3')}</p>
                    </div>
                    <div>
                        <h2>{t('aboutUs.valuesTitle')}</h2>
                        <p>{t('aboutUs.v1Desc')} {t('aboutUs.v2Desc')} {t('aboutUs.v4Desc')}</p>
                        <p>{t('aboutUs.ctaDesc')}</p>
                    </div>
                </div>
                <div className="kere-about-links">
                    <Link to="/marketplace">{t('aboutUs.browseMarketplace')} <span aria-hidden="true">↗</span></Link>
                    <Link to="/register/tailor">{t('aboutUs.joinAsTailor')} <span aria-hidden="true">↗</span></Link>
                </div>
            </main>
            <Footer />
        </div>
    );
}
