<!DOCTYPE html>
<html lang="ka">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- SEO -->
        <title>{{ $meta['title'] }}</title>
        <meta name="description" content="{{ $meta['description'] }}">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="{{ $meta['url'] }}">

        <!-- Favicon -->
        <link rel="icon" type="image/jpeg" href="/favicon.jpg">
        <link rel="shortcut icon" type="image/jpeg" href="/favicon.jpg">

        <!-- Open Graph -->
        <meta property="og:type"             content="{{ $meta['type'] }}">
        <meta property="og:site_name"        content="Kere">
        <meta property="og:title"            content="{{ $meta['title'] }}">
        <meta property="og:description"      content="{{ $meta['description'] }}">
        <meta property="og:url"              content="{{ $meta['url'] }}">
        <meta property="og:locale"           content="ka_GE">
        <meta property="og:locale:alternate" content="en_US">
        <meta property="og:image"            content="{{ $meta['image'] }}">
        <meta property="og:image:width"      content="1200">
        <meta property="og:image:height"     content="630">
        <meta property="og:image:alt"        content="{{ $meta['title'] }}">

        <!-- Twitter Card -->
        <meta name="twitter:card"        content="summary_large_image">
        <meta name="twitter:title"       content="{{ $meta['title'] }}">
        <meta name="twitter:description" content="{{ $meta['description'] }}">
        <meta name="twitter:image"       content="{{ $meta['image'] }}">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/App.tsx'])
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
