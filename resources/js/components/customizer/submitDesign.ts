import { getAuthUser, saveReturnTo } from '../../hooks/useAuth';
import { saveDraft } from '../../hooks/useCustomOrderDraft';
import type { GarmentCategory } from '../../data/garmentTaxonomy';
import type { CustomizerProduct, DesignConfiguration } from '../../types/customizer';

interface SubmitDesignArgs {
    product: CustomizerProduct;
    /** The heading the garment is filed under — drives tailor matching */
    category?: GarmentCategory;
    configuration: DesignConfiguration;
    /** The total the customer was actually shown, modifiers included */
    totalPrice: number;
    navigate: (to: string) => void;
}

/**
 * Hands a finished design to the tailor-selection step.
 *
 * Shared by both ways into the designer so the draft is written identically
 * whichever door the customer came through. estimated_price is the configured
 * total they just read, not the base price — the base alone ignores every
 * modifier and can understate the garment by most of its value.
 */
export function submitDesign({ product, category, configuration, totalPrice, navigate }: SubmitDesignArgs): void {
    saveDraft({
        // garment_type is the taxonomy bucket the tailor is matched on, and
        // every Tops garment files under one key — so the order would name a
        // corset top and a hoodie identically. The garment itself travels with
        // the configuration.
        garment_type:    category?.orderKey ?? product.category,
        customization:   {
            ...(configuration as unknown as Record<string, unknown>),
            product_name: product.name,
            product_slug: product.slug,
        },
        design_file_url: null,
        estimated_price: totalPrice,
    });

    if (!getAuthUser()) {
        saveReturnTo('/design/tailor-select');
        navigate('/login/customer');
        return;
    }

    navigate('/design/tailor-select');
}
