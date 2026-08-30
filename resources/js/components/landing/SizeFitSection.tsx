import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MeasurementGuideModal } from '../MeasurementGuideModal';

export function SizeFitSection() {
  const [guideOpen, setGuideOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <section
        className="relative mb-10 min-h-[520px] overflow-hidden bg-white sm:mb-14 sm:min-h-[620px] lg:mb-16 lg:min-h-[720px]"
        aria-labelledby="size-fit-title"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/size-fit/size-campaign-wide.png"
          className="absolute inset-0 h-full w-full object-cover object-[66%_center] sm:object-center"
          aria-hidden="true"
        >
          <source src="/assets/size-fit/size-campaign-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent sm:from-black/35" />

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[1500px] items-center px-6 py-14 sm:min-h-[620px] sm:px-10 lg:min-h-[720px] lg:px-16">
          <div className="max-w-2xl text-center text-white sm:text-left">
            <h2
              id="size-fit-title"
              className="font-serif text-[clamp(1.7rem,2.7vw,3rem)] font-normal leading-[1.05] tracking-[-0.025em] text-white"
              style={{ color: '#ffffff' }}
            >
              {t('sizeFit.title')}
            </h2>
            <p className="mt-4 max-w-lg text-sm font-normal leading-6 text-white sm:text-base" style={{ color: '#ffffff' }}>
              {t('sizeFit.subtitle')}
            </p>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="mt-6 border-0 border-b border-white bg-transparent px-0 pb-1 text-xs font-normal uppercase tracking-[0.06em] text-white shadow-none transition-opacity hover:bg-transparent hover:text-white hover:opacity-60"
              style={{ backgroundColor: 'transparent', color: '#ffffff' }}
            >
              {t('sizeFit.viewGuide')}
            </button>
          </div>
        </div>
      </section>

      <MeasurementGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        initialStep="chest"
      />
    </>
  );
}
