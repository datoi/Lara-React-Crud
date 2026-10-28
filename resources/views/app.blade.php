<!DOCTYPE html>
<html lang="ka">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        {{-- Whether the design studio takes orders (config app.custom_orders_open). --}}
        <meta name="kere-custom-orders" content="{{ config('app.custom_orders_open') ? 'open' : 'paused' }}">

        <!-- Default SEO -->
        <title>Kere — Made-to-Fit Clothing and Remodels | Tbilisi, Georgia</title>
        <meta name="description" content="Kere makes clothing that fits: ready-made pieces and remodels of your own garments, made in Tbilisi. Pay online; a courier collects and delivers across Georgia.">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="https://kereforyou.com">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Noto+Sans+Georgian:wght@400;500;600;700&family=Noto+Serif+Georgian:wght@500;600;700&display=swap" rel="stylesheet">

        <!-- Favicon -->
        <link rel="icon" href="/favicon.ico?v=5" sizes="any">
        <link rel="icon" type="image/png" href="/favicon.png?v=5">
        <link rel="apple-touch-icon" href="/favicon.png?v=5">

        <!-- Open Graph -->
        <meta property="og:type"             content="website">
        <meta property="og:site_name"        content="Kere">
        <meta property="og:title"            content="Kere — Made-to-Fit Clothing and Remodels | Tbilisi, Georgia">
        <meta property="og:description"      content="Kere makes clothing that fits: ready-made pieces and remodels of your own garments, made in Tbilisi. Pay online; a courier collects and delivers across Georgia.">
        <meta property="og:url"              content="https://kereforyou.com">
        <meta property="og:locale"           content="ka_GE">
        <meta property="og:locale:alternate" content="en_US">
        <meta property="og:image"            content="https://kereforyou.com/assets/og-image.jpg?v=3">
        <meta property="og:image:secure_url" content="https://kereforyou.com/assets/og-image.jpg?v=3">
        <meta property="og:image:type"       content="image/jpeg">
        <meta property="og:image:width"      content="1200">
        <meta property="og:image:height"     content="630">
        <meta property="og:image:alt"        content="Kere — made-to-fit clothing, Tbilisi">

        <!-- Twitter Card -->
        <meta name="twitter:card"        content="summary_large_image">
        <meta name="twitter:title"       content="Kere — Made-to-Fit Clothing and Remodels | Tbilisi, Georgia">
        <meta name="twitter:description" content="Kere makes clothing that fits: ready-made pieces and remodels of your own garments, made in Tbilisi. Pay online; a courier collects and delivers across Georgia.">
        <meta name="twitter:image"       content="https://kereforyou.com/assets/og-image.jpg?v=3">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/App.tsx'])
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
