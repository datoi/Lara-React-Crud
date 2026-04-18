import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';

const sections = [
    {
        title: '1. Information We Collect',
        content: [
            'Account information: When you register, we collect your first name, last name, and email address.',
            'Order information: When you place an order, we collect the details needed to fulfil it — selected product, size, colour, and any measurements you provide.',
            'Payment information: Payments are processed by a third-party payment gateway. Kere does not store your card number or payment credentials.',
            'Usage data: We collect basic analytics (pages visited, time on site) to improve the platform. This data is aggregated and anonymised.',
            'Support messages: When you contact support, we store the content of your message to help resolve your request.',
        ],
    },
    {
        title: '2. How We Use Your Information',
        content: [
            'To create and manage your account.',
            'To process and fulfil your orders, including sharing relevant order details with your assigned tailor.',
            'To send order status notifications and support responses to your email address.',
            'To improve the platform based on aggregated usage patterns.',
            'We do not sell your personal data to third parties.',
        ],
    },
    {
        title: '3. Data Sharing',
        content: [
            'Tailors: We share your name and order details (including measurements, if provided) with the tailor fulfilling your order. Tailors are prohibited from using this data for any purpose other than completing your order.',
            'Service providers: We use trusted third-party services for payment processing and email delivery. These providers only receive the data necessary for their function.',
            'Legal requirements: We may disclose your information if required by Georgian law or a valid court order.',
        ],
    },
    {
        title: '4. Data Retention',
        content: [
            'Account data is retained for as long as your account is active.',
            'Order data is retained for 5 years from the date of purchase, as required for tax and accounting purposes.',
            'Support messages are retained for 2 years.',
            'You may request deletion of your account and associated data at any time by contacting support.',
        ],
    },
    {
        title: '5. Cookies',
        content: [
            'Kere uses session cookies to keep you signed in during your visit. These are essential for the platform to function.',
            'We do not use advertising or tracking cookies.',
            'You can disable cookies in your browser settings, but this will prevent you from signing in.',
        ],
    },
    {
        title: '6. Security',
        content: [
            'All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text.',
            'Access to personal data is restricted to Kere team members who need it to perform their role.',
            'Despite our efforts, no system is completely secure. If you suspect unauthorised access to your account, contact us immediately.',
        ],
    },
    {
        title: '7. Your Rights',
        content: [
            'Access: You can request a copy of the personal data we hold about you.',
            'Correction: You can update your account details at any time from your dashboard.',
            'Deletion: You can request deletion of your account and personal data.',
            'Portability: You can request your data in a portable format.',
            'To exercise any of these rights, contact us at hello@kere.com.',
        ],
    },
    {
        title: '8. Contact',
        content: [
            'Kere — Tbilisi, Georgia',
            'Email: hello@kere.com',
            'For privacy-related enquiries, please include "Privacy" in the subject line.',
        ],
    },
];

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white">
            <Navigation />

            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Legal</p>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Privacy Policy</h1>
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
                        This Privacy Policy explains how Kere ("we", "us", "our") collects, uses, and protects the personal information
                        you provide when using our platform. By creating an account or placing an order on Kere, you agree to this policy.
                    </motion.p>

                    <div className="space-y-10">
                        {sections.map((s, i) => (
                            <motion.div
                                key={s.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
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
