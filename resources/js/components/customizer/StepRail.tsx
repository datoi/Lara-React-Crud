import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
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
 * The designer's spine: five line segments, always on screen.
 *
 * Vertical and pinned on desktop; below the two-column breakpoint it becomes a
 * horizontal strip above the content, since a 146px column of a phone's width
 * is a third of the screen. The line carries progress on phones; desktop also
 * shows each short stage label.
 */
export default function StepRail({ steps, step, onStep, onExit }: StepRailProps) {
    const { t } = useTranslation();

    return (
        <div className="sticky top-0 z-20 flex shrink-0 flex-row items-center gap-1 border-b border-white/15 bg-black px-3 py-2 min-[900px]:h-screen min-[900px]:w-[118px] min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:gap-1 min-[900px]:overflow-visible min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-0 min-[900px]:py-0">
            <Link
                to="/"
                aria-label="Kere home"
                className="kd-display shrink-0 pr-3 text-[18px] tracking-[0.16em] text-[var(--kd-rail-text)] transition-opacity hover:opacity-65 min-[900px]:pl-[17px] min-[900px]:pr-0 min-[900px]:pt-[22px] min-[900px]:text-[20px]"
            >
                KERE
            </Link>

            <div className="pointer-events-none absolute bottom-[88px] left-[28px] top-[112px] hidden w-px bg-white/30 min-[900px]:block">
                <span
                    className="absolute left-0 top-0 w-px bg-white transition-[height] duration-500"
                    style={{ height: `${(step / Math.max(steps.length - 1, 1)) * 100}%` }}
                />
            </div>

            <div className="flex min-w-0 flex-1 flex-row gap-1 overflow-hidden px-1 min-[900px]:mt-10 min-[900px]:flex-col min-[900px]:justify-between min-[900px]:gap-0 min-[900px]:overflow-visible min-[900px]:px-0 min-[900px]:pb-[76px]">
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
                                'relative flex min-w-0 flex-1 items-center py-4 text-left transition-colors duration-150',
                                'min-[900px]:min-h-[48px] min-[900px]:flex-none min-[900px]:gap-3 min-[900px]:py-3 min-[900px]:pl-[23px] min-[900px]:pr-2.5',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kd-rail-text)] focus-visible:ring-inset',
                                isActive ? 'text-[var(--kd-rail-text)]' : 'text-[var(--kd-rail-text)]/45',
                                railStep.reachable ? 'cursor-pointer hover:text-[var(--kd-rail-text)]' : 'cursor-not-allowed',
                            ].join(' ')}
                        >
                            <span className={`h-px min-w-0 flex-1 transition-colors duration-300 min-[900px]:relative min-[900px]:z-10 min-[900px]:h-3 min-[900px]:w-3 min-[900px]:flex-none min-[900px]:rounded-full min-[900px]:ring-2 min-[900px]:ring-black ${i <= step ? 'bg-white min-[900px]:ring-white' : 'bg-white/25 min-[900px]:ring-white/30'}`} />
                            <span className={`hidden min-w-0 text-[9px] leading-tight tracking-[0.01em] [overflow-wrap:anywhere] min-[900px]:inline ${isActive ? 'text-white' : ''}`}>{t(railStep.tKey)}</span>
                        </button>
                    );
                })}
            </div>

            {/* The strip drops the label on a phone, which left the icon alone as
                a 14px target — the one control on the page under the 44px
                minimum. Padding carries the touch area instead, and the label
                stays the accessible name either way. */}
            <button
                type="button"
                onClick={onExit}
                aria-label={t('designer.exit')}
                className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 text-[13px] text-[var(--kd-rail-text)]/70 transition-colors duration-150 hover:text-[var(--kd-rail-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kd-rail-text)] min-[900px]:ml-0 min-[900px]:h-auto min-[900px]:w-auto min-[900px]:justify-start min-[900px]:gap-1.5 min-[900px]:px-[11px] min-[900px]:pb-[26px]"
            >
                <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
                <span className="hidden min-w-0 [overflow-wrap:anywhere] min-[900px]:inline">{t('designer.exit')}</span>
            </button>
        </div>
    );
}
