<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Only a tailor Kere can give work to (approved, not suspended) may list
 * products or upload to the public bucket. A pending or rejected tailor has
 * passed nothing but a phone code (QA_REPORT.md QA-04).
 */
class EnsureTailorCanTakeWork
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user()?->canTakeWork()) {
            return response()->json(['message' => 'Your account is pending approval.', 'code' => 'pending_approval'], 403);
        }

        return $next($request);
    }
}
