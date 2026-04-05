import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        q: 'How do I place a custom clothing order?',
        a: "Browse the marketplace to find a tailor whose style matches yours, or use our custom designer to describe exactly what you want. Then submit your order and we'll connect you with the right tailor.",
    },
    {
        q: "What if the finished item doesn't fit?",
        a: "Every order includes a free revision. If there's a fit issue, your tailor will adjust it at no extra cost. If you're still not satisfied, we offer a full refund.",
    },
    {
        q: 'How long does an order take?',
        a: "Most orders are completed within 5–14 business days depending on complexity. You'll see the estimated delivery time before confirming your order.",
    },
    {
        q: 'Can I provide my own measurements?',
        a: 'Yes! Our customization forms let you enter exact measurements (chest, waist, hips, length, inseam) in centimeters for a perfect fit.',
    },
    {
        q: 'Do you deliver outside Tbilisi?',
        a: 'Yes. We deliver to all major cities across Georgia. Delivery time may vary by location.',
    },
    {
        q: 'How do I become a tailor on Kere?',
        a: 'Click "Sign In" in the navigation and choose the tailor option. Our team will review your application and onboard you within 2–3 business days.',
    },
];

export function FAQSection() {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <section id="faq" className="py-16 md:py-24 bg-slate-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-5 text-2xl">
                        ❓
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-slate-500">Everything you need to know about Kere.</p>
                </motion.div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                            >
                                <span className="font-medium text-slate-900">{faq.q}</span>
                                <motion.div
                                    animate={{ rotate: open === i ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-shrink-0"
                                >
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                </motion.div>
                            </button>
                            <AnimatePresence initial={false}>
                                {open === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <div className="px-6 pb-5 text-slate-500 leading-relaxed text-sm border-t border-slate-100 pt-4">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
