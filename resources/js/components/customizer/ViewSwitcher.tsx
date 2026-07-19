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

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => step(-1)}
                aria-label={t('customizer.viewPrev')}
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="w-24 text-center text-xs font-medium text-slate-600 select-none">
                {t(VIEW_LABEL_KEYS[views[index]])}
            </span>

            <Button
                variant="outline"
                size="sm"
                onClick={() => step(1)}
                aria-label={t('customizer.viewNext')}
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    );
}
