import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { User, Scissors, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/landing/Navigation';

export default function RoleSelection() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#111111] text-white">
            <Navigation />

            <main data-nav-theme="dark" className="grid min-h-screen lg:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)]">
                <section className="flex min-h-screen flex-col bg-[#080808] px-5 pb-6 pt-24 sm:px-8 lg:px-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-1 flex-col justify-center py-12"
                    >
                        <h1 className="max-w-[500px] font-serif text-[clamp(1.9rem,3.9vw,3.9rem)] font-medium leading-[0.94] tracking-[-0.04em] text-white">
                            {t('signIn.pageTitle')}
                        </h1>
                        <div className="mt-10 grid gap-px border border-white/18 bg-white/18">
                            <motion.button
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => navigate('/login/customer')}
                                className="group bg-[#080808] p-5 text-left transition-colors duration-300 hover:bg-white hover:text-[#080808] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#080808] sm:p-6"
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-11 w-11 items-center justify-center border border-current text-current">
                                            <User className="h-5 w-5 stroke-[1.5]" />
                                        </span>
                                        <div>
                                            <p className="font-serif text-xl font-medium leading-none tracking-[-0.03em] sm:text-2xl">
                                                {t('signIn.customerTitle')}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => navigate('/login/tailor')}
                                className="group bg-[#080808] p-5 text-left transition-colors duration-300 hover:bg-white hover:text-[#080808] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#080808] sm:p-6"
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-11 w-11 items-center justify-center border border-current text-current">
                                            <Scissors className="h-5 w-5 stroke-[1.5]" />
                                        </span>
                                        <div>
                                            <p className="font-serif text-xl font-medium leading-none tracking-[-0.03em] sm:text-2xl">
                                                {t('signIn.tailorTitle')}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>

                    <p className="max-w-[520px] border-t border-white/15 pt-5 text-[11px] leading-5 text-white/52">
                        {t('signIn.agreePrefix')}{' '}
                        <Link to="/terms-of-service" className="font-semibold text-white underline-offset-4 hover:underline">
                            {t('signIn.termsOfService')}
                        </Link>{' '}
                        {t('signIn.and')}{' '}
                        <Link to="/privacy-policy" className="font-semibold text-white underline-offset-4 hover:underline">
                            {t('signIn.privacyPolicy')}
                        </Link>.
                    </p>
                </section>

                <section className="relative hidden min-h-screen overflow-hidden bg-[#111111] lg:block">
                    <img
                        src="/assets/auth/signin-side.png"
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#080808]/20" />
                </section>
            </main>
        </div>
    );
}
