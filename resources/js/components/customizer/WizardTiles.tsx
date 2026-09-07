import type { ReactNode } from 'react';
import { money } from './money';

interface OptionTileProps {
    label: string;
    /** Surcharge in lari; 0 renders nothing, so a default configuration is quiet */
    modifier?: number;
    /** Swatch, cut-out or icon shown ahead of the label */
    figure?: ReactNode;
    selected: boolean;
    onClick: () => void;
}

/**
 * One answer to the question the step is asking.
 *
 * Square, flat and hairline-bordered — the tile states its own price rather
 * than making the customer read the total change after the fact. Hover moves
 * the border only: nothing lifts, nothing shadows.
 */
export function OptionTile({ label, modifier = 0, figure, selected, onClick }: OptionTileProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={[
                'flex min-h-11 cursor-pointer items-center gap-2 px-2.5 py-2 text-left transition-colors duration-150 min-[900px]:min-h-[54px] min-[900px]:gap-2.5 min-[900px]:px-3 min-[900px]:py-2.5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kd-burgundy)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--kd-cream)]',
                selected
                    ? 'border border-[var(--kd-burgundy)] bg-[var(--kd-burgundy)] text-[var(--kd-rail-text)]'
                    : 'border border-[var(--kd-hairline)] bg-[var(--kd-tile)] text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)]',
            ].join(' ')}
        >
            {figure}
            <span className="min-w-0 flex-1 text-xs leading-[1.2] [overflow-wrap:anywhere] min-[900px]:text-sm">{label}</span>
            {modifier !== 0 && (
                <span
                    className={[
                        'flex-none text-xs tabular-nums',
                        selected ? 'text-[var(--kd-rail-text)]/80' : 'text-[var(--kd-muted)]',
                    ].join(' ')}
                >
                    {money(modifier, true)}
                </span>
            )}
        </button>
    );
}

interface TileGroupProps {
    /** Small-caps label on the left of the head row */
    label: string;
    /** What the group currently reads as, on the right of the head row */
    value?: string | null;
    /** Narrower track for round swatches, which need less room than a worded option */
    dense?: boolean;
    hideHeader?: boolean;
    children: ReactNode;
}

/** One attribute: its name, the answer it is currently on, and its tiles. */
export function TileGroup({ label, value, dense = false, hideHeader = false, children }: TileGroupProps) {
    return (
        <div>
            {!hideHeader && (
                <div className="mb-2 flex items-baseline justify-between gap-4">
                    <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--kd-muted)]">{label}</span>
                    {value && <span className="text-[13px] text-[var(--kd-body)]">{value}</span>}
                </div>
            )}
            <div
                className={
                    dense
                        ? 'grid grid-cols-2 gap-2 min-[900px]:gap-2.5 min-[900px]:[grid-template-columns:repeat(auto-fit,minmax(min(100%,132px),1fr))]'
                        : 'grid grid-cols-2 gap-2 min-[900px]:gap-2.5 min-[900px]:[grid-template-columns:repeat(auto-fit,minmax(min(100%,208px),1fr))]'
                }
            >
                {children}
            </div>
        </div>
    );
}

/** The round colour chip on a fabric tile. */
export function ColorFigure({ hex }: { hex: string }) {
    return (
        <span
            className="h-7 w-7 flex-none rounded-full border border-[rgba(17,17,17,0.14)] min-[900px]:h-[34px] min-[900px]:w-[34px]"
            style={{ backgroundColor: hex }}
        />
    );
}
