/**
 * DesignerWizard — the guided designer.
 *
 * Five steps down a burgundy rail: the garment, its shape, its details, its
 * colour, then a review. One question at a time on the left, the garment held
 * on the right the whole way, and the running total pinned to the footer so the
 * price is never more than a glance away from the choice that changes it.
 *
 * The steps are fixed but their contents are not: attributes come from the
 * catalogue, so a garment with different attributes fills the same five steps.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { viewImageUrl } from './PreviewCanvas';
import ReviewSheet, { type ReviewRow } from './ReviewSheet';
import SaveDesignModal from './SaveDesignModal';
import StagePanel from './StagePanel';
import StepRail from './StepRail';
import { ColorFigure, OptionTile, TileGroup } from './WizardTiles';
import { GarmentMark } from './GarmentIcons';
import { depictsSelection } from './depicts';
import { garmentColors } from './garmentColors';
import { money } from './money';
import { useCustomizer } from '../../hooks/useCustomizer';
import { categoriesFor, type GarmentCategory } from '../../data/garmentTaxonomy';
import type { Section } from '../../hooks/useSection';
import type {
    CustomizerProduct,
    DesignConfiguration,
    Fabric,
    GarmentView,
    LayerCategory,
} from '../../types/customizer';

/** A garment as the style step lists it. */
export interface WizardProduct {
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string;
    base_price: number;
    preview_image_url: string | null;
}

const STEP_KEYS = [
    'designer.stepGarment',
    'designer.stepShape',
    'designer.stepDetails',
    'designer.stepFabric',
    'designer.stepFit',
] as const;

const STEP_GARMENT = 0;
const STEP_SHAPE   = 1;
const STEP_DETAILS = 2;
const STEP_FABRIC  = 3;
const STEP_REVIEW  = 4;

/**
 * The attributes that describe the silhouette rather than a detail of it.
 *
 * Attributes are catalogue data and differ per garment, so the split is by slug
 * with everything unlisted falling through to Details — a garment that gains an
 * attribute lands it in step 03 rather than in no step at all.
 */
const SHAPE_SLUGS = new Set(['fit', 'length', 'silhouette', 'rise', 'waist']);

interface DesignerWizardProps {
    section: Section;
    /** The heading being browsed, once the customer has picked one */
    category?: GarmentCategory;
    onSelectCategory: (category: GarmentCategory) => void;
    onSwitchSection: (section: Section) => void;
    /** Leaves the guided flow for the upload-your-own-design branch */
    onUpload: () => void;
    /** Garments filed under the open heading */
    products: WizardProduct[];
    productsLoading: boolean;
    productsError: string | null;
    /** The garment being designed, once one is chosen and loaded */
    product: CustomizerProduct | null;
    /** The garment the customer has clicked, which the tile marks before its catalogue arrives */
    selectedSlug: string | null;
    layerCategories: LayerCategory[];
    fabrics: Fabric[];
    savedConfiguration?: DesignConfiguration | null;
    onSelectProduct: (product: WizardProduct) => void;
    /** Step is owned above so choosing a garment — which remounts this — keeps it */
    step: number;
    onStep: (step: number) => void;
    onExit: () => void;
    onOrder: (configuration: DesignConfiguration, totalPrice: number) => void;
}

