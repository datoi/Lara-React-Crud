<?php

use App\Models\Product;
use Illuminate\Support\Facades\Route;

// ─── robots.txt ──────────────────────────────────────────────────────────────
Route::get('/robots.txt', function () {
    $content = implode("\n", [
        'User-agent: *',
        'Allow: /',
        'Disallow: /customer-dashboard',
        'Disallow: /tailor-dashboard',
        'Disallow: /api/',
        '',
        'Sitemap: ' . config('app.url') . '/sitemap.xml',
    ]);
    return response($content, 200)->header('Content-Type', 'text/plain');
});

// ─── sitemap.xml ─────────────────────────────────────────────────────────────
Route::get('/sitemap.xml', function () {
    $base = config('app.url');

    $staticUrls = [
        ['loc' => $base . '/',            'changefreq' => 'weekly',  'priority' => '1.0'],
        ['loc' => $base . '/marketplace', 'changefreq' => 'daily',   'priority' => '0.9'],
        ['loc' => $base . '/design',      'changefreq' => 'monthly', 'priority' => '0.8'],
        ['loc' => $base . '/how-it-works','changefreq' => 'monthly', 'priority' => '0.7'],
        ['loc' => $base . '/about',       'changefreq' => 'monthly', 'priority' => '0.6'],
        ['loc' => $base . '/signin',      'changefreq' => 'yearly',  'priority' => '0.4'],
    ];

    $products = Product::select('id', 'updated_at')->get();

    $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($staticUrls as $u) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>{$u['loc']}</loc>\n";
        $xml .= "    <changefreq>{$u['changefreq']}</changefreq>\n";
        $xml .= "    <priority>{$u['priority']}</priority>\n";
        $xml .= "  </url>\n";
    }

    foreach ($products as $p) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>{$base}/product/{$p->id}</loc>\n";
        $xml .= "    <lastmod>{$p->updated_at->toDateString()}</lastmod>\n";
        $xml .= "    <changefreq>weekly</changefreq>\n";
        $xml .= "    <priority>0.7</priority>\n";
        $xml .= "  </url>\n";
    }

    $xml .= '</urlset>';

    return response($xml, 200)->header('Content-Type', 'application/xml');
});

// ─── SPA catch-all ───────────────────────────────────────────────────────────
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
