/**
 * ViewSwitcher — rotate the garment preview between available camera angles.
 *
 * Renders nothing when only the front view exists for the current selection,
 * so products (or colors) without back/side photos never show the control.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
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
}

export default function ViewSwitcher({ views, view, onChange }: ViewSwitcherProps) {
    const { t } = useTranslation();

    if (views.length <= 1) return null;

    const index = Math.max(0, views.indexOf(view));
    const step = (delta: number) =>
        onChange(views[(index + delta + views.length) % views.length]);

    // Deliberately chrome-free: it sits directly under the garment as a caption
    // for it, so a card and outlined buttons would compete with the photo.
    return (
        <div className="flex items-center justify-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => step(-1)}
                aria-label={t('customizer.viewPrev')}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="min-w-[5.5rem] select-none text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {t(VIEW_LABEL_KEYS[views[index]])}
            </span>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => step(1)}
                aria-label={t('customizer.viewNext')}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
