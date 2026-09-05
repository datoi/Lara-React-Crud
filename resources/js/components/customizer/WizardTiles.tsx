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
                'flex min-h-[62px] cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kd-burgundy)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--kd-cream)]',
                selected
                    ? 'border border-[var(--kd-burgundy)] bg-[var(--kd-burgundy)] text-[var(--kd-rail-text)]'
                    : 'border border-[var(--kd-hairline)] bg-[var(--kd-tile)] text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)]',
            ].join(' ')}
        >
            {figure}
            <span className="flex-1 text-[15px] leading-[1.25]">{label}</span>
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
    children: ReactNode;
}

/** One attribute: its name, the answer it is currently on, and its tiles. */
export function TileGroup({ label, value, dense = false, children }: TileGroupProps) {
    return (
        <div>
            <div className="mb-3 flex items-baseline justify-between gap-4">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--kd-muted)]">{label}</span>
                {value && <span className="text-[13px] text-[var(--kd-body)]">{value}</span>}
            </div>
            <div
                className={
                    dense
                        ? 'grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,132px),1fr))]'
                        : 'grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,168px),1fr))]'
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
            className="h-[34px] w-[34px] flex-none rounded-full border border-[rgba(17,17,17,0.14)]"
            style={{ backgroundColor: hex }}
        />
    );
}
