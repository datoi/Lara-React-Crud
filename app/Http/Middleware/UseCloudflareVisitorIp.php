<?php

namespace App\Http\Middleware;

use App\Support\TrustedProxies;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\IpUtils;

/**
 * When the trusted X-Forwarded-For chain ends at a Cloudflare address, the
 * hop in front of it did not record the visitor, so the visitor's address is
 * the one Cloudflare states in CF-Connecting-IP. That header is read only in
 * this case: a request that reached the origin without passing Cloudflare
 * resolves to its own address, not a Cloudflare one, and cannot set it.
 */
class UseCloudflareVisitorIp
{
    public function handle(Request $request, Closure $next)
    {
        $resolved = $request->ip();
        $visitor = $request->headers->get('CF-Connecting-IP');

        if ($resolved && $visitor && filter_var($visitor, FILTER_VALIDATE_IP)
            && IpUtils::checkIp($resolved, TrustedProxies::CLOUDFLARE)) {
            $request->headers->remove('X-Forwarded-For');
            $request->server->set('REMOTE_ADDR', $visitor);
        }

        return $next($request);
    }
}
