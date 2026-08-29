import { useTranslation } from 'react-i18next';

export function JoinSection() {
    const { t } = useTranslation();
    const title = t('newsletterBanner.title');
    const [titleBeforeKere, titleAfterKere = ''] = title.split('Kere');

    const openNewsletter = () => {
        window.dispatchEvent(new Event('kere:open-newsletter'));
    };

    return (
        <section className="bg-[#f2f1ed] p-3 sm:p-4" aria-labelledby="join-kere-title">
            <div className="mx-auto grid min-h-[360px] max-w-[1500px] overflow-hidden border border-black/15 bg-[#e8e7e3] md:grid-cols-2">
                <div className="flex items-center justify-center px-6 py-12 text-center sm:px-10 md:py-16 lg:px-16">
                    <div className="max-w-xl">
                        <h2
                            id="join-kere-title"
                            aria-label={title}
                            className="flex flex-wrap items-baseline justify-center gap-x-[0.16em] font-serif text-[clamp(2rem,4vw,4rem)] font-normal leading-none tracking-[-0.035em] text-black"
                        >
                            <span>{titleBeforeKere.trim()}</span>
                            <span className="inline-flex items-baseline">
                                <span aria-hidden className="kere-nav-logo inline-block h-[0.48em]" />
                                {titleAfterKere && <span>{titleAfterKere}</span>}
                            </span>
                        </h2>
                        <p className="mx-auto mt-5 max-w-lg text-sm font-normal leading-6 text-black sm:text-base">
                            {t('newsletterBanner.description')}
                        </p>
                        <button
                            type="button"
                            onClick={openNewsletter}
                            className="mt-7 border-0 border-b border-black bg-transparent px-0 pb-1 text-xs font-normal uppercase tracking-[0.08em] text-black shadow-none transition-opacity hover:bg-transparent hover:text-black hover:opacity-50"
                            style={{ backgroundColor: 'transparent', color: '#000000' }}
                        >
                            {t('newsletterBanner.action')}
                        </button>
                    </div>
                </div>

                <div className="relative min-h-[280px] md:min-h-full">
                    <img
                        src="/assets/editorial/champagne-toast.png"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-white/10" />
                </div>
            </div>
        </section>
    );
}
