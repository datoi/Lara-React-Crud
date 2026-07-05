<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Keyed by email+IP rather than IP alone — otherwise users sharing an IP
        // (mobile carrier CGNAT, office wifi) lock each other out of a single
        // shared bucket, since pre-auth requests have no user id to key on.
        RateLimiter::for('login', function (Request $request) {
            $key = strtolower((string) $request->input('email')) . '|' . $request->ip();
            return Limit::perMinute(10)->by($key);
        });

        RateLimiter::for('admin-login', function (Request $request) {
            $key = strtolower((string) $request->input('email')) . '|' . $request->ip();
            return Limit::perHour(5)->by($key);
        });
    }
}
