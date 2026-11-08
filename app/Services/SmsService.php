<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SmsService
{
    /**
     * Send an SMS via the SMSOffice.ge gateway (best delivery/cost for Georgian
     * +995 numbers, and supports a registered "Kere" sender name).
     * Falls back to logging when no gateway key is configured (dev/local).
     * Never throws: a failure is logged, and the caller carries on.
     */
    public function send(string $phone, string $message): void
    {
        $failure = $this->attempt($phone, $message);

        if ($failure !== null) {
            Log::error("SMS failed for {$phone}: {$failure}");
        }
    }

    /**
     * The same, but a failure throws, so a queued job (SendSms) can try again.
     */
    public function sendOrFail(string $phone, string $message): void
    {
        $failure = $this->attempt($phone, $message);

        if ($failure !== null) {
            throw new RuntimeException("SMS failed for {$phone}: {$failure}");
        }
    }

    /** Null when sent (or logged, unconfigured); otherwise why it failed. */
    private function attempt(string $phone, string $message): ?string
    {
        $key = config('services.smsoffice.key');
        $sender = config('services.smsoffice.sender');
        $url = config('services.smsoffice.url');

        if (! $key || ! $sender) {
            // Not configured — log the message so the flow still works in dev
            Log::channel('daily')->info("SMS [{$phone}]: {$message}");

            return null;
        }

        try {
            // A hung gateway must not hold a request (or a queue worker) for long.
            $response = Http::asForm()->connectTimeout(5)->timeout(10)->post($url, [
                'key' => $key,
                // Georgian gateways expect the number without a leading '+'
                'destination' => ltrim($phone, '+'),
                'sender' => $sender,
                'content' => $message,
            ]);
        } catch (\Throwable $e) {
            return $e->getMessage();
        }

        if ($response->failed()) {
            return "gateway HTTP {$response->status()}: ".$response->body();
        }

        // SMSOffice returns HTTP 200 even on rejection; the real status is in
        // the body ({"Success":false,"Message":"...","ErrorCode":N}).
        $body = $response->json();
        if (! ($body['Success'] ?? false)) {
            return 'rejected: '.($body['Message'] ?? 'unknown').' (ErrorCode '.($body['ErrorCode'] ?? '?').')';
        }

        return null;
    }
}
