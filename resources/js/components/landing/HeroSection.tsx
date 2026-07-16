import { Link } from 'react-router';
import { ArrowRight, Scissors, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const heroImages = [
  {
    src: '/assets/hero/kere-look-3.jpeg',
    altKey: 'carousel.productBlueSuit',
  },
  {
    src: '/assets/hero/kere-look-2.jpeg',
    altKey: 'carousel.productBlueDress',
  },
  {
    src: '/assets/hero/kere-look-1.jpeg',
    altKey: 'carousel.productPinkDress',
  },
  {
    src: '/assets/hero/kere-look-4.jpeg',
    altKey: 'carousel.productGreenDress',
  },
];

export function HeroSection() {
  const { t } = useTranslation();
  const movingImages = [...heroImages, ...heroImages];

  return (
    <section className="kere-hero">
      <div className="kere-hero-card">
        <div className="kere-hero-copy">
          <h1>{t('hero.headline')}</h1>

          <p>
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="kere-gallery">
          <div className="kere-ellipse-top" />
          <div className="kere-depth-ellipse" />
          <div className="kere-ellipse-bottom" />

          <div className="kere-gallery-fade-left" />
          <div className="kere-gallery-fade-right" />

          <div className="kere-gallery-track">
            {movingImages.map((image, index) => (
              <div className="kere-gallery-image" key={`${image.src}-${index}`}>
                <img src={image.src} alt={index < heroImages.length ? t(image.altKey) : ''} aria-hidden={index >= heroImages.length} />
              </div>
            ))}
          </div>
        </div>

        <div className="kere-actions">
          <Link to="/design" className="kere-button kere-button-primary">
            <Scissors />
            {t('hero.startYourDesign')}
            <ArrowRight />
          </Link>

          <Link to="/design?upload=1" className="kere-button kere-button-secondary">
            <Upload />
            {t('hero.uploadYourDesign')}
          </Link>
        </div>
      </div>
    </section>
  );
}
