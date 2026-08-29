import { useTranslation } from 'react-i18next';

export function FeaturesSection() {
  const { t } = useTranslation();

  const guarantees = [
    {
      number: '01',
      title: t('features.verifiedTailorsTitle'),
      description: t('features.verifiedTailorsDesc'),
    },
    {
      number: '02',
      title: t('features.customFitTitle'),
      description: t('features.customFitDesc'),
    },
    {
      number: '03',
      title: t('features.qualityTitle'),
      description: t('features.qualityDesc'),
    },
  ];

  return (
    <section className="bg-[#F4F0E9] text-[#111111]">
      <div className="grid lg:grid-cols-2">
        <div className="h-[68vh] min-h-[520px] lg:sticky lg:top-[50px] lg:h-[calc(100dvh-50px)] lg:min-h-0 lg:self-start">
          <img
            src="/assets/hero/kere-look-2.jpeg"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="bg-[#F4F0E9] px-6 sm:px-10 lg:px-14 xl:px-20">
          <header className="border-b border-black/15 py-10 sm:py-12 lg:py-14">
            <h2 className="max-w-[620px] font-serif text-[clamp(1.75rem,3vw,3.2rem)] font-medium leading-[0.98] tracking-[-0.03em] !text-[#111111]">
              {t('features.sectionTitle')}
            </h2>
          </header>

          {guarantees.map((item) => (
            <article
              key={item.title}
              className="flex min-h-[42vh] flex-col justify-center py-12 lg:min-h-[52vh] lg:py-16"
            >
              <h3 className="max-w-[560px] font-serif text-[clamp(1.45rem,2.3vw,2.7rem)] font-medium leading-[1.05] tracking-[-0.025em] !text-[#111111]">
                {item.title}
              </h3>
              <p className="mt-5 max-w-[500px] text-sm leading-7 text-[#514843] sm:text-[15px] sm:leading-7">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
