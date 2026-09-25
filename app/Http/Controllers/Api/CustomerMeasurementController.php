<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Measurements;
use Illuminate\Http\Request;

/**
 * The signed-in customer's own saved measurements — never anyone else's.
 * Routed behind role:customer; there is no endpoint that reads another user's.
 */
class CustomerMeasurementController extends Controller
{
    // ─── GET /api/customer/measurements ──────────────────────────────────────

    public function show(Request $request)
    {
        return response()->json(['measurements' => $request->user()->measurements ?? (object) []]);
    }

    // ─── PUT /api/customer/measurements ──────────────────────────────────────
    // Replaces the whole set; an empty map clears it.

    public function update(Request $request)
    {
        $data = $request->validate(Measurements::rules('measurements', profile: true));

        $request->user()->update(['measurements' => Measurements::normalize($data['measurements'] ?? null)]);

        return $this->show($request);
    }
}
