<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Undo the data half of the sleeve-fit experiment.
 *
 * The code that created these rows has been reverted, but a seeder only ever
 * adds — so every women's-tops sleeve would keep its Fitted/Relaxed sub-options,
 * and the customizer resolves a sub-option over its parent, pointing the canvas
 * at photographs that no longer exist in the repository.
 *
 * Scoped to women's tops sleeves: the men's garments use sub-options for their
 * collar variants and must not be touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        $sleeveCategories = DB::table('layer_categories')
            ->join('customizer_products', 'customizer_products.id', '=', 'layer_categories.customizer_product_id')
            ->where('customizer_products.gender', 'women')
            ->where('customizer_products.category', 'tops')
            ->where('layer_categories.slug', 'sleeves')
            ->pluck('layer_categories.id');

        if ($sleeveCategories->isNotEmpty()) {
            // Colours cascade with their option.
            DB::table('layer_options')
                ->whereIn('layer_category_id', $sleeveCategories)
                ->whereNotNull('parent_option_id')
                ->delete();

            DB::table('layer_categories')
                ->whereIn('id', $sleeveCategories)
                ->update(['children_label' => null, 'is_preview_layer' => false]);
        }

        // The short-lived standalone attribute, for any database that still has it.
        $retired = DB::table('layer_categories')
            ->join('customizer_products', 'customizer_products.id', '=', 'layer_categories.customizer_product_id')
            ->where('customizer_products.gender', 'women')
            ->where('customizer_products.category', 'tops')
            ->where('layer_categories.slug', 'sleeve-fit')
            ->pluck('layer_categories.id');

        if ($retired->isNotEmpty()) {
            DB::table('layer_categories')->whereIn('id', $retired)->delete();
        }
    }

    /**
     * Not reversible: these rows described photography that is no longer in the
     * repository, so re-creating them would point the canvas at missing files.
     */
    public function down(): void
    {
        //
    }
};
