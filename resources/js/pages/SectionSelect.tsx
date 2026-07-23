import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setSection, scopeForPath, type Section } from '../hooks/useSection';

// Each tile is a self-contained branded design (wine for women, warm charcoal for
// men) — no image asset required. A real photo dropped at `image` layers on top.
const OPTIONS: { key: Section; image: string; bg: string; tKey: string; descKey: string }[] = [
    {
        key: 'women',
        image: '/assets/sections/women.jpg',
        bg: 'bg-[radial-gradient(125%_125%_at_50%_0%,#9C5B57_0%,#6F1D24_46%,#350C11_100%)]',
        tKey: 'section.women',
        descKey: 'section.womenDesc',
    },
    {
        key: 'men',
        image: '/assets/sections/men.jpg',
        bg: 'bg-[radial-gradient(125%_125%_at_50%_0%,#6E6459_0%,#3A332C_46%,#151210_100%)]',
        tKey: 'section.men',
        descKey: 'section.menDesc',
    },
];

export default function SectionSelect() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const rawNext = searchParams.get('next') || '/marketplace';
    // Only allow same-origin app paths through, never external URLs.
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/marketplace';

    const choose = (section: Section) => {
        setSection(scopeForPath(next), section);
        const sep = next.includes('?') ? '&' : '?';
        navigate(`${next}${sep}gender=${section}`);
    };

    return (
        <div className="min-h-screen bg-[#E4E0D7] px-4 py-10 sm:px-6">
            <Helmet>
                <title>{t('section.pageTitle')}</title>
            </Helmet>

            <div className="mx-auto max-w-[900px]">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#776158] transition-opacity hover:opacity-60"
                >
                    <ArrowLeft className="h-3.5 w-3.5 stroke-[1.6]" />
                    {t('section.back')}
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mt-8 max-w-[560px] text-center"
                >
                    <h1 className="font-serif text-[clamp(2.15rem,4.5vw,3.4rem)] font-medium leading-[0.95] tracking-[-0.04em] text-[#111111]">
                        {t('section.title')}
                    </h1>
                    <p className="mx-auto mt-3 max-w-[420px] text-sm leading-6 text-[#776158]">
                        {t('section.subtitle')}
                    </p>
                </motion.div>

                <div className="mt-10 grid gap-5 sm:grid-cols-2">
                    {OPTIONS.map((opt, i) => (
                        <motion.button
                            key={opt.key}
                            onClick={() => choose(opt.key)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                            className="group relative aspect-[3/4] overflow-hidden border border-[#111111]/12 text-left shadow-[0_12px_30px_rgba(30,22,16,0.12)] transition-transform duration-500 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F1D24] focus-visible:ring-offset-4 focus-visible:ring-offset-[#E4E0D7]"
                        >
                            {/* Branded background (shown when no photo is present) */}
                            <span className={`absolute inset-0 ${opt.bg}`} />
                            {/* Optional real photo layers on top if the asset exists */}
                            <img
                                src={opt.image}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
                            {/* Editorial inset frame */}
                            <span className="pointer-events-none absolute inset-4 border border-white/20 transition-all duration-500 group-hover:inset-3" />
                            <span className="absolute left-6 top-6 font-serif text-sm italic text-white/70">0{i + 1}</span>
                            <span className="absolute inset-x-0 bottom-0 p-6 text-white">
                                <span className="block font-serif text-[clamp(1.9rem,3.4vw,2.6rem)] font-medium leading-none tracking-[-0.03em]">
                                    {t(opt.tKey)}
                                </span>
                                <span className="mt-2.5 flex items-center gap-1.5 text-xs leading-5 text-white/80">
                                    {t(opt.descKey)}
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                                </span>
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
