import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { ShoppingBag, Ruler, RotateCcw, Mail, Package, CreditCard } from 'lucide-react';

const topics = [
    {
        icon: ShoppingBag,
        title: 'Placing Orders',
        articles: [
            { q: 'How do I place a custom order?', a: "Browse the marketplace, select a product, choose your size and color, enter your measurements, and click Order. You'll need a customer account to complete checkout." },
            { q: 'Can I order without entering measurements?', a: 'Yes — measurements are optional. If you skip them, the tailor will make the garment to the standard size you select. For the best fit, we recommend entering measurements.' },
            { q: 'How do I track my order?', a: 'Go to your Customer Dashboard. Each order shows its current status: Pending → In Progress → Shipped → Delivered.' },
        ],
    },
    {
        icon: Ruler,
        title: 'Measurements & Sizing',
        articles: [
            { q: 'How do I measure myself?', a: 'Use a soft measuring tape. Measure over light-fitting clothing or directly on skin. Check our Size Guide for step-by-step instructions with diagrams.' },
            { q: "What if I'm between sizes?", a: 'Enter your exact measurements rather than choosing a standard size. The tailor will cut to your measurements.' },
            { q: 'I entered the wrong measurements — what now?', a: "Contact us immediately via the Email Support button. If your order hasn't entered production yet, we can update them." },
        ],
    },
    {
        icon: Package,
        title: 'Order Status & Delivery',
        articles: [
            { q: 'How long does delivery take?', a: 'Most orders are completed in 7–14 business days. Complex items or heavy customisation may take up to 21 days. Shipping within Georgia takes 1–3 business days after completion.' },
            { q: 'Do you ship outside Georgia?', a: 'Currently Kere serves customers within Georgia only. International shipping is on our roadmap for 2025.' },
            { q: "My order says \"Shipped\" but I haven't received it.", a: 'Please allow 3 business days after the "Shipped" status before contacting support. Delays may occur due to courier conditions.' },
        ],
    },
    {
        icon: RotateCcw,
        title: 'Returns & Refunds',
        articles: [
            { q: 'Can I return a custom-made item?', a: "Because garments are made to order, we don't accept returns for change of mind. However, if the item doesn't match what you ordered or has a quality defect, contact us within 7 days." },
            { q: 'How do I request an alteration?', a: "If the fit is off, contact support within 7 days of delivery. We'll arrange for the tailor to make adjustments at no extra charge." },
            { q: 'When will my refund arrive?', a: 'Approved refunds are processed within 5–10 business days to your original payment method. See our Refund Policy for full details.' },
        ],
    },
    {
        icon: CreditCard,
        title: 'Payments & Billing',
        articles: [
            { q: 'What payment methods do you accept?', a: 'We accept Visa and Mastercard credit/debit cards. All payments are processed securely.' },
            { q: 'Is it safe to enter my card details?', a: 'Yes. Payments are processed by a PCI-DSS compliant payment gateway. Kere never stores your card number.' },
            { q: 'Can I get an invoice?', a: 'An order summary is available in your Customer Dashboard. Contact support if you need a formal invoice for business purposes.' },
        ],
    },
    {
        icon: Mail,
        title: 'Account & Support',
        articles: [
            { q: 'How do I reset my password?', a: 'Use the "Forgot password" link on the sign-in page. A reset link will be sent to your registered email.' },
            { q: 'How do I contact a tailor?', a: 'After placing an order, use the notes field in your order detail to send a message to your tailor.' },
            { q: 'How do I contact Kere support?', a: "Use the Email Support button below (you'll need to be signed in). We respond within one business day." },
        ],
    },
];

export default function HelpCenter() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            {/* Hero */}
            <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Help Center</p>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">How can we help?</h1>
                        <p className="text-slate-300 max-w-xl mx-auto">
                            Find answers to common questions about ordering, measurements, delivery, and more.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Topics */}
            <section className="py-16 md:py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    {topics.map((topic, ti) => (
                        <motion.div
                            key={topic.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: ti * 0.07 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                                    <topic.icon className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">{topic.title}</h2>
                            </div>
                            <div className="space-y-3">
                                {topic.articles.map((a, ai) => (
                                    <div key={ai} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                                        <p className="font-semibold text-slate-900 mb-1.5">{a.q}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed">{a.a}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Still stuck */}
            <section className="py-16 bg-slate-50 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-md mx-auto px-4"
                >
                    <h2 className="text-2xl font-black text-slate-900 mb-3">Still need help?</h2>
                    <p className="text-slate-500 mb-6 text-sm">Our support team is based in Tbilisi and responds within one business day.</p>
                    <Link
                        to="/"
                        className="inline-block bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors"
                    >
                        Email Support
                    </Link>
                    <p className="text-xs text-slate-400 mt-4">You need to be signed in to send a support email.</p>
                </motion.div>
            </section>
        <Footer />
        </div>
    );
}
