import { BadgeCheck, Ruler, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FeaturesSection() {
  const { t } = useTranslation();

  const guarantees = [
    {
      number: '01',
      icon: BadgeCheck,
      title: t('features.verifiedTailorsTitle'),
      description: t('features.verifiedTailorsDesc'),
    },
    {
      number: '02',
      icon: Ruler,
      title: t('features.customFitTitle'),
      description: t('features.customFitDesc'),
    },
    {
      number: '03',
      icon: ShieldCheck,
      title: t('features.qualityTitle'),
      description: t('features.qualityDesc'),
    },
  ];

  return (
    <section
      className="kere-brand-dark-section bg-[#631E26] bg-cover bg-center px-4 py-12 sm:px-6 md:py-16 lg:px-8"
      style={{
        backgroundImage:
          "linear-gradient(rgba(42,28,19,0.62), rgba(42,28,19,0.72)), url('/assets/backgrounds/features-wood.jpg')",
      }}
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-black/10 shadow-[0_38px_110px_rgba(28,18,12,0.24)] sm:rounded-[40px]">
          <div className="pointer-events-none absolute inset-4 rounded-[22px] border border-white/15 sm:inset-6 sm:rounded-[30px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_45%)]" />

          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div className="grid gap-6 border-b border-white/20 pb-8 md:grid-cols-[1.25fr_0.75fr] md:items-end md:pb-10">
              <div>
                <h2 className="max-w-[680px] font-serif text-[clamp(1.9rem,3.8vw,4rem)] font-medium leading-[0.98] tracking-normal text-white">
                  {t('features.sectionTitle')}
                </h2>
              </div>

              <p className="max-w-md text-sm leading-7 text-white/70 sm:text-base md:justify-self-end">
                {t('features.sectionSubtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3">
              {guarantees.map((item, index) => (
                <article
                  key={item.title}
                  className={[
                    'group relative flex min-h-[260px] flex-col justify-between py-8',
                    'border-b border-white/20',
                    'md:min-h-[330px] md:border-b-0 md:px-8 md:py-10',
                    index !== 0 ? 'md:border-l md:border-white/20' : '',
                    index === 0 ? 'md:pr-8' : '',
                    index === guarantees.length - 1 ? 'md:pl-8' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-4xl font-medium tracking-normal text-white/30 sm:text-5xl">
                      {item.number}
                    </span>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/5 text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#3b281d] sm:h-14 sm:w-14">
                      <item.icon className="h-6 w-6 stroke-[1.35] sm:h-7 sm:w-7" />
                    </div>
                  </div>

                  <div className="mt-10 md:mt-14">
                    <h3 className="max-w-sm font-serif text-[clamp(1.35rem,2vw,2.2rem)] font-medium leading-[1.08] tracking-normal text-white">
                      {item.title}
                    </h3>

                    <p className="mt-6 max-w-sm text-sm leading-7 text-white/65 sm:text-base">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col gap-6 border-t border-white/20 pt-8 sm:flex-row sm:items-end sm:justify-between md:pt-10">
              <p className="max-w-2xl font-serif text-lg font-medium leading-tight tracking-normal text-white sm:text-xl">
                {t('features.sectionSubtitle')}
              </p>

              <span className="h-2 w-2 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
