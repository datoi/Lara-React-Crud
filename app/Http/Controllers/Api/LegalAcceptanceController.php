<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\LegalDocuments;
use Closure;
use Illuminate\Http\Request;

/**
 * Agreeing again to a document that changed (App\Support\LegalDocuments).
 * The first agreement is part of registration; this is every one after it.
 */
class LegalAcceptanceController extends Controller
{
    // ─── POST /api/legal/accept ───────────────────────────────────────────────

    /**
     * Body: { documents: { terms: "1.1", privacy: "1.2" }, locale }. Each
     * document names the version the person was shown, so an answer to a
     * version replaced since is refused rather than recorded against the new one.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $required = LegalDocuments::requiredFor($user);

        $data = $request->validate([
            // Only documents this person's role is asked to accept.
            'documents' => ['bail', 'required', 'array', 'min:1', function (string $attribute, array $value, Closure $fail) use ($required) {
                if (array_diff(array_keys($value), $required) !== []) {
                    $fail('legal_document_unknown');
                }
            }],
            'documents.*' => ['required', 'string', 'max:20'],
            'locale' => ['nullable', 'in:ka,en'],
        ]);

        foreach ($data['documents'] as $document => $version) {
            if ($version !== LegalDocuments::version($document)) {
                return response()->json([
                    'message' => 'This document has been updated since you opened it. Please read the new version.',
                    'code' => 'legal_version_changed',
                ], 409);
            }
        }

        LegalDocuments::record(
            $user,
            array_fill_keys(array_keys($data['documents']), true),
            'update',
            LegalDocuments::evidenceFrom($request, $data['locale'] ?? null),
        );

        return response()->json([
            'legal_pending' => LegalDocuments::pendingFor($user),
            'may_place_orders' => $user->mayPlaceOrders(),
        ]);
    }
}
