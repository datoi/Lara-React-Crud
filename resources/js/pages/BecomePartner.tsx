import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
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

    const STEPS = [
        { num: '01', title: t('partners.step1Title'), body: t('partners.step1Body') },
        { num: '02', title: t('partners.step2Title'), body: t('partners.step2Body') },
        { num: '03', title: t('partners.step3Title'), body: t('partners.step3Body') },
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

    const trustTags = [
        t('partners.freeToJoin'),
        t('partners.noSubscription'),
        t('partners.startToday'),
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* ── 1. Hero ── */}
            <section className="bg-slate-900 pt-28 pb-20 md:pt-36 md:pb-28 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/70 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8"
                    >
                        <Scissors className="w-3.5 h-3.5" />
                        {t('partners.eyebrow')}
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6"
                    >
                        {t('partners.heroTitle')}
                        <br />
                        <span className="text-slate-300">{t('partners.heroTitleHighlight')}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        {t('partners.heroSubtitle')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <PartnerCTA
                            label={t('partners.becomePartner')}
                            className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] text-sm"
                        />
                        <Link
                            to="/our-tailors"
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
                        >
                            {t('partners.seeTailors')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="text-white/35 text-xs mt-8"
                    >
                        {t('partners.trustLine')}
                    </motion.p>
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
                            {t('partners.whyTitle')}
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            {t('partners.whySubtitle')}
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {VALUE_PROPS.map((vp, i) => (
                            <motion.div
                                key={vp.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: i * 0.07 }}
                                className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
                            >
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                                    <vp.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2">{vp.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{vp.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 4. How It Works ── */}
            <section className="py-20 md:py-28 bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-14"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            {t('partners.howTitle')}
                        </h2>
                        <p className="text-slate-500">{t('partners.howSubtitle')}</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: i * 0.1 }}
                                className="relative"
                            >
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-6 left-[calc(50%+48px)] right-0 h-px bg-slate-200 -translate-y-1/2" />
                                )}
                                <div className="bg-white rounded-2xl p-7 border border-slate-200 relative">
                                    <div className="text-4xl font-black text-slate-100 mb-4 leading-none">
                                        {step.num}
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{step.body}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-center mt-12"
                    >
                        <PartnerCTA
                            label={t('partners.getStarted')}
                            className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-slate-700 transition-all active:scale-[0.98] text-sm"
                        />
                    </motion.div>
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
            <section className="py-20 md:py-28 bg-slate-900 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <Scissors className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                            {t('partners.finalTitle')}
                        </h2>
                        <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                            {t('partners.finalSubtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <PartnerCTA
                                label={t('partners.createProfile')}
                                className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] text-sm"
                            />
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 text-white/55 hover:text-white text-sm font-medium transition-colors"
                            >
                                {t('partners.haveQuestion')}
                            </Link>
                        </div>

                        <div className="flex items-center justify-center gap-6 mt-10">
                            {trustTags.map(tag => (
                                <div key={tag} className="flex items-center gap-2 text-white/40 text-xs">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
