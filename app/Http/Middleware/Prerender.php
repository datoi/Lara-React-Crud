<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Prerender
{
    /**
     * User-agents that should receive pre-rendered HTML.
     * Covers search engines + all major social sharing scrapers.
     */
    private const CRAWLERS = [
        'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp',
        'baiduspider', 'facebot', 'facebookexternalhit', 'twitterbot',
        'whatsapp', 'telegrambot', 'linkedinbot', 'slackbot',
        'discordbot', 'applebot', 'ia_archiver', 'msnbot',
        'embedly', 'quora link preview', 'outbrain', 'pinterest',
        'vkshare', 'w3c_validator', 'screaming frog',
    ];

    /**
     * URL prefixes that should never be prerendered.
     */
    private const SKIP_PREFIXES = ['/api/', '/sanctum/', '/_debugbar/'];

    /**
     * File extensions that should never be prerendered.
     */
    private const SKIP_EXTENSIONS = [
        '.js', '.css', '.xml', '.less', '.png', '.jpg', '.jpeg',
        '.gif', '.pdf', '.doc', '.txt', '.ico', '.rss', '.zip',
        '.mp3', '.rar', '.exe', '.wmv', '.doc', '.avi', '.ppt',
        '.mpg', '.mpeg', '.tif', '.wav', '.mov', '.psd', '.ai',
        '.xls', '.mp4', '.m4a', '.swf', '.dat', '.dmg', '.iso',
        '.flv', '.m4v', '.torrent', '.woff', '.woff2', '.ttf', '.svg',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldPrerender($request)) {
            $prerendered = $this->fetchPrerendered($request->url());
            if ($prerendered !== null) {
                return response($prerendered, 200)
                    ->header('Content-Type', 'text/html; charset=UTF-8');
            }
        }

        return $next($request);
    }

    private function shouldPrerender(Request $request): bool
    {
        // Only GET requests
        if (! $request->isMethod('GET')) {
            return false;
        }

        $ua  = strtolower($request->userAgent() ?? '');
        $uri = $request->getPathInfo();

        // Skip if no user-agent
        if (empty($ua)) {
            return false;
        }

        // Skip static assets
        foreach (self::SKIP_EXTENSIONS as $ext) {
            if (str_ends_with(strtolower($uri), $ext)) {
                return false;
            }
        }

        // Skip internal prefixes
        foreach (self::SKIP_PREFIXES as $prefix) {
            if (str_starts_with($uri, $prefix)) {
                return false;
            }
        }

        // Skip if this is already a prerender request (avoid loops)
        if ($request->hasHeader('X-Prerender')) {
            return false;
        }

        // Check if the user-agent matches a known crawler
        foreach (self::CRAWLERS as $crawler) {
            if (str_contains($ua, $crawler)) {
                return true;
            }
        }

        // Also honour the _escaped_fragment_ pattern (legacy AJAX crawling)
        if ($request->query->has('_escaped_fragment_')) {
            return true;
        }

        return false;
    }

    private function fetchPrerendered(string $url): ?string
    {
        $token          = config('prerender.token');
        $serviceUrl     = rtrim(config('prerender.service_url', 'https://service.prerender.io'), '/');
        $prerenderUrl   = $serviceUrl . '/' . $url;

        $headers = ['X-Prerender: 1'];
        if ($token) {
            $headers[] = 'X-Prerender-Token: ' . $token;
        }

        $context = stream_context_create([
            'http' => [
                'method'          => 'GET',
                'header'          => implode("\r\n", $headers),
                'timeout'         => 10,
                'follow_location' => 1,
            ],
            'ssl' => [
                'verify_peer'      => true,
                'verify_peer_name' => true,
            ],
        ]);

        $html = @file_get_contents($prerenderUrl, false, $context);

        return $html !== false ? $html : null;
    }
}
