<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Normalise any customizer-product slug that isn't already URL-safe
     * (e.g. admin-typed "Red Shirt" / "Tank-Top" → "red-shirt" / "tank-top").
     * Already-normalised slugs are left untouched. saved_designs reference the
     * product by id and orders keep a garment_type string snapshot, so changing
     * the slug is safe.
     */
    public function up(): void
    {
        foreach (DB::table('customizer_products')->get(['id', 'slug']) as $product) {
            $normalized = Str::slug($product->slug) ?: 'product';
            if ($normalized === $product->slug) {
                continue;
            }

            $slug = $normalized;
            $n = 2;
            while (DB::table('customizer_products')
                ->where('slug', $slug)
                ->where('id', '!=', $product->id)
                ->exists()) {
                $slug = "{$normalized}-{$n}";
                $n++;
            }

            DB::table('customizer_products')->where('id', $product->id)->update(['slug' => $slug]);
        }
    }

    public function down(): void
    {
        // Irreversible: the original non-normalised casing/spacing is not preserved.
    }
};
