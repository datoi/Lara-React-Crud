import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type OrderTab = 'new' | 'sent' | 'mine';

const TABS: { id: OrderTab; label: string }[] = [
    { id: 'new', label: 'tailorComponents.tabNew' },
    { id: 'sent', label: 'tailorComponents.tabSent' },
    { id: 'mine', label: 'tailorComponents.tabMine' },
];

interface Props {
    active: OrderTab;
    onChange: (tab: OrderTab) => void;
    /** A count per tab once it has loaded; null shows none. */
    counts: Record<OrderTab, number | null>;
    /** Every panel stays mounted, so each tab's count is known before it is opened. */
    panels: Record<OrderTab, ReactNode>;
}

/**
 * The tailor's three lists of work as tabs (the CEO's request, 2026-11-08):
 * new requests, the estimates they sent, and their orders. Arrow keys move
 * between tabs, as a tab list should.
 */
export function OrderTabs({ active, onChange, counts, panels }: Props) {
    const { t } = useTranslation();
    const buttons = useRef<Record<OrderTab, HTMLButtonElement | null>>({ new: null, sent: null, mine: null });

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const index = TABS.findIndex((tab) => tab.id === active);
        const next = TABS[(index + step + TABS.length) % TABS.length].id;
        onChange(next);
        buttons.current[next]?.focus();
    };

    return (
        <section aria-label={t('tailorComponents.tabsLabel')}>
            <div role="tablist" aria-label={t('tailorComponents.tabsLabel')} onKeyDown={onKeyDown} className="mb-4 grid grid-cols-3 border-b border-slate-200">
                {TABS.map(({ id, label }) => {
                    const selected = id === active;
                    return (
                        <button
                            key={id}
                            ref={(el) => { buttons.current[id] = el; }}
                            type="button"
                            role="tab"
                            id={`order-tab-${id}`}
                            aria-selected={selected}
                            aria-controls={`order-panel-${id}`}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => onChange(id)}
                            className={`-mb-px flex min-h-12 flex-col items-center justify-center gap-1 border-b-2 px-2 py-2 text-center text-sm font-medium leading-tight transition-colors sm:flex-row sm:gap-2 ${
                                selected ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <span>{t(label)}</span>
                            {counts[id] !== null && (
                                <span className={`min-w-6 rounded-full px-1.5 text-xs tabular-nums ${selected ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {counts[id]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            {TABS.map(({ id }) => (
                <div
                    key={id}
                    role="tabpanel"
                    id={`order-panel-${id}`}
                    aria-labelledby={`order-tab-${id}`}
                    hidden={id !== active}
                >
                    {panels[id]}
                </div>
            ))}
        </section>
    );
}
