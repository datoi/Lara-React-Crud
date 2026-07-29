import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, Scissors, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export function CTASection() {
    const { t } = useTranslation();

    return (
        <section className="overflow-hidden bg-[#f7f6f3] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="mx-auto max-w-[1500px] border-y border-black/20 py-12 text-center sm:py-16 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="mx-auto max-w-3xl font-serif text-[clamp(1.65rem,3.1vw,3rem)] font-medium uppercase leading-[1] tracking-normal text-[#111111]">
                        {t('cta.title')}<br className="hidden sm:block" /> {t('cta.titleLine2')}
                    </h2>
                    <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-[#717171] sm:text-base">
                        {t('cta.subtitle')}
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button
                            asChild
                            variant="ghost"
                            className="min-h-[50px] w-full rounded-none border border-black/30 bg-transparent px-7 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors duration-200 hover:bg-[#111111] hover:text-white sm:w-auto"
                        >
                            <Link to="/marketplace">
                                <ShoppingBag className="h-4 w-4" />
                                {t('cta.browseMarketplace')}
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            className="min-h-[50px] w-full rounded-none border border-black/30 bg-transparent px-7 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors duration-200 hover:bg-[#111111] hover:text-white sm:w-auto"
                        >
                            <Link to="/design">
                                <Scissors className="h-4 w-4" />
                                {t('cta.designYourOwn')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
