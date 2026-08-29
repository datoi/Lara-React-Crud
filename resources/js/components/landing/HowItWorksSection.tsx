import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function HowItWorksSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 72%', 'end 45%'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const steps = [
    {
      title: t('howItWorks.s1Title'),
      image: '/assets/hero/kere-look-3.jpeg',
      tone: 'bg-[#92615E]',
    },
    {
      title: t('howItWorks.s3Title'),
      image: '/assets/size-fit/measurements-3d-reference.png',
      tone: 'bg-[#F4EBD4]',
    },
    {
      title: t('howItWorks.s6Title'),
      image: '/assets/partners/process-orders.jpg',
      tone: 'bg-[#252525]',
    },
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="relative scroll-mt-20 overflow-hidden bg-[#E4E0D7] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[size:118px_118px]" />

      <div className="relative mx-auto max-w-[1180px]">
        <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr] md:items-end">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6 }}
            className="max-w-[560px] font-serif text-[clamp(1.85rem,3.2vw,3.35rem)] font-medium leading-[0.95] tracking-[-0.035em] text-[#111111]"
          >
            {t('howItWorks.heroTitle')}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-4 md:items-end"
          >
            <Link
              to="/help"
              className="inline-flex min-h-[42px] items-center justify-center gap-2 border border-[#111111] bg-transparent px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111] transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#111111] hover:text-white"
            >
              {t('howItWorks.seeMore')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>

        <div className="relative mt-12 md:mt-16">
          <div className="pointer-events-none absolute bottom-0 left-4 top-0 w-px bg-[#111111]/12 md:left-1/2" />
          <motion.div
            style={{ scaleY: lineScale }}
            className="pointer-events-none absolute bottom-0 left-4 top-0 w-px origin-top bg-[#631E26] md:left-1/2"
          />

          {steps.map((step, index) => (
            <article
              key={step.title}
              className={[
                'relative grid min-h-[340px] items-center gap-8 py-8 pl-10 md:min-h-[430px] md:grid-cols-2 md:gap-14 md:py-10 md:pl-0',
                index % 2 === 0 ? '' : 'md:[&_.kere-process-copy]:col-start-2 md:[&_.kere-process-image]:col-start-1 md:[&_.kere-process-image]:row-start-1',
              ].join(' ')}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.6 }}
                transition={{ duration: 0.5 }}
                className="absolute left-4 top-1/2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border border-[#631E26] bg-[#E4E0D7] md:left-1/2"
              />

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.45 }}
                transition={{ duration: 0.6 }}
                className={[
                  'kere-process-copy max-w-[360px]',
                  index % 2 === 0 ? 'md:pr-14 md:text-right' : 'md:pl-14',
                ].join(' ')}
              >
                <h3 className="font-serif text-[clamp(1.45rem,2.6vw,2.75rem)] font-medium leading-[0.98] tracking-[-0.03em] text-[#111111]">
                  {step.title}
                </h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 34, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{ duration: 0.6 }}
                className="kere-process-image relative h-[240px] max-w-[420px] md:h-[300px]"
              >
                <div className={`absolute -right-5 top-5 h-[78%] w-[54%] ${step.tone}`} />
                <div className="absolute -left-5 bottom-5 h-[58%] w-[42%] bg-white/38" />

                <img
                  src={step.image}
                  alt=""
                  className="relative h-full w-[82%] object-cover shadow-[0_24px_60px_rgba(17,17,17,0.16)] md:w-[78%]"
                />
              </motion.div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
