import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const eligible = [
    'The garment is materially different from what was described in the listing.',
    'The garment has a manufacturing defect — a broken seam, missing button, or faulty stitching.',
    'The garment is the wrong item (e.g. different colour or style than ordered).',
    'The garment was damaged in transit.',
];

const notEligible = [
    'Change of mind after production has begun.',
    'Fit issues caused by incorrect measurements provided by the customer.',
    'Minor variations in colour due to screen display differences.',
    'Damage caused by improper washing or care after delivery.',
];

const steps = [
    { number: '01', title: 'Contact Support', desc: 'Email us at hello@kere.com within 7 days of receiving your order. Include your order number, a description of the issue, and photographs.' },
    { number: '02', title: 'Review', desc: 'Our team reviews your request within 2 business days. We may ask additional questions or request additional photos.' },
    { number: '03', title: 'Resolution', desc: 'We\'ll offer one of the following: alteration at no extra cost, partial refund, or full refund depending on the nature of the issue.' },
    { number: '04', title: 'Refund Processed', desc: 'Approved refunds are processed within 5–10 business days to your original payment method.' },
];

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Legal</p>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Refund Policy</h1>
                        <p className="text-slate-400 text-sm">Last updated: April 2026</p>
                    </motion.div>
                </div>
            </section>

            {/* Intro */}
            <section className="py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-12">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Because all garments on Kere are made to order specifically for you, we follow a
                                    <strong> custom-order refund policy</strong> rather than a standard return policy.
                                    Please read this page carefully before placing an order.
                                </p>
                            </div>
                        </div>

                        {/* Eligible */}
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-slate-700" />
                                <h2 className="text-xl font-bold text-slate-900">When you are eligible for a refund or alteration</h2>
                            </div>
                            <ul className="space-y-3">
                                {eligible.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-2" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Not eligible */}
                        <div className="mb-12">
                            <div className="flex items-center gap-2 mb-4">
                                <XCircle className="w-5 h-5 text-slate-400" />
                                <h2 className="text-xl font-bold text-slate-900">When refunds are not available</h2>
                            </div>
                            <ul className="space-y-3">
                                {notEligible.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-500 leading-relaxed">
                                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Cancellation */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-12">
                            <h2 className="font-bold text-slate-900 mb-3">Order Cancellations</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                You may cancel an order within <strong>24 hours</strong> of placing it, provided the tailor has not yet begun production.
                                To cancel, go to your Customer Dashboard and use the cancel option on the order, or contact support immediately.
                                After production begins, cancellations are not possible.
                            </p>
                        </div>
                    </motion.div>

                    {/* Process */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <h2 className="text-2xl font-black text-slate-900 mb-8">How to request a refund</h2>
                        <div className="space-y-4">
                            {steps.map((step, i) => (
                                <div key={step.number} className="flex gap-5 p-5 bg-white rounded-2xl border border-slate-200">
                                    <div className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-bold">
                                        {step.number}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 mb-1">{step.title}</p>
                                        <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mt-12 text-center"
                    >
                        <h2 className="text-xl font-black text-slate-900 mb-3">Need help with an order?</h2>
                        <p className="text-slate-500 text-sm mb-6">Contact our support team within 7 days of delivery. We're based in Tbilisi and respond within one business day.</p>
                        <Link to="/" className="inline-block bg-slate-900 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-700 transition-colors">
                            Contact Support
                        </Link>
                    </motion.div>
                </div>
            </section>
        <Footer />
        </div>
    );
}
