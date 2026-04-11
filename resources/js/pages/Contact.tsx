import { useState } from 'react';
import { motion } from 'motion/react';
import { Navigation } from '../components/landing/Navigation';
import { Footer } from '../components/landing/Footer';
import { EmailSupportModal } from '../components/EmailSupportModal';
import { MapPin, Mail, Clock, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [supportOpen, setSupportOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate send delay
        await new Promise(r => setTimeout(r, 800));
        setSent(true);
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-white">
            <EmailSupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
            <Navigation />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Contact Us</h1>
                    <p className="text-lg text-slate-500 max-w-2xl">
                        Have a question, feedback, or need help? We'd love to hear from you.
                    </p>
                </motion.div>

                <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Get in Touch</h2>
                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Email</p>
                                        <a href="mailto:dato.tadiashvili13@gmail.com" className="text-slate-500 hover:text-slate-700 transition-colors text-sm">
                                            dato.tadiashvili13@gmail.com
                                        </a>
                                        <button
                                            onClick={() => setSupportOpen(true)}
                                            className="mt-2 text-xs font-medium text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            Open Email Support
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Location</p>
                                        <p className="text-slate-500 text-sm">Tbilisi, Georgia</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Response Time</p>
                                        <p className="text-slate-500 text-sm">We reply within 24 hours on business days.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {sent ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12 border border-slate-200 rounded-2xl">
                                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                                <p className="text-slate-500">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 border border-slate-200 rounded-2xl p-8">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors resize-none"
                                        placeholder="How can we help you?"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <span>Sending…</span>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
