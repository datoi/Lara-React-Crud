<?php

namespace App\Support;

/**
 * The hops in front of the app whose X-Forwarded-For entries are believed:
 * visitor → Cloudflare → Railway's edge → app. Every per-IP rate limit and
 * the IP address kept as proof of agreement (legal_acceptances) depend on
 * reading the visitor's address, not Cloudflare's or Railway's.
 */
final class TrustedProxies
{
    /** Cloudflare's published ranges (https://www.cloudflare.com/ips/), checked 2026-11-08. */
    public const CLOUDFLARE = [
        '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
        '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
        '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
        '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
        '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
        '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
    ];

    /** Addresses only an internal hop (Railway's network) can have. */
    public const PRIVATE = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10', 'fc00::/7'];

    /** @return list<string> */
    public static function all(): array
    {
        // REMOTE_ADDR is whatever connected to the app, which on Railway is
        // always its edge: it appends the address it saw, so a request that
        // skips Cloudflare still resolves to its sender.
        return ['REMOTE_ADDR', ...self::PRIVATE, ...self::CLOUDFLARE];
    }
}
