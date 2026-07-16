import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import {
    ArrowRight, CheckCircle, Star, Users, ShoppingBag,
    Scissors, Shield, TrendingUp, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getAuthUser } from '../hooks/useAuth';

type PlatformStats = {
    customers_count: number;
    tailors_count:   number;
    orders_count:    number;
    avg_rating:      number | null;
};

function formatCount(n: number): string {
    if (n >= 1000) return (Math.floor(n / 100) / 10).toFixed(n % 1000 === 0 ? 0 : 1).replace('.', ' ') + 'k+';
    return n > 0 ? `${n}+` : '—';
}

type FeaturedTailor = {
    id:               number;
    name:             string;
    bio:              string | null;
    specialty:        string | null;
    years_experience: number | null;
    profile_image:    string | null;
    products_count:   number;
    reviews_count:    number;
    avg_rating:       number | null;
};

// ─── FAQ item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-slate-200 last:border-0">
            <button
                onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between py-5 text-left gap-4"
            >
                <span className="text-base font-medium text-slate-900">{q}</span>
                {open
                    ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                }
            </button>
            {open && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <p className="text-slate-500 pb-5 leading-relaxed">{a}</p>
                </motion.div>
            )}
        </div>
    );
}

// ─── CTA button ───────────────────────────────────────────────────────────────

function PartnerCTA({ className, label }: { className?: string; label: string }) {
    const { t } = useTranslation();
    const user = getAuthUser();
    if (user?.role === 'tailor') {
        return (
            <Link to="/tailor-dashboard" className={className}>
                {t('partners.goDashboard')} <ArrowRight className="w-4 h-4" />
            </Link>
        );
    }
    return (
        <Link to="/register/tailor" className={className}>
            {label} <ArrowRight className="w-4 h-4" />
        </Link>
    );
}
type ProcessStep = {
    number: string;
    title: string;
    body: string;
    image: string;
    alt: string;
};

type ProcessExperienceProps = {
    title: string;
    subtitle: string;
    steps: ProcessStep[];
};

