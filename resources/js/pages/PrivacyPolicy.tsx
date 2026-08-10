import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { useTranslation } from 'react-i18next';
import { privacyPolicy } from '../data/privacyPolicy';

export default function PrivacyPolicy() {
    const { t, i18n } = useTranslation();
    const doc = privacyPolicy[i18n.language === 'ka' ? 'ka' : 'en'];

    return (
        <div className="kere-info-page min-h-screen bg-white">
            <Navigation />

            <section className="pt-24 pb-16 md:pt-28 md:pb-24 bg-slate-900 text-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">{doc.title}</h1>
                        <p className="text-slate-400 text-sm">{doc.version}</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-10">
                        {doc.sections.map((section, i) => (
                            <motion.div
                                key={section.n}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.03 }}
                            >
                                <h2 className="text-lg font-bold text-slate-900 mb-3">
                                    {section.n}. {section.title}
                                </h2>

                                <div className="space-y-3">
                                    {section.blocks.map((block, bi) =>
                                        block.type === 'p' ? (
                                            <p key={bi} className="text-sm text-slate-600 leading-relaxed">
                                                {block.text}
                                            </p>
                                        ) : (
                                            <div key={bi} className="overflow-x-auto">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr>
                                                            {block.head.map((h, hi) => (
                                                                <th
                                                                    key={hi}
                                                                    className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 align-top"
                                                                >
                                                                    {h}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {block.rows.map((row, ri) => (
                                                            <tr key={ri}>
                                                                {row.map((cell, ci) => (
                                                                    <td
                                                                        key={ci}
                                                                        className={`border border-slate-200 px-3 py-2 align-top text-slate-600 ${ci === 0 ? 'font-medium text-slate-800 whitespace-nowrap sm:whitespace-normal' : 'leading-relaxed'}`}
                                                                    >
                                                                        {cell}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
