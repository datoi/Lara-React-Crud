<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Retire the three original photo-composite customizer products
     * (Classic Shirt, Woman Shirt, Woman's Top). Their source images were
     * removed and the line is superseded by the men's garments + Sleeveless
     * Tank line, so the stale rows would render broken 404 previews.
     *
     * layer_categories, layer_options, fabrics and saved_designs all
     * cascade on customizer_product_id, so deleting the parent clears the
     * whole tree. Orders keep garment_type as a string snapshot and are
     * unaffected.
     */
    public function up(): void
    {
        DB::table('customizer_products')
            ->whereIn('slug', ['classic-shirt', 'woman-shirt', 'womens-top'])
            ->delete();
    }

    public function down(): void
    {
        // Irreversible: the retired products' source images no longer exist,
        // so there is nothing to restore.
    }
};
