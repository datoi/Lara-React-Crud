import { ClipboardCheck, Package, Palette, Ruler, Scissors, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    { number: '01', icon: Search,         title: t('howItWorks.s1Title'), description: t('howItWorks.s1Desc') },
    { number: '02', icon: Palette,        title: t('howItWorks.s2Title'), description: t('howItWorks.s2Desc') },
    { number: '03', icon: Ruler,          title: t('howItWorks.s3Title'), description: t('howItWorks.s3Desc') },
    { number: '04', icon: ClipboardCheck, title: t('howItWorks.s4Title'), description: t('howItWorks.s4Desc') },
    { number: '05', icon: Scissors,       title: t('howItWorks.s5Title'), description: t('howItWorks.s5Desc') },
    { number: '06', icon: Package,        title: t('howItWorks.s6Title'), description: t('howItWorks.s6Desc') },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 overflow-hidden bg-[#F4EBD4] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-14 grid gap-8 border-b border-black/15 pb-10 md:mb-20 md:grid-cols-[1.2fr_0.8fr] md:items-end md:pb-14">
          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-black/45">
              {t('howItWorks.eyebrow')}
            </p>

            <h2 className="max-w-[760px] font-serif text-[clamp(1.7rem,3.25vw,3.3rem)] font-medium leading-[0.98] tracking-normal text-[#111111]">
              {t('howItWorks.heroTitle')}
            </h2>
          </div>

          <p className="max-w-lg text-sm leading-7 text-[#6f6f6f] sm:text-base md:justify-self-end">
            {t('howItWorks.heroDesc')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className={[
                'group flex flex-col border-b border-black/15 py-8 last:border-b-0',
                'lg:min-h-[280px] lg:py-8 lg:pr-8',
                index % 3 !== 0 ? 'lg:border-l lg:border-black/15 lg:pl-8' : '',
                index < 3 ? 'lg:border-b' : 'lg:border-b-0',
              ].join(' ')}
            >
              <div className="flex items-start justify-between">
                <span className="font-serif text-4xl font-medium tracking-normal text-black/25 sm:text-5xl">
                  {step.number}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/20 text-[#111111] transition-all duration-300 group-hover:bg-[#111111] group-hover:text-white sm:h-14 sm:w-14">
                  <step.icon className="h-6 w-6 stroke-[1.35]" />
                </div>
              </div>

              <div className="mt-10">
                <h3 className="max-w-sm font-serif text-[clamp(1.2rem,1.6vw,1.7rem)] font-medium leading-[1.08] tracking-normal text-[#111111]">
                  {step.title}
                </h3>

                <p className="mt-4 max-w-sm text-sm leading-7 text-[#6f6f6f]">{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-14 border-t border-black/15 pt-10 text-center font-serif text-[clamp(1.3rem,2.4vw,2.1rem)] font-medium leading-[1.1] tracking-normal text-[#111111] md:mt-20 md:pt-14">
          {t('howItWorks.closing')}
        </p>
      </div>
    </section>
  );
}
