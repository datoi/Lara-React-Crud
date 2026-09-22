<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'support' => [
        'email' => env('SUPPORT_EMAIL'),
    ],

    'smsoffice' => [
        'key' => env('SMSOFFICE_KEY'),
        'sender' => env('SMSOFFICE_SENDER', 'Kere'),
        'url' => env('SMSOFFICE_URL', 'https://smsoffice.ge/api/v2/send/'),
    ],

    // Flitt (flitt.com) card payments. Credentials come from portal.flitt.com →
    // Merchant settings; 'secret_key' is the portal's "Payment key". They have no
    // defaults deliberately: a fallback sandbox merchant would let a deploy with
    // missing env sign live checkouts with a test key instead of failing loudly.
    // FlittService::isConfigured() is what refuses in that case.
    'flitt' => [
        'merchant_id' => env('FLITT_MERCHANT_ID'),
        'secret_key'  => env('FLITT_SECRET_KEY'),
        'api_url'     => env('FLITT_API_URL', 'https://pay.flitt.com/api'),
    ],

];
