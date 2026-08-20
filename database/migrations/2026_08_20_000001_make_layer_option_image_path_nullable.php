<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Attribute layers (fit, length, neckline, …) are selector-only: they never
     * paint a canvas layer, so their options carry a label and price rather than
     * a photo. Photos stay optional per option so art can be dropped in later
     * without touching the schema.
     */
    public function up(): void
    {
        Schema::table('layer_options', function (Blueprint $table) {
            $table->string('image_path')->nullable()->change();
        });
    }

    /**
     * Destructive by necessity: an option with no photo could not exist under
     * the old schema, so restoring NOT NULL means dropping the selector-only
     * options this migration made possible. Without this the rollback fails
     * outright on the surviving NULLs.
     */
    public function down(): void
    {
        DB::table('layer_options')->whereNull('image_path')->delete();

        Schema::table('layer_options', function (Blueprint $table) {
            $table->string('image_path')->nullable(false)->change();
        });
    }
};
