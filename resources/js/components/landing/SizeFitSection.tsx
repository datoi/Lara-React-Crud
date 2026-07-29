import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, FileText, PencilRuler, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MeasurementGuideModal } from '../MeasurementGuideModal';

interface GalleryImage {
  src: string;
  alt: string;
  position?: string;
}

export function SizeFitSection() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const { t } = useTranslation();

  const galleryImages: GalleryImage[] = [
    {
      src: '/assets/size-fit/size-main.jpg',
      alt: t('sizeFit.badgeBottom'),
      position: 'center top',
    },
    {
      src: '/assets/size-fit/size-detail-1.jpg',
      alt: t('sizeFit.step1Title'),
      position: 'center top',
    },
    {
      src: '/assets/size-fit/size-detail-2.jpg',
      alt: t('sizeFit.step2Title'),
      position: 'center top',
    },
    {
      src: '/assets/size-fit/size-detail-3.jpg',
      alt: t('sizeFit.step3Title'),
      position: 'center top',
    },
  ];

  const instructions = [
    {
      icon: FileText,
      title: t('sizeFit.step1Title'),
      description: t('sizeFit.step1Desc'),
    },
    {
      icon: Ruler,
      title: t('sizeFit.step2Title'),
      description: t('sizeFit.step2Desc'),
    },
    {
      icon: Check,
      title: t('sizeFit.step3Title'),
      description: t('sizeFit.step3Desc'),
    },
  ];

  return (
    <section className="overflow-hidden bg-[#f7f6f3] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-14 grid gap-8 border-b border-black/15 pb-10 md:mb-20 md:grid-cols-[1.2fr_0.8fr] md:items-end md:pb-14">
          <h2 className="max-w-[760px] font-serif text-[clamp(1.7rem,3.25vw,3.3rem)] font-medium leading-[0.98] tracking-normal text-[#111111]">
            {t('sizeFit.title')}
          </h2>

          <p className="max-w-lg text-sm leading-7 text-[#6f6f6f] sm:text-base md:justify-self-end">
            {t('sizeFit.subtitle')}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[110px_minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-8 xl:grid-cols-[125px_minmax(0,1.2fr)_minmax(400px,0.8fr)]">
          <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible">
            {galleryImages.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Show image ${index + 1}`}
                className={[
                  'relative h-28 w-24 shrink-0 overflow-hidden border bg-[#efeeeb] transition-all duration-200',
                  'lg:h-[138px] lg:w-full',
                  activeImage === index ? 'border-[#111111]' : 'border-black/15 hover:border-black/45',
                ].join(' ')}
              >
                <img
                  src={image.src}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: image.position ?? 'center',
                  }}
                />
              </button>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative min-h-[520px] overflow-hidden border border-black/15 bg-[#efeeeb] sm:min-h-[680px] lg:h-full lg:min-h-[760px]">
              {galleryImages.map((image, index) => (
                <img
                  key={image.src}
                  src={image.src}
                  alt={index === activeImage ? image.alt : ''}
                  aria-hidden={index !== activeImage}
                  className={[
                    'absolute inset-0 h-full w-full object-cover transition-all duration-700',
                    index === activeImage ? 'scale-100 opacity-100' : 'pointer-events-none scale-[1.015] opacity-0',
                  ].join(' ')}
                  style={{
                    objectPosition: image.position ?? 'center',
                  }}
                />
              ))}

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 via-black/10 to-transparent px-5 pb-5 pt-24 text-white sm:px-7 sm:pb-7">
                <div>
                  <p className="mt-2 font-serif text-xl font-medium tracking-normal sm:text-2xl">
                    {t('sizeFit.badgeBottom')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-3 flex flex-col lg:pl-5 xl:pl-10">
            <div className="border-b border-black/15 pb-8">
              <h3 className="font-serif text-[clamp(1.45rem,2.25vw,2.25rem)] font-medium leading-[1.04] tracking-normal text-[#111111]">
                {t('sizeFit.title')}
              </h3>

              <p className="mt-6 text-sm leading-7 text-[#707070] sm:text-base">{t('sizeFit.subtitle')}</p>
            </div>

            <div className="divide-y divide-black/15 border-b border-black/15">
              {instructions.map((instruction) => (
                <div key={instruction.title} className="group grid grid-cols-[46px_1fr] gap-4 py-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 text-[#111111] transition-colors duration-200 group-hover:bg-[#111111] group-hover:text-white">
                    <instruction.icon className="h-[18px] w-[18px] stroke-[1.5]" />
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-bold leading-6 tracking-normal text-[#111111] sm:text-base">
                        {instruction.title}
                      </h4>

                    </div>

                    <p className="mt-2 text-xs leading-6 text-[#777777] sm:text-sm">{instruction.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link
                to="/design"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-[#111111] bg-[#111111] px-6 text-xs font-bold uppercase tracking-[0.09em] text-white transition-all duration-200 hover:bg-[#333333]"
              >
                <PencilRuler className="h-4 w-4" />
                {t('hero.startDesigning')}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-black/25 bg-transparent px-6 text-xs font-bold uppercase tracking-[0.09em] text-[#111111] transition-all duration-200 hover:bg-[#111111] hover:text-white"
              >
                <Ruler className="h-4 w-4" />
                {t('sizeFit.viewGuide')}
              </button>
            </div>

          </div>
        </div>
      </div>

      <MeasurementGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        initialStep="chest"
      />
    </section>
  );
}
