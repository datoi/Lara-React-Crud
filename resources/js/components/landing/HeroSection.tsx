import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Scissors, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeroImage {
  src: string;
  alt: string;
  productId: number | null;
}

const fallbackImages = [
  { src: '/assets/hero/kere-look-3.jpeg', altKey: 'carousel.productBlueSuit' },
  { src: '/assets/hero/kere-look-2.jpeg', altKey: 'carousel.productBlueDress' },
  { src: '/assets/hero/kere-look-1.jpeg', altKey: 'carousel.productPinkDress' },
  { src: '/assets/hero/kere-look-4.jpeg', altKey: 'carousel.productGreenDress' },
];

export function HeroSection() {
  const { t } = useTranslation();
  const [productImages, setProductImages] = useState<HeroImage[]>([]);

  useEffect(() => {
    fetch('/api/products?per_page=12')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        return response.json();
      })
      .then((data) => {
        const list: { id: number; name: string; images?: string[] }[] = data.data ?? [];

        setProductImages(
          list
            .filter((product) => product.images?.[0])
            .slice(0, 4)
            .map((product) => ({
              src: product.images![0],
              alt: product.name,
              productId: product.id,
            })),
        );
      })
      .catch(() => {});
  }, []);

  const heroImages: HeroImage[] =
    productImages.length >= 4
      ? productImages
      : fallbackImages.map((image) => ({
          src: image.src,
          alt: t(image.altKey),
          productId: null,
        }));
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
              <Link
                to={image.productId != null ? `/product/${image.productId}` : '/marketplace'}
                className="kere-gallery-image"
                key={`${image.src}-${index}`}
                tabIndex={index >= heroImages.length ? -1 : undefined}
                aria-hidden={index >= heroImages.length}
              >
                <img src={image.src} alt={index < heroImages.length ? image.alt : ''} />
              </Link>
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
