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

    // Sized as if there were always four angles, then centred, so withholding a
    // view changes how many tiles there are but never how big they are.
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
                            'flex w-[calc(25%-0.5625rem)] cursor-pointer flex-col bg-white transition-colors',
                            isSelected
                                ? 'border border-[#111111]'
                                : 'border border-[#111111]/[0.16] hover:border-[#111111]/60',
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
                                'block px-1 text-center text-[10px] uppercase tracking-[0.06em]',
                                thumbnail ? 'pb-2' : 'py-4',
                                isSelected ? 'text-[#111111]' : 'text-[#655D55]',
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
