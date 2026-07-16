<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Twilio\Rest\Client;

class SmsService
{
    /**
     * Send an SMS via Twilio.
     * Falls back to logging if Twilio credentials are not configured.
     */
    public function send(string $phone, string $message): void
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.from');

        if (! $sid || ! $token || ! $from || ! class_exists(Client::class)) {
            // No Twilio configured or SDK not installed — log the message for development
            Log::channel('daily')->info("SMS [{$phone}]: {$message}");

            return;
        }

        try {
            $twilio = new Client($sid, $token);
            $twilio->messages->create($phone, [
                'from' => $from,
                'body' => $message,
            ]);
        } catch (\Exception $e) {
            Log::error("SMS failed for {$phone}: ".$e->getMessage());
            throw $e;
        }
    }
}
