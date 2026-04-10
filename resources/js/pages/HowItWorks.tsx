import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { Ruler, Palette, Scissors, Package } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Palette,
        title: 'Browse & Choose',
        description:
            "Explore hundreds of clothing items crafted by Tbilisi-based tailors. Filter by category, price, or fabric. Each listing shows the tailor's profile and past work.",
    },
    {
        number: '02',
        icon: Ruler,
        title: 'Customize Your Fit',
        description:
            'Select your color, size, and fabric. Enter your exact measurements — chest, waist, hips, and length — for a truly tailored piece that fits you perfectly.',
    },
    {
        number: '03',
        icon: Scissors,
        title: 'Tailor Gets to Work',
        description:
            "Your order goes directly to a verified local tailor. They cut, stitch, and finish your garment by hand. You'll receive updates as your order progresses.",
    },
    {
        number: '04',
        icon: Package,
        title: 'Delivered to Your Door',
        description:
            "Once complete, your custom garment is carefully packaged and delivered. Not satisfied? Our quality guarantee means we'll make it right.",
    },
];

const faqs = [
    {
        q: 'How long does it take to make my order?',
        a: 'Most garments are completed within 7–14 business days. Complex or heavily customized items may take up to 21 days. Your tailor will confirm the timeline after accepting your order.',
    },
    {
        q: 'What if the measurements I provide are wrong?',
        a: "We recommend using our Size Guide before placing an order. If the garment doesn't fit due to incorrect measurements, contact us within 7 days of delivery and your tailor will adjust it.",
    },
    {
        q: 'Can I communicate with my tailor directly?',
        a: 'Yes. Once your order is placed, you can send notes and special requests through the order detail page. Your tailor can also reach you for clarification.',
    },
    {
        q: 'Are the tailors verified?',
        a: 'All tailors on Kere go through an application and portfolio review before being listed. We verify their identity, location, and craftsmanship quality.',
    },
];

export default function HowItWorks() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="py-16 md:py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Process</p>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">How Kere Works</h1>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                            From choosing your design to receiving your custom garment — here's exactly how it works.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Steps */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-10">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="flex gap-6 p-8 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center">
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 mb-1">{step.number}</p>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                                    <p className="text-slate-500 leading-relaxed">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24 bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-black text-slate-900 mb-3">Common Questions</h2>
                        <p className="text-slate-500">Everything you need to know before placing your first order.</p>
                    </motion.div>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="bg-white rounded-2xl border border-slate-200 p-6"
                            >
                                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-xl mx-auto px-4"
                >
                    <h2 className="text-3xl font-black mb-4">Ready to start?</h2>
                    <p className="text-slate-400 mb-8">Browse hundreds of customizable pieces made by Tbilisi tailors.</p>
                    <Link
                        to="/marketplace"
                        className="inline-block bg-white text-slate-900 font-semibold px-8 py-3 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        Browse Marketplace
                    </Link>
                </motion.div>
            </section>
        <Footer />
        </div>
    );
}
