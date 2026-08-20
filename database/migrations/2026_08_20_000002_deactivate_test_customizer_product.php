<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * "red shirt" (slug witeli-maika, description "agwera") is a leftover admin
     * test row. It was always customer-visible under the old "Shirt / Top"
     * heading, but regrouping women's tops sat it directly beside the seeded
     * catalogue, where it reads as a real product.
     *
     * Deactivated rather than deleted: it still has an uploaded preview image
     * and a layer, so it stays editable in the customizer admin and one toggle
     * brings it back. No-op on a fresh database — nothing seeds this row.
     */
    public function up(): void
    {
        DB::table('customizer_products')
            ->where('slug', 'witeli-maika')
            ->update(['is_active' => false]);
    }

    public function down(): void
    {
        DB::table('customizer_products')
            ->where('slug', 'witeli-maika')
            ->update(['is_active' => true]);
    }
};