export default function DesignerWizard({
    section,
    category,
    onSelectCategory,
    onSwitchSection,
    onUpload,
    products,
    productsLoading,
    productsError,
    product,
    selectedSlug,
    layerCategories,
    fabrics,
    savedConfiguration,
    onSelectProduct,
    step,
    onStep,
    onExit,
    onOrder,
}: DesignerWizardProps) {
    const { t } = useTranslation();

    const {
        selections,
        colorName,
        fabricId,
        selectOption,
        selectColorByName,
        selectFabric,
        reset,
        getConfiguration,
        totalPrice,
        resolveOption,
        resolveColor,
    } = useCustomizer({
        basePrice: product?.base_price ?? 0,
        layerCategories,
        fabrics,
        persistKey: product?.slug,
        savedConfiguration,
    });

    const [view, setView] = useState<GarmentView>('front');
    const [saveOpen, setSaveOpen] = useState(false);
    const [savedName, setSavedName] = useState<string | null>(null);
    const savedTimer = useRef(0);
    useEffect(() => () => window.clearTimeout(savedTimer.current), []);
    // What the stage caption reads while the customer is inside a step. Cleared
    // on every step change so it never describes a question they have left.
    const [caption, setCaption] = useState<string | null>(null);

    useEffect(() => { setCaption(null); }, [step]);

    const selectedFabric = fabrics.find(f => f.id === fabricId) ?? null;

    // ── Photography ─────────────────────────────────────────────────────────
    // Unchanged from the single-screen customizer: the canvas only shows a
    // photograph that is a picture of the garment as specified.

    const hasPreviewLayers = layerCategories.some(c =>
        c.slug !== 'collar' && c.is_preview_layer !== false && c.options.some(o => o.image_url),
    );

    const previewOptions = useMemo(() => layerCategories
        .filter(c => c.slug !== 'collar' && c.is_preview_layer !== false)
        .map(c => resolveOption(c)),
        [layerCategories, resolveOption]);

    const shownOptions = useMemo(
        () => previewOptions.filter((o): o is NonNullable<typeof o> => o !== null),
        [previewOptions],
    );

    const showPhoto = previewOptions.length > 0 && previewOptions.every(option =>
        option !== null
        && (resolveColor(option)?.image_url ?? option.image_url) !== null
        && depictsSelection(option, layerCategories, selections)
        // The shoots do not all cover the same colours — the puff sleeve was
        // photographed in thirteen, none of them green. Showing the option's
        // own default instead would repaint the garment a colour the customer
        // did not choose, so the photograph is withheld exactly as it is for a
        // cut that was never shot. The colour itself still stands: it is made
        // to order, and the review and the tailor both get the one they picked.
        && (!option.colors?.length || resolveColor(option)?.name === colorName),
    );

    const renderedSources = useMemo(
        () => shownOptions.map(o => resolveColor(o) ?? o),
        [shownOptions, resolveColor],
    );

    const availableViews = useMemo((): GarmentView[] => {
        if (renderedSources.length === 0) return ['front'];
        return (['front', 'back', 'left', 'right'] as GarmentView[]).filter(v =>
            renderedSources.every(s => viewImageUrl(s, v) !== null),
        );
    }, [renderedSources]);

    const thumbnailFor = (candidate: GarmentView): string | null =>
        renderedSources.length === 1 ? viewImageUrl(renderedSources[0], candidate) : null;

    useEffect(() => {
        if (!availableViews.includes(view)) setView('front');
    }, [availableViews, view]);

    // ── Colour ──────────────────────────────────────────────────────────────
    // One colour for the garment, drawn from every option photographed in it.

    const colors = useMemo(() => garmentColors(layerCategories, shownOptions), [layerCategories, shownOptions]);
    const currentColor = colorName;

    // ── Attributes per step ─────────────────────────────────────────────────

    const shapeAttributes  = layerCategories.filter(c => SHAPE_SLUGS.has(c.slug));
    const detailAttributes = layerCategories.filter(c => !SHAPE_SLUGS.has(c.slug) && c.slug !== 'collar');

    const optionName = (attribute: LayerCategory): string => resolveOption(attribute)?.name ?? '—';

    const categories = categoriesFor(section);

    // ── Step plumbing ───────────────────────────────────────────────────────

    const railSteps = STEP_KEYS.map((tKey, i) => ({
        tKey,
        // The garment gates everything after it: there is nothing to shape or
        // detail until the customer has said what they are making.
        reachable: i === STEP_GARMENT || product !== null,
    }));

    // Nothing downstream works without a loaded garment — a Continue that walks
    // to an empty review and an inert CTA is worse than a disabled button.
    const canAdvance = product !== null;

    const advance = () => {
        if (step === STEP_REVIEW) { onOrder(getConfiguration(), totalPrice); return; }
        onStep(step + 1);
    };

    const stageEyebrow = step === STEP_GARMENT
        ? (category ? t(category.tKey) : t(`section.${section}`))
        : step === STEP_REVIEW
            ? t('customizer.total')
            : t(STEP_KEYS[step]);

    const stageTitle = (() => {
        if (step === STEP_GARMENT) return product?.name ?? t('designer.startingPoint');
        if (step === STEP_REVIEW)  return money(totalPrice);
        if (caption) return caption;
        if (step === STEP_FABRIC)  return currentColor ?? selectedFabric?.name ?? '—';
        const first = (step === STEP_SHAPE ? shapeAttributes : detailAttributes)[0];
        return first ? optionName(first) : '—';
    })();

    const reviewRows: ReviewRow[] = product
        ? [
            {
                label: t('designer.stepGarment'),
                value: product.name,
                amount: money(product.base_price),
            },
            ...layerCategories.filter(c => c.slug !== 'collar').map(attribute => {
                const option = resolveOption(attribute);
                return {
                    label: attribute.name,
                    value: option?.name ?? '—',
                    amount: option && option.price_modifier !== 0 ? money(option.price_modifier, true) : null,
                };
            }),
            {
                label: currentColor ? t('designer.groupColor') : t('designer.groupFabric'),
                value: currentColor ?? selectedFabric?.name ?? '—',
                amount: selectedFabric && selectedFabric.price_modifier !== 0
                    ? money(selectedFabric.price_modifier, true)
                    : null,
            },
        ]
        : [];

    // ── Left column ─────────────────────────────────────────────────────────

    const attributeGroups = (attributes: LayerCategory[]) => attributes.map(attribute => (
        <TileGroup key={attribute.id} label={attribute.name} value={optionName(attribute)}>
            {attribute.options.map(option => (
                <OptionTile
                    key={option.id}
                    label={option.name}
                    modifier={option.price_modifier}
                    selected={resolveOption(attribute)?.id === option.id}
                    onClick={() => { selectOption(attribute.id, option.id); setCaption(option.name); }}
                />
            ))}
        </TileGroup>
    ));

    const stepContent = () => {
        // A garment named in the URL that will not load leaves every step after
        // the first with nothing to render: no attributes, and a Continue that
        // walks to an equally empty review. Report it on the step the customer
        // is actually standing on, with the way back to the garments — the
        // garment step keeps its grid, since choosing another one is the fix.
        if (step !== STEP_GARMENT && !product) {
            if (!productsError) {
                return (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--kd-burgundy)]/55" />
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    <p className="border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-4 py-3 text-[13px] text-[var(--kd-burgundy)]">
                        {productsError}
                    </p>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => onStep(STEP_GARMENT)}
                        className="h-11 rounded-none border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-6 text-[14px] font-medium text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)] hover:bg-[var(--kd-tile)]"
                    >
                        {t('designer.backToGarments')}
                    </Button>
                </div>
            );
        }

        switch (step) {
            case STEP_GARMENT:
                return (
                    <>
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--kd-muted)]">
                                {t('section.shoppingFor')}
                            </span>
                            {(['women', 'men'] as Section[]).map(candidate => (
                                <Button
                                    key={candidate}
                                    variant={section === candidate ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => onSwitchSection(candidate)}
                                    aria-pressed={section === candidate}
                                    className={[
                                        'h-9 rounded-none px-3 text-[13px] font-normal transition-colors duration-150',
                                        section === candidate
                                            ? 'bg-[var(--kd-burgundy)] text-[var(--kd-rail-text)] hover:bg-[#5A171D]'
                                            : 'text-[var(--kd-body)] hover:bg-transparent hover:text-[var(--kd-burgundy)]',
                                    ].join(' ')}
                                >
                                    {t(`section.${candidate}`)}
                                </Button>
                            ))}
                        </div>

                        {productsError && !productsLoading && (
                            <p className="border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-4 py-3 text-[13px] text-[var(--kd-burgundy)]">
                                {productsError}
                            </p>
                        )}

                        <TileGroup label={t('designer.groupCategory')} value={category ? t(category.tKey) : null}>
                            {categories.map(entry => (
                                <OptionTile
                                    key={entry.key}
                                    label={t(entry.tKey)}
                                    selected={category?.key === entry.key}
                                    onClick={() => onSelectCategory(entry)}
                                    figure={<GarmentMark category={entry.key} className="h-10 w-[34px] flex-none" />}
                                />
                            ))}
                            <OptionTile
                                label={t('design.uploadMyDesign')}
                                selected={false}
                                onClick={onUpload}
                                figure={
                                    <span className="flex h-10 w-[34px] flex-none items-center justify-center border border-dashed border-[rgba(111,29,36,0.3)]">
                                        <Upload className="h-4 w-4 stroke-[1.4]" />
                                    </span>
                                }
                            />
                        </TileGroup>

                        {category && (
                            <TileGroup label={t('designer.groupStyle')} value={product?.name ?? null}>
                                {productsLoading && (
                                    <div className="col-span-full flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-[var(--kd-burgundy)]/55" />
                                    </div>
                                )}

                                {!productsLoading && !productsError && products.length === 0 && (
                                    <p className="col-span-full border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-4 py-3 text-[13px] text-[var(--kd-body)]">
                                        {t('design.noStyles')}
                                    </p>
                                )}

                                {!productsLoading && !productsError && products.map(entry => (
                                    <OptionTile
                                        key={entry.id}
                                        label={entry.name}
                                        selected={selectedSlug === entry.slug}
                                        onClick={() => onSelectProduct(entry)}
                                        figure={entry.preview_image_url
                                            ? <img
                                                src={entry.preview_image_url}
                                                alt=""
                                                aria-hidden="true"
                                                loading="lazy"
                                                className="h-10 w-[34px] flex-none object-contain"
                                              />
                                            : <span className="h-10 w-[34px] flex-none" />}
                                    />
                                ))}
                            </TileGroup>
                        )}
                    </>
                );

            case STEP_SHAPE:
                return attributeGroups(shapeAttributes);

            case STEP_DETAILS:
                return attributeGroups(detailAttributes);

            case STEP_FABRIC:
                if (colors.length > 0) {
                    return (
                        <TileGroup label={t('designer.groupColor')} value={currentColor} dense>
                            {colors.map(colour => (
                                <OptionTile
                                    key={colour.name}
                                    label={colour.name}
                                    selected={currentColor === colour.name}
                                    onClick={() => { selectColorByName(colour.name); setCaption(colour.name); }}
                                    figure={<ColorFigure hex={colour.hex} />}
                                />
                            ))}
                        </TileGroup>
                    );
                }
                if (fabrics.length > 0) {
                    return (
                        <TileGroup label={t('designer.groupFabric')} value={selectedFabric?.name ?? null} dense>
                            {fabrics.map(fabric => (
                                <OptionTile
                                    key={fabric.id}
                                    label={fabric.name}
                                    modifier={fabric.price_modifier}
                                    selected={fabricId === fabric.id}
                                    onClick={() => { selectFabric(fabric.id); setCaption(fabric.name); }}
                                    figure={<ColorFigure hex={fabric.color_hex} />}
                                />
                            ))}
                        </TileGroup>
                    );
                }
                return (
                    <p className="border border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-4 py-3 text-[13px] text-[var(--kd-body)]">
                        {t('designer.noColors')}
                    </p>
                );

            case STEP_REVIEW:
                return (
                    <>
                        <ReviewSheet rows={reviewRows} />
                        <div className="flex flex-wrap items-center gap-4">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={() => setSaveOpen(true)}
                                className="h-11 rounded-none border-[var(--kd-hairline)] bg-[var(--kd-tile)] px-6 text-[14px] font-medium text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)] hover:bg-[var(--kd-tile)]"
                            >
                                {t('customizer.saveDesign')}
                            </Button>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => { reset(); setCaption(null); }}
                                className="h-auto p-0 text-[13px] font-normal text-[var(--kd-muted)] underline underline-offset-4 transition-colors duration-150 hover:text-[var(--kd-burgundy)]"
                            >
                                {t('customizer.reset')}
                            </Button>
                            {savedName && (
                                <span className="text-[13px] text-[var(--kd-body)]">
                                    {t('designer.savedAs', { name: savedName })}
                                </span>
                            )}
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="kere-designer flex min-h-screen flex-col min-[900px]:grid min-[900px]:grid-cols-[146px_minmax(0,1fr)]">
            <StepRail steps={railSteps} step={step} onStep={onStep} onExit={onExit} />

            <div className="grid items-start gap-[clamp(24px,3vw,48px)] px-[clamp(20px,3vw,44px)] pb-[184px] pt-[clamp(24px,3vw,40px)] min-[900px]:pb-[120px] [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))]">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-[560px]"
                >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--kd-muted)]">
                        {t('designer.eyebrow')}
                    </div>
                    <h1 className="kd-display mt-1.5 text-[clamp(36px,6vw,68px)] leading-[0.98] tracking-[-0.015em] text-[var(--kd-burgundy)] [text-wrap:pretty]">
                        {t(`designer.headline${step}`)}
                    </h1>
                    <p className="mt-4 max-w-[34ch] text-[15px] leading-[1.5] text-[var(--kd-body)] [text-wrap:pretty]">
                        {t(`designer.subhead${step}`)}
                    </p>

                    <div className="mt-[30px] flex flex-col gap-[26px]">{stepContent()}</div>
                </motion.div>

                <StagePanel
                    layerCategories={layerCategories}
                    selections={selections}
                    selectedFabric={selectedFabric}
                    resolveOption={resolveOption}
                    resolveColor={resolveColor}
                    showPhoto={showPhoto}
                    hasPreviewLayers={hasPreviewLayers}
                    views={availableViews}
                    view={view}
                    onView={setView}
                    thumbnailFor={thumbnailFor}
                    eyebrow={stageEyebrow}
                    title={stageTitle}
                    awaitingGarment={product === null}
                />
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--kd-hairline)] bg-[var(--kd-cream)] px-[clamp(20px,3vw,44px)] py-3.5 min-[900px]:left-[146px]">
                {product && (
                    <span className="kd-display mr-auto text-xl tabular-nums text-[var(--kd-ink)] min-[900px]:text-2xl">
                        {money(totalPrice)}
                    </span>
                )}

                <span className="text-[13px] tabular-nums text-[var(--kd-body)]">
                    {t('designer.stepCounter', { step: step + 1, total: STEP_KEYS.length })}
                </span>

                {step > STEP_GARMENT && (
                    <Button
                        variant="outline"
                        size="default"
                        onClick={() => onStep(step - 1)}
                        className="h-[52px] rounded-none border-[var(--kd-hairline)] bg-transparent px-5 text-[15px] font-medium text-[var(--kd-ink)] hover:border-[var(--kd-burgundy)] hover:bg-transparent"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('designer.back')}
                    </Button>
                )}

                <Button
                    variant="default"
                    size="default"
                    disabled={!canAdvance}
                    onClick={advance}
                    className="h-[52px] rounded-none bg-[var(--kd-burgundy)] px-7 text-[15px] font-medium text-[var(--kd-rail-text)] hover:bg-[#5A171D]"
                >
                    {step === STEP_REVIEW
                        ? t('designer.chooseTailor')
                        : t('designer.continueTo', { step: t(STEP_KEYS[step + 1]) })}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            {product && (
                <SaveDesignModal
                    open={saveOpen}
                    onClose={() => setSaveOpen(false)}
                    productId={product.id}
                    configuration={getConfiguration()}
                    onSaved={name => {
                        setSavedName(name);
                        window.clearTimeout(savedTimer.current);
                        savedTimer.current = window.setTimeout(() => setSavedName(null), 4000);
                    }}
                />
            )}
        </div>
    );
}
