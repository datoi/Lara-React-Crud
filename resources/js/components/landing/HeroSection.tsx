import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function HeroSection() {
    const { t } = useTranslation();

    return (
        <section
            data-nav-theme="dark"
            className="kere-landing-editorial-hero relative flex h-[88svh] min-h-[540px] w-full flex-col overflow-hidden bg-[#191919] bg-cover bg-center text-white sm:h-[90svh]"
            style={{ backgroundImage: "url('/assets/hero/landing-red-hanger.png')" }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/65" />

            <h1 className="kere-editorial-hero-title absolute inset-x-0 top-[clamp(7rem,24svh,12rem)] z-10 mx-auto w-full max-w-[800px] px-5 text-center font-serif text-[clamp(1.8rem,7vw,2.5rem)] leading-[1.02] font-normal tracking-[-0.03em] sm:top-1/2 sm:-translate-y-1/2 sm:text-[clamp(2rem,3.7vw,4.25rem)] sm:leading-[0.98] sm:tracking-[-0.035em]">
                {t('hero.headline')}
            </h1>

            <div className="relative z-10 mx-auto mt-auto flex w-full flex-col items-center px-5 pb-20 text-center text-white sm:pb-24 lg:pb-28">
                <div className="flex w-full max-w-[760px] flex-col justify-center gap-2.5 sm:flex-row">
                    <Link
                        to="/design"
                        className="kere-editorial-hero-action inline-flex min-h-11 w-full items-center justify-center border px-5 py-3 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors sm:flex-1"
                    >
                        {t('hero.startYourDesign')}
                    </Link>
                    <Link
                        to="/design?upload=1"
                        className="kere-editorial-hero-action inline-flex min-h-11 w-full items-center justify-center border px-5 py-3 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors sm:flex-1"
                    >
                        {t('hero.uploadYourDesign')}
                    </Link>
                    <Link
                        to="/remodel"
                        className="kere-editorial-hero-action inline-flex min-h-11 w-full items-center justify-center border px-5 py-3 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors sm:flex-1"
                    >
                        {t('hero.remodelGarment')}
                    </Link>
                </div>

                <Link to="/marketplace" className="kere-editorial-hero-shop mt-7 pb-2 text-xs font-bold tracking-[0.09em] uppercase transition-opacity hover:opacity-60">
                    {t('hero.shopNow')}
                </Link>
            </div>
        </section>
    );
}
