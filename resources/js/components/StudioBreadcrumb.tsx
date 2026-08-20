import { Link } from 'react-router';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from './ui/breadcrumb';

export interface StudioCrumb {
    label: string;
    /** Omitted on the final crumb — the level the customer is currently on */
    to?: string;
}

/**
 * Trail through the design studio hierarchy: Section → Category → Garment.
 *
 * Two tones because the studio spans two palettes — the paper-toned designer
 * (/design) and the white customizer (/customize/:slug).
 */
export default function StudioBreadcrumb({
    crumbs,
    tone,
    className = '',
}: {
    crumbs: StudioCrumb[];
    tone: 'paper' | 'light';
    className?: string;
}) {
    const { t } = useTranslation();

    if (crumbs.length === 0) return null;

    const palette = tone === 'paper'
        ? { link: 'text-[#776158] hover:text-[#111111]', current: 'text-[#111111]', sep: 'text-[#776158]/50' }
        : { link: 'text-slate-400 hover:text-slate-900', current: 'text-slate-900', sep: 'text-slate-300' };

    return (
        <Breadcrumb aria-label={t('design.breadcrumbLabel')} className={className}>
            <BreadcrumbList className="gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] sm:gap-1.5">
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <Fragment key={`${crumb.label}-${i}`}>
                            <BreadcrumbItem>
                                {isLast || !crumb.to ? (
                                    <BreadcrumbPage className={`font-semibold ${palette.current}`}>
                                        {crumb.label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild className={palette.link}>
                                        <Link to={crumb.to}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator className={palette.sep} />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
