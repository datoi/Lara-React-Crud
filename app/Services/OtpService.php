<?php

namespace App\Services;

use App\Mail\OtpCode;
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

    /** Send OTP via SMS */
    public function sendSms(string $phone, string $code): void
    {
        (new SmsService)->send($phone, "Kere: თქვენი დამადასტურებელი კოდია {$code}");
    }
}
