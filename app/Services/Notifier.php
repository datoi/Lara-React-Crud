<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class Notifier
{
    /**
     * Notify a user by SMS (always, if they have a phone) AND email (additionally,
     * if they have one). Built for tailor-facing alerts: many Georgian tailors
     * register with a phone only, so SMS is the guaranteed channel and email is
     * a bonus when present. Failures are logged, never thrown.
     */
    public function dual(User $user, string $smsText, ?Mailable $mail = null): void
    {
        if ($user->phone) {
            try {
                (new SmsService)->send($user->phone, $smsText);
            } catch (\Throwable $e) {
                Log::error('Dual-notify SMS failed: '.$e->getMessage());
            }
        }

        if ($user->email && $mail) {
            try {
                Mail::to($user->email)->send($mail);
            } catch (\Throwable $e) {
                Log::error('Dual-notify email failed: '.$e->getMessage());
            }
        }
    }
}
