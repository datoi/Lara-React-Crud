<?php

namespace App\Services;

use App\Mail\OtpCode;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    /** Generate a 6-digit numeric OTP */
    public function generate(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /** Send OTP via email */
    public function sendEmail(string $to, string $code, string $firstName): void
    {
        Mail::to($to)->send(new OtpCode($code, $firstName));
    }

    /**
     * Send OTP via SMS using Twilio.
     * Falls back to logging if Twilio credentials are not configured.
     */
    public function sendSms(string $phone, string $code): void
    {
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from  = config('services.twilio.from');

        if (!$sid || !$token || !$from || !class_exists(\Twilio\Rest\Client::class)) {
            // No Twilio configured or SDK not installed — log OTP for development
            Log::channel('daily')->info("OTP SMS [{$phone}]: {$code}");
            return;
        }

        try {
            $twilio = new \Twilio\Rest\Client($sid, $token);
            $twilio->messages->create($phone, [
                'from' => $from,
                'body' => "Your Kere verification code is {$code}. It expires in 10 minutes.",
            ]);
        } catch (\Exception $e) {
            Log::error("Twilio SMS failed for {$phone}: " . $e->getMessage());
            throw $e;
        }
    }
}
