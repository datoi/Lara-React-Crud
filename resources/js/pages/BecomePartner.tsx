import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import {
    ArrowRight, CheckCircle, Star, Users, ShoppingBag,
    Scissors, Shield, TrendingUp, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getAuthUser } from '../hooks/useAuth';

// ─── Static data ──────────────────────────────────────────────────────────────

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

const VALUE_PROPS = [
    {
        icon: ShoppingBag,
        title: 'Receive Real Orders',
        body: 'Customers come to Kere ready to commission custom clothes. Every order that matches your specialty lands directly in your dashboard.',
    },
    {
        icon: TrendingUp,
        title: 'Showcase Your Work',
        body: 'Build a professional profile with photos of your best pieces. Your products appear in the Kere marketplace and get discovered by new customers every day.',
    },
    {
        icon: Shield,
        title: 'Free to Join',
        body: 'No monthly fees, no upfront cost. Create your profile, list your products, and start selling. We only succeed when you succeed.',
    },
    {
        icon: MessageCircle,
        title: 'Direct Customer Contact',
        body: 'Communicate directly with customers before starting any order. Discuss measurements, fabrics, and special requests — no middleman.',
    },
    {
        icon: Users,
        title: 'Grow Your Reputation',
        body: 'Earn verified reviews from satisfied customers. A strong Kere profile brings a steady stream of new commissions to your workshop.',
    },
    {
        icon: Scissors,
        title: 'Focus on the Craft',
        body: 'We handle discovery and order management. You focus on making beautiful clothes. No marketing budget required.',
    },
];

const STEPS = [
    {
        num: '01',
        title: 'Create Your Profile',
        body: 'Sign up in under two minutes. Add your bio, specialties, years of experience, and a profile photo so customers know who they\'re ordering from.',
    },
    {
        num: '02',
        title: 'List Your Products',
        body: 'Add at least 3 items to your shop — garment types, fabrics, and prices you offer. Great photos make a big difference.',
    },
    {
        num: '03',
        title: 'Start Receiving Orders',
        body: 'Once your profile is live, customers can browse your work and submit custom orders. You review, confirm details, and get to work.',
    },
];

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

const FAQS = [
    {
        q: 'Is there a fee to join Kere as a tailor?',
        a: 'No — joining is completely free. You create your profile, list your products, and start accepting orders without any upfront payment or subscription.',
    },
    {
        q: 'How do I get paid for my orders?',
        a: 'You agree pricing directly with the customer before starting. Payment details are discussed between you and the customer — Kere facilitates the connection and order management.',
    },
    {
        q: 'What types of garments can I offer?',
        a: 'Any custom-made clothing: dresses, shirts, trousers, jackets, skirts, coats, and more. You list exactly what you make and customers browse accordingly.',
    },
    {
        q: 'How long until I receive my first order?',
        a: 'Most active tailors with a complete profile (3+ products and a bio with photos) receive their first inquiry within the first two weeks.',
    },
    {
        q: 'Can I limit the orders I accept?',
        a: 'Absolutely. You review every order request before confirming. If you\'re fully booked or the project isn\'t right for you, you can decline.',
    },
];

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

// ─── CTA button — handles already-logged-in tailor ────────────────────────────

function PartnerCTA({ className, label = 'Become a Partner' }: { className?: string; label?: string }) {
    const user = getAuthUser();
    if (user?.role === 'tailor') {
        return (
            <Link
                to="/tailor-dashboard"
                className={className}
            >
                Go to your dashboard <ArrowRight className="w-4 h-4" />
            </Link>
        );
    }
    return (
        <Link
            to="/register/tailor"
            className={className}
        >
            {label} <ArrowRight className="w-4 h-4" />
        </Link>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BecomePartner() {
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

    const stats = [
        {
            value: platformStats ? formatCount(platformStats.customers_count) : '—',
            label: 'Active customers',
        },
        {
            value: platformStats ? formatCount(platformStats.tailors_count) : '—',
            label: 'Partner tailors',
        },
        {
            value: platformStats ? formatCount(platformStats.orders_count) : '—',
            label: 'Orders completed',
        },
        {
            value: platformStats?.avg_rating != null ? platformStats.avg_rating.toFixed(1) : '—',
            label: 'Average rating',
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* ── 1. Hero ── */}
            <section className="bg-slate-900 pt-28 pb-20 md:pt-36 md:pb-28 relative overflow-hidden">
                {/* Subtle grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Eyebrow */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/70 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8"
                    >
                        <Scissors className="w-3.5 h-3.5" />
                        Kere Partner Program
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6"
                    >
                        Get More Clients for Your
                        <br />
                        <span className="text-slate-300">Tailoring Business</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Join Kere and start receiving custom clothing orders from real customers.
                        Free to join. No marketing required.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <PartnerCTA
                            label="Become a Partner"
                            className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] text-sm"
                        />
                        <Link
                            to="/our-tailors"
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
                        >
                            See our tailors
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    {/* Trust line */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="text-white/35 text-xs mt-8"
                    >
                        Free to join · No subscription · Cancel anytime
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
                            Why tailors choose Kere
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            Built specifically for independent tailors who want a reliable stream of custom orders.
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
                            How it works
                        </h2>
                        <p className="text-slate-500">Three steps from signup to your first order.</p>
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
                                {/* Connector line */}
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
                            label="Get Started — It's Free"
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
                            Tailors already on Kere
                        </h2>
                        <p className="text-slate-500">
                            These independent tailors grow their businesses through the platform every day.
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
                            : featuredTailors.map((t, i) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: i * 0.08 }}
                                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4"
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3">
                                    {t.profile_image ? (
                                        <img
                                            src={t.profile_image}
                                            alt={t.name}
                                            className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <span className="text-slate-500 font-semibold text-lg">
                                                {t.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm truncate">{t.name}</p>
                                        {t.specialty && (
                                            <p className="text-xs text-slate-500 truncate">{t.specialty}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Rating */}
                                {t.avg_rating !== null && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <Star
                                                    key={j}
                                                    className={`w-3.5 h-3.5 ${j < Math.round(t.avg_rating!) ? 'fill-slate-900 text-slate-900' : 'text-slate-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">{t.avg_rating.toFixed(1)}</span>
                                        <span className="text-xs text-slate-400">({t.reviews_count} reviews)</span>
                                    </div>
                                )}

                                {/* Bio */}
                                {t.bio ? (
                                    <p className="text-sm text-slate-600 leading-relaxed flex-1 line-clamp-3">{t.bio}</p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic flex-1">No bio yet.</p>
                                )}

                                {/* Footer meta */}
                                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                                    {t.years_experience != null && (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                                            {t.years_experience} yrs experience
                                        </span>
                                    )}
                                    {t.products_count > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Scissors className="w-3.5 h-3.5 text-slate-400" />
                                            {t.products_count} product{t.products_count !== 1 ? 's' : ''}
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
                            Meet all our tailors <ArrowRight className="w-4 h-4" />
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
                            Common questions
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
                            Start Selling on Kere
                        </h2>
                        <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                            Join Georgia's fastest-growing custom clothing platform. Create your profile today and reach customers who are already looking for your craft.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <PartnerCTA
                                label="Create Your Partner Profile"
                                className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] text-sm"
                            />
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 text-white/55 hover:text-white text-sm font-medium transition-colors"
                            >
                                Have a question? Contact us
                            </Link>
                        </div>

                        <div className="flex items-center justify-center gap-6 mt-10">
                            {['Free to join', 'No subscription', 'Start today'].map(tag => (
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
