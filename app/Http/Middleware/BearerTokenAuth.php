<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Http\Request;

/**
 * Bearer-token authentication.
 *
 * Implements AuthenticatesRequests — which declares no methods — purely so
 * Laravel's middleware priority sorts this ahead of ThrottleRequests. Without
 * it the throttle runs first, finds no authenticated user, and keys its bucket
 * on the client IP instead of the account: every signed-in user behind one
 * address then shares a single allowance, which on office, café or carrier-NAT
 * connections means ordinary customers rate-limiting each other.
 */
class BearerTokenAuth implements AuthenticatesRequests
{
    public function handle(Request $request, Closure $next)
    {
        $raw = $request->bearerToken();

        if ($raw) {
            $user = User::where('api_token', hash('sha256', $raw))->first();
            if ($user) {
                if ($user->is_suspended) {
                    return response()->json(['message' => 'Your account has been suspended.'], 403);
                }
                $request->setUserResolver(fn () => $user);
            }
        }

        if (! $request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return $next($request);
    }
}
