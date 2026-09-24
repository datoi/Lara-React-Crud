<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Restricts a route to the given roles: `role:customer`.
 *
 * Buying is a customer's business. A tailor signed in as a tailor has their
 * own dashboard and nothing else, and hiding the shop from them in the
 * interface is not the same as refusing it here — every order, payment,
 * review, wishlist and saved design route carries this, so the rule holds for
 * anything that can post to the API, not only for the pages that link to it.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (! in_array($request->user()?->role, $roles, true)) {
            return response()->json([
                'message' => 'This account cannot do that.',
                'code' => 'role_not_allowed',
            ], 403);
        }

        return $next($request);
    }
}
