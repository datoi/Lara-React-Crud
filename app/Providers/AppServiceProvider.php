<?php

namespace App\Providers;

use App\Models\User;
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

        // Keyed by the account the attempt names, read from the same field the
        // controller signs in with (`login`, or `email` when `login` is absent),
        // so a decoy field cannot open a fresh bucket. Per account and IP, so
        // people sharing an IP (carrier NAT, office wifi) do not lock each other
        // out; per account across every IP, so guessing cannot be spread out;
        // and per IP, so one address cannot work through many accounts.
        RateLimiter::for('login', function (Request $request) {
            $raw = $request->filled('login') ? $request->input('login') : $request->input('email');
            $account = User::loginThrottleKey(is_string($raw) ? $raw : '');

            return [
                Limit::perMinute(10)->by('account-ip:'.$account.'|'.$request->ip()),
                Limit::perHour(50)->by('account:'.$account),
                Limit::perMinute(60)->by('ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('admin-login', function (Request $request) {
            $raw = $request->input('email');
            $email = mb_strtolower(trim(is_string($raw) ? $raw : ''));

            return [
                Limit::perHour(5)->by('email-ip:'.$email.'|'.$request->ip()),
                Limit::perHour(20)->by('email:'.$email),
            ];
        });
    }
}
