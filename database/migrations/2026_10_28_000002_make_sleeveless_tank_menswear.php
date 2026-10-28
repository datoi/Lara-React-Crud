<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The sleeveless tank (slug sleeveless-tank) is photographed on a man and
     * was seeded unisex, so the women's design studio listed it under Tops
     * beside the women's T-shirt. Menswear only from now on (owner, 2026-10-28).
     *
     * A migration because start.sh does not run SleevelessTankSeeder, so the
     * seeder's own change would never reach production. No-op where the row
     * does not exist.
     */
    public function up(): void
    {
        DB::table('customizer_products')
            ->where('slug', 'sleeveless-tank')
            ->update(['gender' => 'men']);
    }

    public function down(): void
    {
        DB::table('customizer_products')
            ->where('slug', 'sleeveless-tank')
            ->update(['gender' => 'unisex']);
    }
};
