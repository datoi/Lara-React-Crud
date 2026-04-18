import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Heart, Shield, Users, Leaf } from 'lucide-react';

const values = [
    {
        icon: Heart,
        title: 'Craftsmanship First',
        description: 'Every garment on Kere is made by hand by a skilled tailor. We celebrate the artistry that goes into every stitch.',
    },
    {
        icon: Users,
        title: 'Community-Driven',
        description: 'We exist to support local Georgian tailors — giving them a platform to reach customers beyond their neighborhood workshop.',
    },
    {
        icon: Shield,
        title: 'Quality Guaranteed',
        description: 'Not happy with your order? We stand behind every purchase. Our team will work with the tailor to make it right.',
    },
    {
        icon: Leaf,
        title: 'Made to Last',
        description: 'Custom clothing means no waste. Each piece is made for you specifically — no overproduction, no landfill.',
    },
];

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-3xl"
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Our Story</p>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">We're Kere.</h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Kere was founded in Tbilisi with a simple belief: clothing should fit the person wearing it,
                            not the other way around. We built a marketplace that connects customers directly with
                            Georgia's most talented independent tailors.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Story */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-3xl font-black text-slate-900 mb-6">Why we built this</h2>
                            <div className="space-y-4 text-slate-600 leading-relaxed">
                                <p>
                                    Georgia has a long tradition of skilled textile work. Tbilisi alone is home to
                                    hundreds of independent tailors — master craftspeople who learned their trade over
                                    decades. But most of them had no way to reach customers beyond word-of-mouth.
                                </p>
                                <p>
                                    At the same time, customers struggled to find custom clothing without knowing
                                    someone personally. Fast fashion filled the gap, but at a cost: ill-fitting clothes,
                                    poor quality, and mountains of waste.
                                </p>
                                <p>
                                    Kere bridges that gap. We give tailors a professional storefront and give customers
                                    access to truly bespoke clothing — at prices that are fair for everyone.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-slate-100 rounded-3xl aspect-[4/3] flex items-center justify-center"
                        >
                            <div className="text-center text-slate-400 px-8">
                                <p className="text-6xl mb-4">🪡</p>
                                <p className="text-sm">Tbilisi, Georgia</p>
                                <p className="text-xs mt-1 text-slate-300">Est. 2024</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 md:py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-3">What we stand for</h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="bg-white rounded-2xl border border-slate-200 p-6"
                            >
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                                    <v.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{v.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 md:py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: '50+', label: 'Verified Tailors' },
                            { number: '1,200+', label: 'Orders Completed' },
                            { number: '98%', label: 'Customer Satisfaction' },
                            { number: 'Tbilisi', label: 'Home City' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                            >
                                <p className="text-4xl font-black text-white mb-2">{stat.number}</p>
                                <p className="text-slate-400 text-sm">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-xl mx-auto px-4"
                >
                    <h2 className="text-2xl font-black text-slate-900 mb-4">Join our community</h2>
                    <p className="text-slate-500 mb-8">Whether you're a customer or a tailor, there's a place for you on Kere.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/marketplace" className="bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors">
                            Browse Marketplace
                        </Link>
                        <Link to="/register/tailor" className="border border-slate-300 text-slate-700 font-semibold px-8 py-3 rounded-full hover:border-slate-500 transition-colors">
                            Join as Tailor
                        </Link>
                    </div>
                </motion.div>
            </section>
        <Footer />
        </div>
    );
}