function ProcessExperience({ title, subtitle, steps }: ProcessExperienceProps) {
    const [activeStep, setActiveStep] = useState(0);
    const current = steps[activeStep] ?? steps[0];

    return (
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
                <div className="mb-9">
                    <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#6F1D24]/45">
                        Process
                    </p>

                    <h2 className="max-w-[650px] font-serif text-[clamp(2.6rem,5vw,5rem)] font-medium leading-[0.92] tracking-[-0.05em] text-[#6F1D24]">
                        {title}
                    </h2>

                    <p className="mt-5 max-w-[510px] text-sm leading-7 text-[#725E54]">
                        {subtitle}
                    </p>
                </div>

                <div className="border-t border-[#6F1D24]/15">
                    {steps.map((step, index) => {
                        const isActive = index === activeStep;

                        return (
                            <button
                                key={step.number}
                                type="button"
                                onMouseEnter={() => setActiveStep(index)}
                                onFocus={() => setActiveStep(index)}
                                onClick={() => setActiveStep(index)}
                                aria-pressed={isActive}
                                className={[
                                    'group relative grid w-full grid-cols-[44px_1fr] gap-4 border-b border-[#6F1D24]/15 py-6 text-left transition-all duration-300 sm:grid-cols-[58px_1fr]',
                                    isActive
                                        ? 'pl-4 text-[#6F1D24]'
                                        : 'text-[#6F1D24]/45 hover:pl-4 hover:text-[#6F1D24]',
                                ].join(' ')}
                            >
                                <span
                                    className={[
                                        'absolute bottom-0 left-0 top-0 w-[3px] origin-center bg-[#6F1D24] transition-transform duration-300',
                                        isActive
                                            ? 'scale-y-100'
                                            : 'scale-y-0 group-hover:scale-y-100',
                                    ].join(' ')}
                                />

                                <span className="pt-1 text-[9px] font-semibold tracking-[0.15em]">
                                    {step.number}
                                </span>

                                <div>
                                    <h3
                                        className={[
                                            'font-serif text-xl font-medium leading-tight tracking-[-0.025em] transition-all duration-300 sm:text-2xl',
                                            isActive
                                                ? 'translate-x-0 opacity-100'
                                                : 'opacity-60 group-hover:opacity-100',
                                        ].join(' ')}
                                    >
                                        {step.title}
                                    </h3>

                                    <div
                                        className={[
                                            'grid transition-all duration-300',
                                            isActive
                                                ? 'mt-3 grid-rows-[1fr] opacity-100'
                                                : 'grid-rows-[0fr] opacity-0',
                                        ].join(' ')}
                                    >
                                        <div className="overflow-hidden">
                                            <p className="max-w-[510px] pb-1 text-sm leading-7 text-[#725E54]">
                                                {step.body}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="relative lg:pt-14">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#D8CBBE]">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={current.image}
                            src={current.image}
                            alt={current.alt}
                            initial={{
                                opacity: 0,
                                scale: 1.035,
                                y: 10,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.985,
                                y: -8,
                            }}
                            transition={{
                                duration: 0.42,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    </AnimatePresence>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
                                Step {current.number}
                            </p>

                            <p className="mt-2 max-w-sm font-serif text-2xl font-medium leading-tight tracking-[-0.03em]">
                                {current.title}
                            </p>
                        </div>

                        <span className="font-serif text-4xl text-white/40">
                            {current.number}
                        </span>
                    </div>
                </div>

                <div className="pointer-events-none absolute -bottom-5 -left-5 h-20 w-20 rounded-full border border-[#6F1D24]/15" />

                <div className="pointer-events-none absolute -right-6 -top-1 h-32 w-32 rounded-full border border-[#6F1D24]/10" />
            </div>
        </div>
    );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BecomePartner() {
    const { t } = useTranslation();
    const [platformStats,   setPlatformStats]   = useState<PlatformStats | null>(null);
    const [featuredTailors, setFeaturedTailors] = useState<FeaturedTailor[]>([]);

    useEffect(() => {
        fetch('/api/platform/stats', { headers: { 'Accept': 'application/json' } })
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setPlatformStats(d))
            .catch(() => {});

        fetch('/api/tailors', { headers: { 'Accept': 'application/json' } })
            .then(r => r.ok ? r.json() : null)
            .then(d => d?.tailors && setFeaturedTailors(d.tailors.slice(0, 3)))
            .catch(() => {});
    }, []);

    const VALUE_PROPS = [
        { icon: ShoppingBag,   title: t('partners.vp1Title'), body: t('partners.vp1Body') },
        { icon: TrendingUp,    title: t('partners.vp2Title'), body: t('partners.vp2Body') },
        { icon: Shield,        title: t('partners.vp3Title'), body: t('partners.vp3Body') },
        { icon: MessageCircle, title: t('partners.vp4Title'), body: t('partners.vp4Body') },
        { icon: Users,         title: t('partners.vp5Title'), body: t('partners.vp5Body') },
        { icon: Scissors,      title: t('partners.vp6Title'), body: t('partners.vp6Body') },
    ];

    const FAQS = [
        { q: t('partners.faq1q'), a: t('partners.faq1a') },
        { q: t('partners.faq2q'), a: t('partners.faq2a') },
        { q: t('partners.faq3q'), a: t('partners.faq3a') },
        { q: t('partners.faq4q'), a: t('partners.faq4a') },
        { q: t('partners.faq5q'), a: t('partners.faq5a') },
    ];

    const stats = [
        { value: platformStats ? formatCount(platformStats.customers_count) : '—', label: t('partners.statsCustomers') },
        { value: platformStats ? formatCount(platformStats.tailors_count)   : '—', label: t('partners.statsTailors') },
        { value: platformStats ? formatCount(platformStats.orders_count)    : '—', label: t('partners.statsOrders') },
        { value: platformStats?.avg_rating != null ? platformStats.avg_rating.toFixed(1) : '—', label: t('partners.statsRating') },
    ];

    return (
        <div className="kere-landing partners-page min-h-screen overflow-x-hidden bg-[#F4EBD4]">
            <Navigation />

            {/* ── Partner Hero ── */}
            <section className="partners-hero-design relative overflow-hidden bg-[#F4EBD4] px-4 pb-14 pt-28 sm:px-6 md:pb-20 md:pt-32 lg:px-8">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-0 top-[29%] h-px w-full bg-[#6F1D24]/10" />
                    <div className="absolute bottom-[18%] left-0 h-px w-full bg-[#6F1D24]/10" />

                </div>

                <div className="relative mx-auto max-w-[1380px]">
                    <div className="grid min-h-[610px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65 }}
                            className="relative z-20"
                        >
                            <motion.h1
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.65, delay: 0.08 }}
                                className="max-w-[760px] font-serif text-[clamp(2.6rem,5.4vw,5.75rem)] font-medium leading-[0.9] tracking-[-0.045em] text-[#6F1D24]"
                            >
                                {t('partners.heroTitle')}

                                <span className="mt-2 block text-[#9A8174]">
                                    {t('partners.heroTitleHighlight')}
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.15 }}
                                className="mt-8 max-w-[620px] text-sm leading-7 text-[#6E5A50] sm:text-base md:text-lg md:leading-8"
                            >
                                {t('partners.heroSubtitle')}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.22 }}
                                className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
                            >
                                <PartnerCTA
                                    label={t('partners.becomePartner')}
                                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#6F1D24] px-7 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(111,29,36,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#57161C]"
                                />

                                <Link
                                    to="/our-tailors"
                                    className="partners-secondary-cta inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[#111111] bg-transparent px-7 text-sm font-semibold text-[#111111] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111111] hover:bg-transparent hover:text-[#111111]"
                                >
                                    {t('partners.seeTailors')}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 35 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.75,
                                delay: 0.12,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="relative z-10 mx-auto w-full max-w-[620px] lg:mx-0 lg:justify-self-end"
                        >
                            <div className="absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E7D3C6]/70 blur-3xl" />

                            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_44%_10%_10%/25%_25%_8%_8%] border border-[#6F1D24]/10 bg-[#F4EBD4]">
                                <img
                                    src="/assets/partners/kere-partner-hero.jpg"
                                    alt="Tailor fitting a garment on a dress form"
                                    className="h-full w-full object-cover object-center mix-blend-multiply"
                                />

                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#6F1D24]/10 via-transparent to-white/10" />
                            </div>

                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── 2. Stats bar ── */}
            <section className="bg-slate-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
                        {stats.map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.06 }}
                                className="py-8 px-6 text-center"
                            >
                                <p className="text-2xl md:text-3xl font-bold text-white tabular-nums">{s.value}</p>
                                <p className="text-sm text-white/45 mt-1">{s.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 3. Value propositions ── */}
            <section className="partners-benefits-design relative min-h-screen overflow-hidden bg-[#41432d]">
                <div className="absolute inset-0">
                    <img
                        src="/assets/partners/egyptian-partner-process.png"
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover object-[58%_center]"
                    />

                    <div className="absolute inset-0 bg-black/20" />

                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
                </div>

                <div className="relative z-10 mx-auto min-h-screen max-w-[1240px] px-5 py-10 sm:px-8 md:px-10 lg:px-12 xl:px-14">
                    <div className="grid min-h-[calc(100vh-5rem)] items-center lg:grid-cols-[0.78fr_1.22fr]">
                        <div className="max-w-[520px]">
                            <motion.div
                                initial={{ opacity: 0, x: -38, filter: 'blur(8px)' }}
                                whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                viewport={{ once: true, amount: 0.45 }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                className="border-b border-white/25 pb-5 text-white"
                            >
                                <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/60">
                                    Kere Partner Program
                                </p>

                                <h2 className="mt-3 max-w-[520px] font-serif text-[clamp(1.8rem,2.6vw,3.05rem)] font-normal leading-[1.03] tracking-[-0.01em] text-white">
                                    {t('partners.whyTitle')}
                                </h2>

                                <p className="mt-4 max-w-[430px] text-xs leading-6 text-white/70">
                                    {t('partners.whySubtitle')}
                                </p>
                            </motion.div>

                            {VALUE_PROPS.slice(0, 5).map((step, index) => {
                                const Icon = step.icon;

                                return (
                                    <motion.article
                                        key={step.title}
                                        initial={{
                                            opacity: 0,
                                            x: -38,
                                            filter: 'blur(8px)',
                                        }}
                                        whileInView={{
                                            opacity: 1,
                                            x: 0,
                                            filter: 'blur(0px)',
                                        }}
                                        viewport={{
                                            once: true,
                                            amount: 0.72,
                                            margin: '-12% 0px -22% 0px',
                                        }}
                                        transition={{
                                            duration: 0.62,
                                            delay: 0,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="group grid grid-cols-[42px_1px_32px_1fr] gap-3 border-b border-white/25 py-5 text-white sm:grid-cols-[50px_1px_36px_1fr] sm:gap-4 sm:py-6"
                                    >
                                        <span className="font-serif text-2xl font-light leading-none tracking-[-0.02em] text-white sm:text-3xl">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>

                                        <span className="h-8 w-px bg-white/40 sm:h-9" />

                                        <span className="flex h-8 w-8 items-start justify-center pt-1 text-white/90 sm:h-9 sm:w-9">
                                            <Icon className="h-4.5 w-4.5 stroke-[1.15] sm:h-5 sm:w-5" />
                                        </span>

                                        <div className="pb-1">
                                            <h3 className="max-w-[340px] font-serif text-[clamp(1rem,1.35vw,1.28rem)] font-normal leading-[1.18] tracking-[-0.01em] text-white">
                                                {step.title}
                                            </h3>

                                            <p className="mt-2 max-w-[330px] text-[11px] leading-5 text-white/70">
                                                {step.body}
                                            </p>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>

                        <div aria-hidden="true" />
                    </div>
                </div>
            </section>

            <section className="partners-process-design overflow-hidden bg-[#F4EBD4] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
                <div className="mx-auto max-w-[1320px]">
                    <ProcessExperience
                        steps={[
                            {
                                number: '01',
                                title: t('partners.step1Title'),
                                body: t('partners.step1Body'),
                                image: '/assets/partners/process-profile.jpg',
                                alt: 'Tailor creating a professional profile',
                            },
                            {
                                number: '02',
                                title: t('partners.step2Title'),
                                body: t('partners.step2Body'),
                                image: '/assets/partners/process-products.jpg',
                                alt: 'Tailor presenting garments and services',
                            },
                            {
                                number: '03',
                                title: t('partners.step3Title'),
                                body: t('partners.step3Body'),
                                image: '/assets/partners/process-orders.jpg',
                                alt: 'Tailor receiving a customer order',
                            },
                        ]}
                        title={t('partners.howTitle')}
                        subtitle={t('partners.howSubtitle')}
                    />

                    <div className="mt-9 flex flex-col gap-5 border-t border-[#6F1D24]/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#6F1D24]/45">
                            Kere partner process
                        </p>

                        <PartnerCTA
                            label={t('partners.getStarted')}
                            className="group inline-flex min-h-[46px] items-center justify-center gap-3 rounded-full bg-[#1D1D1D] px-7 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#333333]"
                        />
                    </div>
                </div>
            </section>

            {/* ── 5. Featured tailors ── */}
            <section className="py-20 md:py-28 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-14"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            {t('partners.tailorsTitle')}
                        </h2>
                        <p className="text-slate-500">
                            {t('partners.tailorsSubtitle')}
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {featuredTailors.length === 0
                            ? Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 animate-pulse">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-slate-200 rounded w-2/3" />
                                            <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2.5 bg-slate-200 rounded w-full" />
                                        <div className="h-2.5 bg-slate-200 rounded w-5/6" />
                                        <div className="h-2.5 bg-slate-200 rounded w-4/6" />
                                    </div>
                                </div>
                            ))
                            : featuredTailors.map((tailor, i) => (
                            <motion.div
                                key={tailor.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: i * 0.08 }}
                                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    {tailor.profile_image ? (
                                        <img
                                            src={tailor.profile_image}
                                            alt={tailor.name}
                                            className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <span className="text-slate-500 font-semibold text-lg">
                                                {tailor.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm truncate">{tailor.name}</p>
                                        {tailor.specialty && (
                                            <p className="text-xs text-slate-500 truncate">{tailor.specialty}</p>
                                        )}
                                    </div>
                                </div>

                                {tailor.avg_rating !== null && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <Star
                                                    key={j}
                                                    className={`w-3.5 h-3.5 ${j < Math.round(tailor.avg_rating!) ? 'fill-slate-900 text-slate-900' : 'text-slate-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">{tailor.avg_rating.toFixed(1)}</span>
                                        <span className="text-xs text-slate-400">({tailor.reviews_count} {t('partners.reviews')})</span>
                                    </div>
                                )}

                                {tailor.bio ? (
                                    <p className="text-sm text-slate-600 leading-relaxed flex-1 line-clamp-3">{tailor.bio}</p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic flex-1">{t('partners.noBio')}</p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                                    {tailor.years_experience != null && (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                                            {tailor.years_experience} {t('partners.yrsExperience')}
                                        </span>
                                    )}
                                    {tailor.products_count > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Scissors className="w-3.5 h-3.5 text-slate-400" />
                                            {tailor.products_count} {t('partners.reviews')}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className="text-center mt-10"
                    >
                        <Link
                            to="/our-tailors"
                            className="text-sm text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
                        >
                            {t('partners.meetAllTailors')} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── 6. FAQ ── */}
            <section className="py-20 md:py-28 bg-slate-50">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            {t('partners.faqTitle')}
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                        className="bg-white rounded-2xl border border-slate-200 px-6 md:px-8"
                    >
                        {FAQS.map(faq => (
                            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── 7. Final CTA ── */}
            <section className="relative overflow-hidden bg-[#F4EBD4] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#6F1D24]/15" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#6F1D24]/15" />
                <div className="relative mx-auto max-w-[980px] text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#6F1D24]/20 text-[#6F1D24]">
                            <Scissors className="h-4 w-4 stroke-[1.4]" />
                        </div>

                        <h2 className="mx-auto mt-7 max-w-[850px] font-serif text-[clamp(2.7rem,5.8vw,5.6rem)] font-medium leading-[0.92] tracking-[-0.055em] text-[#6F1D24]">
                            {t('partners.finalTitle')}
                        </h2>

                        <p className="mx-auto mt-5 max-w-[560px] text-sm leading-7 text-[#80685D] sm:text-base">
                            {t('partners.finalSubtitle')}
                        </p>

                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <PartnerCTA
                                label={t('partners.createProfile')}
                                className="partners-final-primary-cta group inline-flex min-h-[50px] w-full items-center justify-center gap-3 rounded-full bg-[#1D1D1D] px-8 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#363636] sm:w-auto"
                            />
                            <Link
                                to="/contact"
                                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-[#111111] px-8 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111111] hover:text-white sm:w-auto"
                            >
                                {t('partners.haveQuestion')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
