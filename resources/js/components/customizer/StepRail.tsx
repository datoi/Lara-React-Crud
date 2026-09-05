import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface RailStep {
    /** i18n key for the step's short name */
    tKey: string;
    /** True once the customer may jump here — earlier steps, and the one they are on */
    reachable: boolean;
}

interface StepRailProps {
    steps: RailStep[];
    step: number;
    onStep: (step: number) => void;
    onExit: () => void;
}

/**
 * The designer's spine: the five steps, numbered, always on screen.
 *
 * Vertical and pinned on desktop; below the two-column breakpoint it becomes a
 * horizontal strip above the content, since a 146px column of a phone's width
 * is a third of the screen. The numbers carry the progress either way, so the
 * strip drops the labels rather than scrolling them.
 */
export default function StepRail({ steps, step, onStep, onExit }: StepRailProps) {
    const { t } = useTranslation();

    return (
        <div className="sticky top-0 z-20 flex shrink-0 flex-row items-center gap-1 overflow-x-auto bg-[var(--kd-burgundy)] px-4 py-3 min-[900px]:h-screen min-[900px]:w-[146px] min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:gap-1 min-[900px]:overflow-visible min-[900px]:px-0 min-[900px]:py-0">
            <div className="kd-display shrink-0 pr-4 text-[22px] tracking-[0.14em] text-[var(--kd-rail-text)] min-[900px]:pl-[22px] min-[900px]:pr-0 min-[900px]:pt-[26px] min-[900px]:text-[30px]">
                KERE
            </div>

            <div className="flex flex-row gap-1 min-[900px]:mt-[54px] min-[900px]:flex-col">
                {steps.map((railStep, i) => {
                    const isActive = i === step;
                    return (
                        <button
                            key={railStep.tKey}
                            type="button"
                            onClick={() => onStep(i)}
                            disabled={!railStep.reachable}
                            aria-current={isActive ? 'step' : undefined}
                            className={[
                                'relative flex shrink-0 items-center justify-between gap-3 px-3 py-2 text-left transition-colors duration-150',
                                'min-[900px]:min-h-[52px] min-[900px]:py-[15px] min-[900px]:pl-[22px] min-[900px]:pr-[14px]',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kd-rail-text)] focus-visible:ring-inset',
                                isActive ? 'bg-black/[0.16] text-[var(--kd-rail-text)]' : 'text-[var(--kd-rail-text)]/50',
                                railStep.reachable ? 'cursor-pointer hover:text-[var(--kd-rail-text)]' : 'cursor-not-allowed',
                            ].join(' ')}
                        >
                            <span className="flex items-baseline gap-3">
                                <span className="kd-display text-[19px] tabular-nums min-[900px]:text-[21px]">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="hidden text-sm min-[900px]:inline">{t(railStep.tKey)}</span>
                            </span>
                            {isActive && (
                                <span className="absolute right-0 hidden h-[22px] w-[3px] bg-[var(--kd-rail-text)] min-[900px]:block" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="hidden flex-1 min-[900px]:block" />

            {/* The strip drops the label on a phone, which left the icon alone as
                a 14px target — the one control on the page under the 44px
                minimum. Padding carries the touch area instead, and the label
                stays the accessible name either way. */}
            <button
                type="button"
                onClick={onExit}
                aria-label={t('designer.exit')}
                className="-mr-2 ml-auto flex h-11 w-11 shrink-0 items-center justify-center gap-2 text-[13px] text-[var(--kd-rail-text)]/70 transition-colors duration-150 hover:text-[var(--kd-rail-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kd-rail-text)] min-[900px]:mr-0 min-[900px]:ml-0 min-[900px]:h-auto min-[900px]:w-auto min-[900px]:justify-start min-[900px]:px-[22px] min-[900px]:pb-[26px]"
            >
                <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
                <span className="hidden min-[900px]:inline">{t('designer.exit')}</span>
            </button>
        </div>
    );
}
