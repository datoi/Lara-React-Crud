import { FileText, Scissors, Sparkles } from 'lucide-react';
import PreviewCanvas from '../customizer/PreviewCanvas';
import { ProductImage } from '../marketplace/ProductImage';
import { previewCategories, resolveEffectiveOption, resolveOptionColor, showsDesign } from '../customizer/designPhoto';
import { isImageUrl, readStudioChoices, type OpenOrder, type StudioProduct } from './openOrders';

/**
 * The picture of what the customer wants: their remodel photo, the image they
 * uploaded, or their studio design photographed again from the stored choices.
 *
 * A studio design is only drawn when the photographs still show exactly what
 * was ordered — every stored choice still offered, and the same rule the
 * designer used when the customer saw it. Anything less would show the tailor
 * a garment nobody asked for, so the placeholder stands in instead.
 */
export function OpenDesignPicture({ order, product, label }: {
    order: OpenOrder;
    /** The studio product, once loaded; null when unavailable or not a studio design */
    product: StudioProduct | null;
    label: string;
}) {
    const design = order.custom_design_data;
    const isRemodel = order.order_type === 'remodel';
    const photo = isRemodel ? design?.remodel_images?.[0] : design?.design_file_url;

    // Remodel photos are always images; an uploaded design file may be a PDF.
    // An upload can outlive its file, so a failed load falls back rather than breaking.
    if (photo && (isRemodel || isImageUrl(photo))) {
        return <ProductImage src={photo} alt={label} className="h-full w-full object-cover" loading="lazy" />;
    }

    const choices = readStudioChoices(design?.customization);
    if (product && choices) {
        const categories = product.layer_categories;
        const stillOffered = previewCategories(categories).every(category => {
            const chosen = choices.selections[category.id];
            return chosen === undefined || category.options.some(o => o.id === chosen);
        });
        const resolveOption = (category: (typeof categories)[number]) =>
            resolveEffectiveOption(category, choices.selections, choices.sub_selections);
        const resolveColor = (option: Parameters<typeof resolveOptionColor>[0]) =>
            resolveOptionColor(option, choices.color_selections);

        if (stillOffered && showsDesign(categories, choices.selections, resolveOption, resolveColor, choices.color_name)) {
            return (
                <div className="flex h-full w-full items-center justify-center">
                    <PreviewCanvas
                        layerCategories={categories}
                        selections={choices.selections}
                        selectedFabric={product.fabrics.find(f => f.id === choices.fabric_id) ?? null}
                        resolveOption={resolveOption}
                        resolveColor={resolveColor}
                        bare
                    />
                </div>
            );
        }
    }

    const Icon = isRemodel ? Scissors : photo ? FileText : Sparkles;

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-50 px-3 text-center">
            <Icon className="h-7 w-7 text-slate-300" aria-hidden="true" />
            <span className="text-xs font-medium text-slate-500">{label}</span>
        </div>
    );
}
