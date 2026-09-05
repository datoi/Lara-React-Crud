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
    /** Small-caps line above the caption — the step the customer is on */
    eyebrow: string;
    /** What the garment currently reads as */
    title: string;
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
    eyebrow,
    title,
    awaitingGarment,
}: StagePanelProps) {
    const { t } = useTranslation();

    // Before a garment is chosen there is nothing to composite. The stage reads
    // as the drafting sheet the garment will be cut from, with the heading the
    // customer has started from named against it.
    if (awaitingGarment) {
        return (
            <div className="relative flex min-h-[380px] flex-col justify-center overflow-hidden border border-[rgba(111,29,36,0.16)] bg-[var(--kd-stage)] p-[clamp(18px,2vw,28px)] min-[900px]:min-h-[calc(100vh-200px)]">
                <PatternPaper className="pointer-events-none absolute inset-0 h-full w-full text-[rgba(111,29,36,0.16)]" />

                <div className="relative ml-auto w-full max-w-[22ch] text-right">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--kd-muted)]">{eyebrow}</div>
                    <div className="kd-display mt-1 text-[clamp(24px,4.4vw,38px)] leading-[1.08] text-[var(--kd-burgundy)] [overflow-wrap:anywhere] [text-wrap:balance]">
                        {title}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col border border-[rgba(111,29,36,0.16)] bg-[var(--kd-stage)] p-[clamp(18px,2vw,28px)] min-[900px]:min-h-[calc(100vh-200px)]">
            <div className="relative flex min-h-[380px] flex-1 items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(90deg, rgba(111,29,36,0.13) 0 1px, transparent 1px 46px),' +
                            'repeating-linear-gradient(0deg, rgba(111,29,36,0.09) 0 1px, transparent 1px 46px)',
                    }}
                />

                {/* The studio photographs are opaque — palette PNGs with the
                    white backdrop baked in — so the garment cannot sit on the
                    pattern paper directly. It is mounted as a plate instead,
                    which reads as a photograph pinned to the draft rather than
                    as a rectangle that failed to knock out. */}
                <div className={[
                    'relative w-[min(88%,420px)]',
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
                        <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 border border-dashed border-[rgba(111,29,36,0.34)] px-6 text-center">
                            <span className="flex h-11 w-11 items-center justify-center border border-[var(--kd-hairline)] text-[var(--kd-muted)]">
                                <ImageOff className="h-5 w-5 stroke-[1.4]" />
                            </span>
                            <p className="kd-display text-[22px] leading-[1.1] text-[var(--kd-burgundy)]">
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
                <div className="relative mt-4">
                    <ViewSwitcher views={views} view={view} onChange={onView} thumbnailFor={thumbnailFor} />
                </div>
            )}

            <div className="flex items-end justify-between gap-6 px-1 pt-[22px]">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--kd-muted)]">{eyebrow}</div>
                    <div className="kd-display max-w-[12ch] text-[30px] leading-[1.1] text-[var(--kd-burgundy)] [text-wrap:pretty]">
                        {title}
                    </div>
                </div>
            </div>
        </div>
    );
}
