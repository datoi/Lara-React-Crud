import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function BrandStorySection() {
    const { t } = useTranslation();
    return (
        <section className="store-story" aria-labelledby="kere-story-title">
            <img src="/assets/hero/kere-look-4.jpeg" alt={t('carousel.productGreenDress')} width="900" height="1200" loading="lazy" />
            <div>
                <p className="store-eyebrow">{t('aboutUs.eyebrow')}</p>
                <h2 id="kere-story-title">{t('aboutUs.heroTitle')}</h2>
                <p>{t('aboutUs.whyP1')}</p>
                <Link className="store-text-link" to="/about">
                    {t('footer.aboutUs')} ↗
                </Link>
            </div>
        </section>
    );
}
