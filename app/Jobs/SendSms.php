<?php

namespace App\Jobs;

use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * One SMS, sent by the queue worker rather than inside a request, and tried
 * again when the gateway fails or rejects it (for example while the SMSOffice
 * balance is empty). Used where several people are told at once, so the
 * person whose action caused it does not wait for every message.
 */
class SendSms implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> seconds before the second and third tries */
    public array $backoff = [60, 300];

    public function __construct(public string $phone, public string $message) {}

    public function handle(SmsService $sms): void
    {
        $sms->sendOrFail($this->phone, $this->message);
    }

    public function failed(Throwable $e): void
    {
        Log::error('SMS given up after '.$this->tries.' tries: '.$e->getMessage());
    }
}
