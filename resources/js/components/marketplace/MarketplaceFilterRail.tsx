import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface FacetOption {
    /** The value the API filters on */
    value: string;
    label: string;
    /** Hex fill for the round swatch shown ahead of the label */
    swatch?: string;
}

export interface Facet {
    /** Stable key for React, and the kind a chip names when it mirrors a selection */
    key: string;
    label: string;
    options: FacetOption[];
    /** Selected values; the category facet only ever holds one */
    selected: string[];
    onToggle: (value: string) => void;
    /**
     * Column classes. The design lays the rail out at 252px, so these are the
     * counts it draws at; below the two-column breakpoint the rail runs the
     * full page width and the facets spread rather than stretch.
     */
    columns: string;
    /**
     * How a row states itself. 'row' is a checkbox and a label; 'swatch' leads
     * with the colour instead, and 'chip' is a centred label — at four columns
     * of a 252px rail a 16px box would leave a size nothing to be written in.
     * Either way the burgundy fill is what says a value is selected.
     */
    variant?: 'row' | 'swatch' | 'chip';
    /**
     * Present only when the facet's options failed to load. The block shows a
     * retry in place of an empty grid, so a failed fetch reads as a failure
     * rather than as a category list that happens to be empty.
     */
    onRetry?: () => void;
}

interface MarketplaceFilterRailProps {
    facets: Facet[];
    priceMax: number;
    onPriceChange: (value: number) => void;
    /** Governs the clear button, which is absent while nothing is selected */
    hasActiveFilters: boolean;
    onClear: () => void;
}

/**
 * Every facet, always visible.
 *
 * The rail replaces five dropdown menus, so the whole filter model is legible
 * at a glance rather than behind a click each. Below 1024px it stops being a
 * column beside the grid and becomes a block above it — the full set unrolled
 * there would be most of a phone screen before the first product, so it
 * collapses behind its own heading, and the chips above the grid keep any
 * active selection visible while it is shut.
 */
export default function MarketplaceFilterRail({ facets, priceMax, onPriceChange, hasActiveFilters, onClear }: MarketplaceFilterRailProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const panelId = useId();

    const heading = <span className="kd-display text-[24px] leading-none text-[var(--kd-burgundy)]">{t('marketplace.filtersLabel')}</span>;

    return (
        <div className="border border-[var(--kd-rule)] bg-[var(--kd-tile)] px-5 py-[18px] lg:sticky lg:top-[74px] lg:max-h-[calc(100vh-98px)] lg:overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--kd-rule)] pb-3.5">
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex min-h-10 items-center gap-2 text-left lg:hidden"
                >
                    {heading}
                    <ChevronDown className={`h-4 w-4 text-[var(--kd-burgundy)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
                </button>
                <span className="hidden lg:block">{heading}</span>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="shrink-0 text-[13px] text-[var(--kd-muted)] transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                    >
                        {t('marketplace.clearFilters')}
                    </button>
                )}
            </div>

            <div id={panelId} className={`${open ? 'block' : 'hidden'} lg:block`}>
                {facets.map((facet) => (
                    <div key={facet.key} className="border-b border-[var(--kd-rule-soft)] py-[18px]">
                        <div className="pb-3 text-[11px] tracking-[0.14em] text-[var(--kd-muted)] uppercase">{facet.label}</div>
                        {facet.onRetry ? (
                            <button
                                type="button"
                                onClick={facet.onRetry}
                                className="inline-flex min-h-10 items-center border border-[var(--kd-rule)] px-3 text-[13px] text-[var(--kd-body)] transition-colors duration-150 hover:border-[var(--kd-burgundy)] hover:text-[var(--kd-burgundy)]"
                            >
                                {t('errorFallback.retry')}
                            </button>
                        ) : (
                        <div className={`grid gap-1.5 ${facet.columns}`}>
                            {facet.options.map((option) => {
                                const selected = facet.selected.includes(option.value);
                                const variant = facet.variant ?? 'row';
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => facet.onToggle(option.value)}
                                        aria-pressed={selected}
                                        className={[
                                            'flex min-h-10 cursor-pointer items-center gap-2 border py-[7px] transition-colors duration-150',
                                            'focus-visible:ring-2 focus-visible:ring-[var(--kd-burgundy)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--kd-tile)] focus-visible:outline-none',
                                            variant === 'chip' ? 'justify-center px-1.5 text-[13px]' : 'px-[9px] text-left text-[14px]',
                                            selected
                                                ? 'border-[var(--kd-burgundy)] bg-[var(--kd-burgundy)] text-[var(--kd-rail-text)]'
                                                : 'border-[var(--kd-rule)] text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)]',
                                        ].join(' ')}
                                    >
                                        {variant === 'row' && (
                                            <span
                                                className={`flex h-4 w-4 flex-none items-center justify-center border ${
                                                    selected ? 'border-[#f6ece6]/75 bg-black/[0.18]' : 'border-[rgba(111,29,36,0.42)]'
                                                }`}
                                            >
                                                {selected && <span className="h-[7px] w-[7px] bg-[var(--kd-rail-text)]" />}
                                            </span>
                                        )}
                                        {variant === 'swatch' && option.swatch && (
                                            <span
                                                className="h-[15px] w-[15px] flex-none rounded-full border border-black/[0.18]"
                                                style={{ backgroundColor: option.swatch }}
                                            />
                                        )}
                                        <span className={variant === 'chip' ? 'tabular-nums' : 'min-w-0 flex-1 [overflow-wrap:anywhere]'}>
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        )}
                    </div>
                ))}

                <div className="pt-[18px] pb-1">
                    <div className="flex items-baseline justify-between gap-2.5 pb-3.5">
                        <span className="text-[11px] tracking-[0.14em] text-[var(--kd-muted)] uppercase">{t('marketplace.maxPrice')}</span>
                        <span className="text-[14px] text-[var(--kd-ink)] tabular-nums">
                            {priceMax < 500 ? `₾${priceMax}` : t('marketplace.maxPriceAny')}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={50}
                        max={500}
                        step={10}
                        value={priceMax}
                        onChange={(event) => onPriceChange(+event.target.value)}
                        aria-label={t('marketplace.maxPrice')}
                        className="h-0.5 w-full accent-[var(--kd-burgundy)]"
                    />
                    <div className="flex justify-between pt-2 text-[12px] text-[var(--kd-muted)] tabular-nums">
                        <span>₾50</span>
                        <span>₾500+</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
