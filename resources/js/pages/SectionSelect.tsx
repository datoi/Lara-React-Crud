import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setSection, scopeForPath, type Section } from '../hooks/useSection';
import { Navigation } from '../components/landing/Navigation';

const OPTIONS: { key: Section; image: string; note: string; tKey: string; descKey: string }[] = [
    {
        key: 'women',
        image: '/assets/design-categories/dress-cutout.png',
        note: 'Women',
        tKey: 'section.women',
        descKey: 'section.womenDesc',
    },
    {
        key: 'men',
        image: '/assets/design-categories/men-section-card.jpg',
        note: 'Men',
        tKey: 'section.men',
        descKey: 'section.menDesc',
    },
];

export default function SectionSelect() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const rawNext = searchParams.get('next') || '/marketplace';
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/marketplace';

    const choose = (section: Section) => {
        setSection(scopeForPath(next), section);
        const sep = next.includes('?') ? '&' : '?';
        navigate(`${next}${sep}gender=${section}`);
    };

    return (
        <div className="design-page min-h-screen bg-[#E4E0D7] text-[#261D1B]">
            <Helmet>
                <title>{t('section.pageTitle')}</title>
            </Helmet>

            <Navigation />

            <main className="mx-auto max-w-[760px] px-4 pb-14 pt-28 sm:px-6 sm:pt-32 lg:pt-36">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#776158] transition-opacity hover:opacity-60"
                >
                    <ArrowLeft className="h-3.5 w-3.5 stroke-[1.6]" />
                    {t('section.back')}
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mt-8 max-w-[620px] text-center"
                >
                    <h1 className="font-serif text-[clamp(2.05rem,4vw,3.45rem)] font-medium leading-[0.92] tracking-[-0.05em] text-[#111111]">
                        {t('section.title')}
                    </h1>
                    <p className="mx-auto mt-3 max-w-[500px] text-sm leading-6 text-[#776158]">
                        {t('section.subtitle')}
                    </p>
                </motion.div>

                <div className="mt-10 grid grid-cols-2 items-start gap-4 sm:gap-5">
                    {OPTIONS.map((opt, i) => (
                        <motion.button
                            key={opt.key}
                            onClick={() => choose(opt.key)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                            className="group relative block text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-4 focus-visible:ring-offset-[#E4E0D7]"
                        >
                            <article>
                                <div className="mb-2 flex items-start justify-between gap-3">
                                    <p className="text-[10px] font-semibold leading-none tracking-[-0.02em] text-[#111111] sm:text-[11px]">
                                        {t(opt.tKey)}
                                    </p>
                                </div>

                                <div className="flex h-[178px] items-center justify-center border border-[#111111]/45 bg-[#E4E0D7] p-4 transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.035] group-hover:shadow-[0_18px_40px_rgba(17,17,17,0.14)] sm:h-[230px] sm:p-5">
                                    <img
                                        src={opt.image}
                                        alt={t(opt.tKey)}
                                        className="h-full w-full object-contain mix-blend-multiply"
                                    />
                                </div>

                                <div className="mt-3 flex items-start justify-between gap-4">
                                    <p className="max-w-[220px] text-xs leading-5 text-[#776158]">
                                        {t(opt.descKey)}
                                    </p>
                                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#111111] transition-transform duration-500 group-hover:translate-x-1" />
                                </div>
                            </article>
                        </motion.button>
                    ))}
                </div>
            </main>
        </div>
    );
}
