<?php

use App\Models\User;

/**
 * Production is visitor → Cloudflare → Railway's edge → app. Every per-IP
 * rate limit, and the IP kept as proof of agreement, must see the visitor,
 * not Cloudflare (QA_REPORT.md QA-02).
 */
const RAILWAY_EDGE = '10.12.0.7';
const CLOUDFLARE_EDGE = '172.70.1.1';
const VISITOR = '203.0.113.9';

/** Sends a request through the app and reads what it made of the caller. */
function visitorIpVia(array $headers, string $remoteAddr = RAILWAY_EDGE): array
{
    test()->withServerVariables(['REMOTE_ADDR' => $remoteAddr])
        ->withHeaders($headers)
        ->getJson('/api/categories')
        ->assertOk();

    return ['ip' => request()->ip(), 'url' => url('/somewhere')];
}

it('reads the visitor when Railway appends Cloudflare to the forwarded chain', function () {
    expect(visitorIpVia(['X-Forwarded-For' => VISITOR.', '.CLOUDFLARE_EDGE])['ip'])->toBe(VISITOR);
});

it('reads the visitor from CF-Connecting-IP when the chain ends at Cloudflare', function () {
    expect(visitorIpVia(['X-Forwarded-For' => CLOUDFLARE_EDGE, 'CF-Connecting-IP' => VISITOR])['ip'])->toBe(VISITOR);
});

it('ignores addresses a visitor writes into the forwarded chain themselves', function () {
    expect(visitorIpVia(['X-Forwarded-For' => '6.6.6.6, '.VISITOR.', '.CLOUDFLARE_EDGE])['ip'])->toBe(VISITOR);
});

it('ignores CF-Connecting-IP on a request that did not come through Cloudflare', function () {
    $ip = visitorIpVia(['X-Forwarded-For' => '198.51.100.7', 'CF-Connecting-IP' => '1.1.1.1'])['ip'];

    expect($ip)->toBe('198.51.100.7');
});

it('reads the address Railway saw when someone skips Cloudflare and forges both headers', function () {
    $ip = visitorIpVia(['X-Forwarded-For' => VISITOR.', '.CLOUDFLARE_EDGE.', 198.51.100.7', 'CF-Connecting-IP' => VISITOR])['ip'];

    expect($ip)->toBe('198.51.100.7');
});

it('builds URLs from the Host header, never a forwarded host', function () {
    $url = visitorIpVia(['X-Forwarded-For' => VISITOR.', '.CLOUDFLARE_EDGE, 'X-Forwarded-Host' => 'evil.example'])['url'];

    expect($url)->not->toContain('evil.example');
});

it('gives two visitors behind the same Cloudflare edge their own sign-in limits', function () {
    $victim = User::factory()->create(['role' => 'customer']);

    foreach (range(1, 60) as $i) {
        $this->withServerVariables(['REMOTE_ADDR' => RAILWAY_EDGE])
            ->withHeaders(['X-Forwarded-For' => '198.51.100.7, '.CLOUDFLARE_EDGE])
            ->postJson('/api/login', ['login' => "someone{$i}@example.com", 'password' => 'guess', 'role' => 'customer'])
            ->assertStatus(401);
    }

    $this->withServerVariables(['REMOTE_ADDR' => RAILWAY_EDGE])
        ->withHeaders(['X-Forwarded-For' => VISITOR.', '.CLOUDFLARE_EDGE])
        ->postJson('/api/login', ['login' => $victim->email, 'password' => 'password', 'role' => 'customer'])
        ->assertOk();
});
