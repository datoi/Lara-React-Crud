import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Upload } from 'lucide-react';
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

  // Marquee is JS-driven so it can auto-slide, pause while pressed, and be
  // dragged left/right by finger (touch) or mouse.
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const dragRef = useRef<{ startX: number; lastX: number; pointerId: number; active: boolean } | null>(null);
  const draggedRef = useRef(false);
  const reduceMotionRef = useRef(false);

  const ready = true;
  const heroImages: HeroImage[] = fallbackImages.map((image) => ({
    src: image.src,
    alt: t(image.altKey),
    productId: null,
  }));
  const movingImages = [...heroImages, ...heroImages];

  // ── Continuous marquee + drag ────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const track = trackRef.current;
    if (!track) return;

    reduceMotionRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // Width of one image set; the track renders two identical sets so wrapping
    // by this amount is seamless.
    let half = track.scrollWidth / 2 || 1;
    const measure = () => { half = track.scrollWidth / 2 || 1; };
    window.addEventListener('resize', measure);

    const SPEED = 42; // px per second
    let last = performance.now();
    let raf = requestAnimationFrame(function loop(now) {
      const dt = Math.min(now - last, 50);
      last = now;

      // Pause auto-advance whenever the gallery is being pressed/dragged.
      if (!dragRef.current && !reduceMotionRef.current) {
        offsetRef.current -= (dt / 1000) * SPEED;
      }

      if (offsetRef.current <= -half) offsetRef.current += half;
      else if (offsetRef.current > 0) offsetRef.current -= half;

      // Horizontal only — the gallery centres the track with flexbox, so this
      // must not carry a vertical component (it differs per breakpoint).
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [ready, heroImages.length]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggedRef.current = false;
    dragRef.current = { startX: event.clientX, lastX: event.clientX, pointerId: event.pointerId, active: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (!drag.active) {
      // Only treat it as a drag once the finger/mouse clearly moves sideways,
      // so vertical page scrolling and taps still work.
      if (Math.abs(event.clientX - drag.startX) < 6) return;
      drag.active = true;
      draggedRef.current = true;
      try { trackRef.current?.setPointerCapture(event.pointerId); } catch { /* noop */ }
      drag.lastX = event.clientX;
    }

    offsetRef.current += event.clientX - drag.lastX;
    drag.lastX = event.clientX;
  };

  const endDrag = () => {
    const drag = dragRef.current;
    if (drag?.active) {
      try { trackRef.current?.releasePointerCapture(drag.pointerId); } catch { /* noop */ }
    }
    dragRef.current = null;
  };

  const onPointerLeave = () => {
    // A press that wandered off without becoming a drag — let it resume.
    if (dragRef.current && !dragRef.current.active) dragRef.current = null;
  };

  const onImageClick = (event: React.MouseEvent) => {
    // Swallow the click that follows a drag so it doesn't navigate.
    if (draggedRef.current) {
      event.preventDefault();
      draggedRef.current = false;
    }
  };

  return (
    <section className="kere-hero">
      <div className="kere-hero-card">
        <div className="kere-hero-copy">
          <h1>{t('hero.headline')}</h1>

        </div>

        <div className="kere-gallery">
          <div className="kere-ellipse-top" />
          <div className="kere-depth-ellipse" />
          <div className="kere-ellipse-bottom" />

          <div className="kere-gallery-fade-left" />
          <div className="kere-gallery-fade-right" />

          <div
            ref={trackRef}
            className="kere-gallery-track"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={onPointerLeave}
            style={{
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.5s ease',
              touchAction: 'pan-y',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            {movingImages.map((image, index) => (
              <Link
                to={image.productId != null ? `/product/${image.productId}` : '/marketplace'}
                className="kere-gallery-image"
                key={`${image.src}-${index}`}
                tabIndex={index >= heroImages.length ? -1 : undefined}
                aria-hidden={index >= heroImages.length}
                draggable={false}
                onClick={onImageClick}
              >
                <img src={image.src} alt={index < heroImages.length ? image.alt : ''} draggable={false} />
              </Link>
            ))}
          </div>
        </div>

        <div className="kere-actions">
          <div className="kere-actions-row">
            <Link to="/design" className="kere-button kere-button-primary">
              {t('hero.startYourDesign')}
            </Link>

            <Link to="/design?upload=1" className="kere-button kere-button-secondary">
              <Upload />
              {t('hero.uploadYourDesign')}
            </Link>
          </div>

          <Link to="/remodel" className="kere-button kere-button-primary kere-button-remodel">
            {t('hero.remodelGarment')}
          </Link>
        </div>
      </div>
    </section>
  );
}
