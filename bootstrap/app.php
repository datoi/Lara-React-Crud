<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Believe X-Forwarded-For only from Railway's edge, internal hops and
        // Cloudflare, so $request->ip() is the visitor's address. Forwarded
        // host and port are not believed: URLs are built from the Host header.
        $middleware->trustProxies(
            at: \App\Support\TrustedProxies::all(),
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR | \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO,
        );
        $middleware->append(\App\Http\Middleware\UseCloudflareVisitorIp::class);

        // Flitt posts the customer back with no CSRF token. The route renders
        // the app shell and nothing more — the payment itself is confirmed
        // server-side through /api/orders/{id}/verify-payment.
        $middleware->validateCsrfTokens(except: ['checkout/complete']);
$middleware->alias([
            'auth.bearer' => \App\Http\Middleware\BearerTokenAuth::class,
            'auth.admin'  => \App\Http\Middleware\AdminMiddleware::class,
            'role'        => \App\Http\Middleware\EnsureRole::class,
            'tailor.active' => \App\Http\Middleware\EnsureTailorCanTakeWork::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
