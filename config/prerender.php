<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Prerender.io token
    |--------------------------------------------------------------------------
    | Set PRERENDER_TOKEN in your .env. Without a token the free tier still
    | works but is rate-limited to 250 prerenders/month. Sign up at
    | https://prerender.io to get a token (free tier is sufficient for MVP).
    */
    'token' => env('PRERENDER_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Prerender service URL
    |--------------------------------------------------------------------------
    | Points to prerender.io by default. If you ever self-host Prerender
    | (https://github.com/prerender/prerender) change this to your own URL,
    | e.g. 'http://localhost:3000'
    */
    'service_url' => env('PRERENDER_SERVICE_URL', 'https://service.prerender.io'),

];
