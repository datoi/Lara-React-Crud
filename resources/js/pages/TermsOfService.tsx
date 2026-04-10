import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

const sections = [
    {
        title: '1. Acceptance of Terms',
        content: [
            'By accessing or using Kere, you agree to be bound by these Terms of Service and our Privacy Policy.',
            'If you do not agree to these terms, please do not use the platform.',
            'We may update these terms from time to time. Continued use of Kere after changes are posted constitutes acceptance of the updated terms.',
        ],
    },
    {
        title: '2. Eligibility',
        content: [
            'You must be at least 18 years old to create an account and place orders on Kere.',
            'By registering, you confirm that the information you provide is accurate and up to date.',
            'Each person may maintain one customer account and one tailor account.',
        ],
    },
    {
        title: '3. Customer Accounts',
        content: [
            'You are responsible for keeping your account credentials secure.',
            'You are responsible for all activity that occurs under your account.',
            'If you suspect unauthorised access, contact us immediately at hello@kere.com.',
            'Kere reserves the right to suspend or terminate accounts that violate these terms.',
        ],
    },
    {
        title: '4. Orders and Payments',
        content: [
            'All orders are placed in Georgian Lari (₾). Prices include VAT where applicable.',
            'An order is confirmed once payment has been successfully processed.',
            'Because garments are made to order, cancellations are only accepted within 24 hours of placing the order and before the tailor begins production.',
            'Kere acts as a marketplace connecting customers with tailors. Payment is processed by Kere and held until the order is marked as delivered.',
        ],
    },
    {
        title: '5. Custom Orders and Measurements',
        content: [
            'Customers are responsible for providing accurate measurements. Kere and tailors cannot be held liable for poor fit resulting from incorrect measurements.',
            'Customers should use our Size Guide before entering measurements.',
            'Tailors may contact customers for clarification before beginning work. Customers should respond within 48 hours.',
        ],
    },
    {
        title: '6. Tailor Accounts',
        content: [
            'Tailors must apply and be approved by Kere before listing products.',
            'Tailors agree to complete orders within the timeframes indicated, communicate proactively with customers, and deliver garments that match the order description.',
            'Kere charges a platform fee on each completed order. The current fee is disclosed during the tailor registration process.',
            'Tailors who repeatedly fail to fulfil orders or receive consistent quality complaints may be removed from the platform.',
        ],
    },
    {
        title: '7. Intellectual Property',
        content: [
            'All content on the Kere platform — including logos, design elements, and copy — is owned by Kere or its licensors.',
            'Product photos uploaded by tailors remain the property of the tailor, but by uploading them you grant Kere a non-exclusive licence to display them on the platform.',
            'You may not copy, reproduce, or redistribute Kere content without written permission.',
        ],
    },
    {
        title: '8. Limitation of Liability',
        content: [
            'Kere is a marketplace platform. We are not the manufacturer of the garments sold here.',
            'To the maximum extent permitted by Georgian law, Keres total liability for any claim arising from use of the platform is limited to the amount paid for the order in question.',
            'We are not liable for delays caused by force majeure events, courier issues outside our control, or incorrect information provided by customers.',
        ],
    },
    {
        title: '9. Governing Law',
        content: [
            'These terms are governed by the laws of Georgia.',
            'Any disputes arising from use of Kere will be subject to the jurisdiction of the courts of Tbilisi, Georgia.',
        ],
    },
    {
        title: '10. Contact',
        content: [
            'Kere — Tbilisi, Georgia',
            'Email: hello@kere.com',
            'For legal enquiries, please include "Legal" in the subject line.',
        ],
    },
];

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <section className="py-16 md:py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Legal</p>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Terms of Service</h1>
                        <p className="text-slate-400 text-sm">Last updated: April 2026</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-slate-600 leading-relaxed mb-12"
                    >
                        These Terms of Service govern your use of the Kere platform, operated from Tbilisi, Georgia.
                        Please read them carefully. "Kere", "we", "us", and "our" refer to the Kere platform and its operators.
                        "You" refers to the individual accessing or using the service.
                    </motion.p>

                    <div className="space-y-10">
                        {sections.map((s, i) => (
                            <motion.div
                                key={s.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.04 }}
                            >
                                <h2 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h2>
                                <ul className="space-y-2">
                                    {s.content.map((line, li) => (
                                        <li key={li} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-2" />
                                            {line}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        <Footer />
        </div>
    );
}
