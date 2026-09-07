<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The rest of the garment specification a photographed option was shot in,
     * as layer_category.slug => layer_option.slug.
     *
     * A photograph is only a picture of the customer's garment while they stay
     * on the cut it was shot in: the T-shirt sleeves are photographed on a
     * body-fitting, cropped, crew-neck tee, so asking for a longline V-neck
     * leaves the photo describing something the customer is not buying. The
     * option declares what it depicts and the canvas withholds it once the
     * specification moves away, rather than the frontend hardcoding which
     * combinations happen to have been shot.
     *
     * Null on every option that carries no photography, and on photography that
     * holds for any specification.
     */
    public function up(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->json('depicts')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->dropColumn('depicts');
        });
    }
};
