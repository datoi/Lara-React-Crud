import { ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PatternPaper from './PatternPaper';
import PreviewCanvas from './PreviewCanvas';
import ViewSwitcher from './ViewSwitcher';
import type { Fabric, GarmentView, LayerCategory, LayerOption, OptionColor } from '../../types/customizer';

interface StagePanelProps {
    layerCategories: LayerCategory[];
    selections: Record<number, number>;
    selectedFabric: Fabric | null;
    resolveOption: (category: LayerCategory) => LayerOption | null;
    resolveColor: (option: LayerOption) => OptionColor | null;
    /** Whether the photography answers the garment as currently specified */
    showPhoto: boolean;
    /** Whether this garment has been photographed at all — picks the placeholder wording */
    hasPreviewLayers: boolean;
    views: GarmentView[];
    view: GarmentView;
    onView: (view: GarmentView) => void;
    thumbnailFor: (view: GarmentView) => string | null;
    /**
     * No garment chosen yet. The stage has nothing to render and nothing to
     * apologise for, so it shows the drafting sheet and names the heading the
     * customer is starting from rather than a placeholder that failed to load.
     */
    awaitingGarment: boolean;
}

/**
 * The garment, held on screen for the whole walk through the steps.
 *
 * Pattern paper behind the render, so an unphotographed configuration still
 * looks like a garment being drafted rather than a picture that failed to load.
 */
export default function StagePanel({
    layerCategories,
    selections,
    selectedFabric,
    resolveOption,
    resolveColor,
    showPhoto,
    hasPreviewLayers,
    views,
    view,
    onView,
    thumbnailFor,
    awaitingGarment,
}: StagePanelProps) {
    const { t } = useTranslation();

    // Before a garment is chosen there is nothing to composite. The stage reads
    // as the drafting sheet the garment will be cut from, with the heading the
    // customer has started from named against it.
    if (awaitingGarment) {
        return (
            <div className="order-3 relative flex min-h-[260px] flex-col justify-center overflow-hidden border border-black/15 bg-[var(--kd-stage)] p-[clamp(14px,2vw,28px)] min-[900px]:order-none min-[900px]:sticky min-[900px]:top-6 min-[900px]:min-h-[calc(100vh-152px)]">
                <PatternPaper className="pointer-events-none absolute inset-0 h-full w-full text-black/10" />

            </div>
        );
    }

    return (
        <div className="order-1 sticky top-[61px] z-10 flex max-h-[34vh] flex-col overflow-hidden border border-black/15 bg-[var(--kd-stage)] p-2 shadow-[0_8px_24px_rgba(17,17,17,0.08)] min-[900px]:order-none min-[900px]:top-6 min-[900px]:z-auto min-[900px]:max-h-none min-[900px]:min-h-[calc(100vh-152px)] min-[900px]:p-[clamp(18px,2vw,28px)] min-[900px]:shadow-none">
            <div className="relative flex min-h-[145px] flex-1 items-center justify-center overflow-hidden min-[900px]:min-h-[340px]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(90deg, rgba(17,17,17,0.08) 0 1px, transparent 1px 46px),' +
                            'repeating-linear-gradient(0deg, rgba(17,17,17,0.055) 0 1px, transparent 1px 46px)',
                    }}
                />

                {/* The studio photographs are opaque — palette PNGs with the
                    white backdrop baked in — so the garment cannot sit on the
                    pattern paper directly. It is mounted as a plate instead,
                    which reads as a photograph pinned to the draft rather than
                    as a rectangle that failed to knock out. */}
                <div className={[
                    'relative w-[min(48%,170px)] min-[900px]:w-[min(88%,420px)]',
                    showPhoto ? 'border border-[var(--kd-hairline)] bg-white' : '',
                ].join(' ')}>
                    {showPhoto ? (
                        <PreviewCanvas
                            layerCategories={layerCategories}
                            selections={selections}
                            selectedFabric={selectedFabric}
                            view={view}
                            resolveOption={resolveOption}
                            resolveColor={resolveColor}
                            bare
                        />
                    ) : (
                        <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 border border-dashed border-black/30 px-6 text-center">
                            <span className="flex h-11 w-11 items-center justify-center border border-[var(--kd-hairline)] text-[var(--kd-muted)]">
                                <ImageOff className="h-5 w-5 stroke-[1.4]" />
                            </span>
                            <p className="kd-display text-[22px] leading-[1.1] text-black">
                                {t('customizer.previewComingSoon')}
                            </p>
                            <p className="max-w-[24ch] text-xs leading-relaxed text-[var(--kd-body)]">
                                {hasPreviewLayers
                                    ? t('customizer.previewOptionsSoon')
                                    : t('customizer.previewGarmentSoon')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showPhoto && (
                <div className="relative mt-2 hidden min-[900px]:block">
                    <ViewSwitcher views={views} view={view} onChange={onView} thumbnailFor={thumbnailFor} />
                </div>
            )}

        </div>
    );
}
