<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Two women's-tops attributes are folded away.
 *
 * 'style' held a single option ("Classic") that existed only to own the
 * photography, and the garment itself is the style — there was never a second
 * one to choose. 'sleeve-fit' was a top-level attribute for a week; sleeve fit
 * is a property of a sleeve, so it now lives as sub-options of each sleeve
 * (see WomensTopsSeeder). Both would otherwise linger in any database that has
 * already been seeded, since the seeder only ever adds.
 */
return new class extends Migration
{
    public function up(): void
    {
        $ids = DB::table('layer_categories')
            ->join('customizer_products', 'customizer_products.id', '=', 'layer_categories.customizer_product_id')
            ->where('customizer_products.gender', 'women')
            ->where('customizer_products.category', 'tops')
            ->whereIn('layer_categories.slug', ['style', 'sleeve-fit'])
            ->pluck('layer_categories.id');

        if ($ids->isEmpty()) {
            return;
        }

        // Options and their colours are removed by the cascade on delete.
        DB::table('layer_categories')->whereIn('id', $ids)->delete();
    }

    /**
     * Not reversible: these categories carried photography paths and colour
     * rows that the seeder now writes elsewhere, so re-creating empty shells
     * would be worse than leaving them absent. Re-running the seeder restores
     * whatever the current model says should exist.
     */
    public function down(): void
    {
        //
    }
};
