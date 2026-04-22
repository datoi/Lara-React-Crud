<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class BearerTokenAuth
{
    public function handle(Request $request, Closure $next)
    {
        $raw = $request->bearerToken();

        if ($raw) {
            $user = User::where('api_token', hash('sha256', $raw))->first();
            if ($user) {
                $request->setUserResolver(fn () => $user);
            }
        }

        if (! $request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return $next($request);
    }
}
