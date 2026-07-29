<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an SMS via the SMSOffice.ge gateway (best delivery/cost for Georgian
     * +995 numbers, and supports a registered "Kere" sender name).
     * Falls back to logging when no gateway key is configured (dev/local).
     */
    public function send(string $phone, string $message): void
    {
        $key = config('services.smsoffice.key');
        $sender = config('services.smsoffice.sender');
        $url = config('services.smsoffice.url');

        // Georgian gateways expect the number without a leading '+'
        $destination = ltrim($phone, '+');

        if (! $key || ! $sender) {
            // Not configured — log the message so the flow still works in dev
            Log::channel('daily')->info("SMS [{$phone}]: {$message}");

            return;
        }

        try {
            $response = Http::asForm()->post($url, [
                'key' => $key,
                'destination' => $destination,
                'sender' => $sender,
                'content' => $message,
            ]);

            if ($response->failed()) {
                Log::error("SMS gateway HTTP {$response->status()} for {$phone}: ".$response->body());

                return;
            }

            // SMSOffice returns HTTP 200 even on rejection; the real status is in
            // the body ({"Success":false,"Message":"...","ErrorCode":N}).
            $body = $response->json();
            if (! ($body['Success'] ?? false)) {
                $reason = $body['Message'] ?? 'unknown';
                $code = $body['ErrorCode'] ?? '?';
                Log::error("SMS rejected for {$phone}: {$reason} (ErrorCode {$code})");
            }
        } catch (\Throwable $e) {
            Log::error("SMS failed for {$phone}: ".$e->getMessage());
        }
    }
}
