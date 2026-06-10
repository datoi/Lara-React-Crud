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
        'Disallow: /admin-dashboard',
        'Disallow: /api/',
        '',
        'Sitemap: https://kereforyou.com/sitemap.xml',
    ]);
    return response($content, 200)->header('Content-Type', 'text/plain');
});

// ─── sitemap.xml ─────────────────────────────────────────────────────────────
Route::get('/sitemap.xml', function () {
    $base = 'https://kereforyou.com';

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
Route::get('/{any}', function (string $any) {
    $base    = 'https://kereforyou.com';
    $default = [
        'title'       => 'Kere — Custom Clothing Marketplace | Tbilisi, Georgia',
        'description' => 'Connect with expert Georgian tailors for bespoke clothing. Design custom garments or browse our curated marketplace. Handcrafted in Tbilisi.',
        'image'       => $base . '/assets/og-image.jpg',
        'url'         => $base . '/' . ltrim($any, '/'),
        'type'        => 'website',
    ];

    // /product/{id} — inject product title, description, and first image
    if (preg_match('#^product/(\d+)$#', $any, $m)) {
        $product = \App\Models\Product::with('tailor')->find($m[1]);
        if ($product) {
            $images = $product->images ?? [];
            $image  = count($images) ? $base . '/storage/' . ltrim($images[0], '/') : $default['image'];
            $tailor = $product->tailor?->first_name . ' ' . $product->tailor?->last_name;
            $default = array_merge($default, [
                'title'       => $product->name . ' — Kere',
                'description' => $product->description
                    ? mb_substr(strip_tags($product->description), 0, 160)
                    : 'Custom-made ' . $product->name . ' by ' . trim($tailor) . '. Order on Kere.',
                'image'       => $image,
                'type'        => 'product',
            ]);
        }
    }

    // /tailor/{id} — inject tailor name, bio, and profile photo
    if (preg_match('#^tailor/(\d+)$#', $any, $m)) {
        $tailor = \App\Models\User::find($m[1]);
        if ($tailor && $tailor->role === 'tailor') {
            $image = $tailor->profile_image
                ? $base . '/storage/' . ltrim($tailor->profile_image, '/')
                : $default['image'];
            $default = array_merge($default, [
                'title'       => $tailor->first_name . ' ' . $tailor->last_name . ' — Tailor on Kere',
                'description' => $tailor->bio
                    ? mb_substr(strip_tags($tailor->bio), 0, 160)
                    : $tailor->first_name . ' is a verified tailor on Kere. Browse their custom clothing designs.',
                'image'       => $image,
            ]);
        }
    }

    // /marketplace — slightly more specific description
    if ($any === 'marketplace') {
        $default['title']       = 'Marketplace — Browse Custom Clothing | Kere';
        $default['description'] = 'Browse hundreds of custom clothing designs by verified Georgian tailors. Order made-to-measure garments in Georgian Lari.';
    }

    return view('app', ['meta' => $default]);
})->where('any', '.*');
