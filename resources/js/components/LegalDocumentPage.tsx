import { useEffect, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Navigation } from './landing/Navigation';
import { Footer } from './landing/Footer';
import type { LegalBlock, LegalDocument, LegalSection } from '../types/legal';

// E-mail and web addresses in the text become links. The capture group keeps
// them in String.split's output, at the odd indices.
const ADDRESS = /(https?:\/\/[^\s]*[^\s.,;:)]|[\w.+-]+@[a-z\d]+(?:[.-][a-z\d]+)*)/i;

function Linked({ text }: { text: string }) {
    return (
        <>
            {text.split(ADDRESS).map((part, i) =>
                i % 2 === 0 ? (
                    part
                ) : (
                    <a key={i} href={/^https?:/.test(part) ? part : `mailto:${part}`} className="underline underline-offset-4 hover:text-brand">
                        {part}
                    </a>
                ),
            )}
        </>
    );
}

function Block({ block, label }: { block: LegalBlock; label: string }) {
    switch (block.type) {
        case 'p':
            return (
                <p className="text-sm leading-relaxed text-slate-600">
                    <Linked text={block.text} />
                </p>
            );
        case 'h3':
            return <h3 className="pt-3 text-slate-900">{block.text}</h3>;
        case 'ul':
        case 'ol': {
            const List = block.type;
            return (
                <List className={`space-y-2 pl-5 marker:text-brand ${List === 'ol' ? 'list-decimal' : 'list-disc'}`}>
                    {block.items.map((item, i) => (
                        <li key={i} className="pl-1 text-sm leading-relaxed text-slate-600">
                            <Linked text={item} />
                        </li>
                    ))}
                </List>
            );
        }
        case 'table':
            return (
                // Focusable so a keyboard can scroll a table wider than a phone.
                <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto border border-[#e5dfd8]">
                    <table className={`w-full border-collapse text-left text-sm ${block.head.length > 2 ? 'min-w-[40rem]' : ''}`}>
                        <thead>
                            <tr>
                                {block.head.map((cell) => (
                                    <th key={cell} scope="col" className="border-b border-[#e5dfd8] bg-slate-50 px-3 py-2 align-top font-semibold text-slate-900">
                                        {cell}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, ri) => (
                                <tr key={ri} className="border-b border-[#e5dfd8] last:border-b-0">
                                    {row.map((cell, ci) => (
                                        <td key={ci} className={`px-3 py-2 align-top leading-relaxed ${ci === 0 ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
    }
}

function Contents({ sections }: { sections: LegalSection[] }) {
    return (
        <ul className="space-y-1.5">
            {sections.map((section) => (
                <li key={section.id} className="text-sm">
                    <a href={`#${section.id}`} className="text-slate-600 underline-offset-4 hover:text-brand hover:underline">
                        {section.title}
                    </a>
                </li>
            ))}
        </ul>
    );
}

/** A long legal document on the info-page shell, with a contents list whose anchors can be linked to directly. */
export function LegalDocumentPage({ doc, children }: { doc: LegalDocument; children?: ReactNode }) {
    const { t } = useTranslation();
    const { hash } = useLocation();

    // ScrollToTop takes the route to the top after this page renders, so a link
    // straight to a section (/terms#section-15) waits a frame before landing.
    useEffect(() => {
        if (!hash) return;
        const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
        return () => cancelAnimationFrame(frame);
    }, [hash]);

    return (
        <div className="kere-info-page kere-refined-page min-h-screen bg-white">
            <Helmet>
                <title>{`${doc.title} | Kere`}</title>
                <meta name="description" content={doc.lead} />
            </Helmet>

            <Navigation />

            <section className="kere-page-intro border-b border-[#e5dfd8] pt-24 pb-8 md:pt-28 md:pb-12">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
                        <h1 className="mb-4 text-2xl font-normal md:text-4xl">{doc.title}</h1>
                        {doc.subtitle && <p className="-mt-2 mb-4 text-sm text-slate-900">{doc.subtitle}</p>}
                        <p className="text-sm leading-relaxed text-slate-600">{doc.lead}</p>
                        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                            {doc.meta.map((item) => (
                                <div key={item.label} className="flex gap-1.5">
                                    <dt>{item.label}:</dt>
                                    <dd className="text-slate-900">{item.value}</dd>
                                </div>
                            ))}
                        </dl>
                        {doc.note && <p className="mt-4 text-xs italic leading-relaxed text-slate-500">{doc.note}</p>}
                    </motion.div>
                </div>
            </section>

            <section className="py-10 md:py-14">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:px-8">
                    <nav aria-label={t('legal.contents')} className="mb-10 lg:sticky lg:top-20 lg:mb-0 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
                        <details className="border border-[#e5dfd8] lg:hidden">
                            <summary className="cursor-pointer px-4 py-3 text-sm text-slate-900">{t('legal.contents')}</summary>
                            <div className="border-t border-[#e5dfd8] px-4 py-4">
                                <Contents sections={doc.sections} />
                            </div>
                        </details>
                        <div className="hidden lg:block">
                            <p className="mb-4 text-sm text-slate-900">{t('legal.contents')}</p>
                            <Contents sections={doc.sections} />
                        </div>
                    </nav>

                    <article className="min-w-0 max-w-3xl">
                        {doc.summary && <p className="mb-10 border-l-2 border-brand bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">{doc.summary}</p>}

                        <div className="space-y-8">
                            {doc.sections.map((section) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    aria-labelledby={`${section.id}-title`}
                                    className="scroll-mt-20 border-t border-[#e5dfd8] pt-8 first:border-t-0 first:pt-0"
                                >
                                    <h2 id={`${section.id}-title`} className="mb-4 text-lg text-slate-900">
                                        {section.title}
                                    </h2>
                                    <div className="space-y-3">
                                        {section.blocks.map((block, i) => (
                                            <Block key={i} block={block} label={section.title} />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {children}
                    </article>
                </div>
            </section>

            <Footer />
        </div>
    );
}
