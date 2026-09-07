/**
 * ViewSwitcher — rotate the garment preview between available camera angles.
 *
 * A four-up row of tiles rather than a prev/next stepper: every angle we hold is
 * visible at once, so the customer can go straight to the one they want instead
 * of stepping past the others.
 *
 * Renders nothing when only the front view exists for the current selection, so
 * products (or colours) without back/side photos never show the control.
 */
import { useTranslation } from 'react-i18next';
import type { GarmentView } from '../../types/customizer';

const VIEW_LABEL_KEYS: Record<GarmentView, string> = {
    front: 'customizer.viewFront',
    back:  'customizer.viewBack',
    left:  'customizer.viewLeft',
    right: 'customizer.viewRight',
};

interface ViewSwitcherProps {
    views: GarmentView[];
    view: GarmentView;
    onChange: (view: GarmentView) => void;
    /**
     * Photograph for a view's tile. Returning null renders the tile as a label
     * only — a garment whose angles are not photographed still gets a switcher.
     */
    thumbnailFor?: (view: GarmentView) => string | null;
}

export default function ViewSwitcher({ views, view, onChange, thumbnailFor }: ViewSwitcherProps) {
    const { t } = useTranslation();

    if (views.length <= 1) return null;

    // Sized as a fraction of the row and centred, so withholding a view changes
    // how many tiles there are but never how big they are. Two across on a phone,
    // four once there is room for the longest angle name.
    return (
        <div className="flex flex-wrap justify-center gap-3">
            {views.map(candidate => {
                const isSelected = candidate === view;
                const label = t(VIEW_LABEL_KEYS[candidate]);
                const thumbnail = thumbnailFor?.(candidate) ?? null;

                return (
                    <button
                        key={candidate}
                        type="button"
                        onClick={() => onChange(candidate)}
                        aria-pressed={isSelected}
                        aria-label={label}
                        className={[
                            'flex w-[calc(50%-0.375rem)] cursor-pointer flex-col bg-[var(--kd-tile)] transition-colors duration-150 min-[640px]:w-[calc(25%-0.5625rem)]',
                            isSelected
                                ? 'border border-[var(--kd-burgundy)]'
                                : 'border border-[var(--kd-hairline)] hover:border-[var(--kd-burgundy)]',
                        ].join(' ')}
                    >
                        {thumbnail && (
                            <span className="block aspect-square w-full overflow-hidden">
                                <img
                                    src={thumbnail}
                                    alt=""
                                    aria-hidden="true"
                                    draggable={false}
                                    className="h-full w-full select-none object-contain object-center"
                                />
                            </span>
                        )}
                        <span
                            className={[
                                'block px-1 text-center text-[10px] uppercase leading-[1.3] tracking-[0.06em] [overflow-wrap:anywhere]',
                                thumbnail ? 'pb-2' : 'py-4',
                                isSelected ? 'text-[var(--kd-burgundy)]' : 'text-[var(--kd-muted)]',
                            ].join(' ')}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
