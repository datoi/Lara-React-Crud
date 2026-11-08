<?php

use App\Jobs\SendSms;
use App\Models\KereNotification;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

/**
 * A tailor hears about a new request on their phone, not only in the bell of
 * a dashboard they may not have open (the CEO's request, 2026-11-08). The SMS
 * goes through the queue, so the customer does not wait for it and a failed
 * one is tried again.
 */
const OPEN_REMODEL_SMS_TEXT = 'Kere: ახალი გადაკეთების მოთხოვნა — kereforyou.com/tailor-dashboard';

function smsCustomerToken(): string
{
    $token = Str::random(60);
    User::factory()->create(['role' => 'customer', 'terms_accepted_at' => now(), 'api_token' => hash('sha256', $token)]);

    return $token;
}

function smsRemodelRequest(): array
{
    return [
        'order_type' => 'remodel', 'first_name' => 'Nino', 'phone' => '+995555000111',
        'address' => 'Rustaveli 1', 'city' => 'Tbilisi',
        'custom_design_data' => ['change_request' => 'Shorten the sleeves', 'remodel_images' => ['https://example.com/jacket.jpg']],
    ];
}

function smsTailor(array $attributes): User
{
    return User::factory()->create(array_merge([
        'role' => 'tailor', 'approval_status' => 'approved', 'does_remodeling' => true,
        'phone' => '+9955'.random_int(10000000, 99999999),
    ], $attributes));
}

beforeEach(fn () => Mail::fake());

it('texts every tailor who could take a new remodel request, and nobody else', function () {
    Queue::fake();
    $remodeler = smsTailor([]);
    $legacy = smsTailor(['approval_status' => null]);
    $noRemodels = smsTailor(['does_remodeling' => false]);
    $pending = smsTailor(['approval_status' => 'pending']);
    $suspended = smsTailor(['is_suspended' => true]);

    $this->withToken(smsCustomerToken())->postJson('/api/orders', smsRemodelRequest())->assertCreated();

    $texted = collect(Queue::pushed(SendSms::class))->map(fn (SendSms $job) => $job->phone)->sort()->values()->all();
    expect($texted)->toBe(collect([$remodeler->phone, $legacy->phone])->sort()->values()->all());

    foreach ([$noRemodels, $pending, $suspended] as $other) {
        expect(KereNotification::where('user_id', $other->id)->count())->toBe(0);
    }
    expect(KereNotification::where('user_id', $remodeler->id)->where('type', 'open_order')->count())->toBe(1);
});

it('sends a short Georgian SMS that names no customer and fits one message', function () {
    Queue::fake();
    smsTailor([]);

    $this->withToken(smsCustomerToken())->postJson('/api/orders', smsRemodelRequest())->assertCreated();

    Queue::assertPushed(SendSms::class, fn (SendSms $job) => $job->message === OPEN_REMODEL_SMS_TEXT);
    expect(mb_strlen(OPEN_REMODEL_SMS_TEXT))->toBeLessThanOrEqual(70)
        ->and(OPEN_REMODEL_SMS_TEXT)->not->toContain('Nino');
});

it('still takes the request when no tailor has a phone', function () {
    Queue::fake();
    smsTailor(['phone' => null]);

    $this->withToken(smsCustomerToken())->postJson('/api/orders', smsRemodelRequest())->assertCreated();

    Queue::assertNothingPushed();
});

it('gives the job a failure to retry when the gateway refuses, and sends when it accepts', function () {
    config()->set('services.smsoffice.key', 'qa-key');
    config()->set('services.smsoffice.sender', 'Kere');
    config()->set('services.smsoffice.url', 'https://sms.invalid/send');

    Http::fakeSequence('sms.invalid/*')
        ->push(['Success' => false, 'Message' => 'Insufficient balance', 'ErrorCode' => 20])
        ->push('down', 500)
        ->push(['Success' => true]);

    $job = new SendSms('+995599000001', OPEN_REMODEL_SMS_TEXT);
    expect(fn () => $job->handle(new SmsService))->toThrow(RuntimeException::class, 'Insufficient balance');
    expect(fn () => $job->handle(new SmsService))->toThrow(RuntimeException::class, 'HTTP 500');
    $job->handle(new SmsService);

    Http::assertSentCount(3);
    expect($job->tries)->toBe(3);
});

it('keeps sign-up codes never throwing when the gateway fails', function () {
    config()->set('services.smsoffice.key', 'qa-key');
    config()->set('services.smsoffice.sender', 'Kere');
    config()->set('services.smsoffice.url', 'https://sms.invalid/send');
    Http::fake(['sms.invalid/*' => Http::response('down', 500)]);

    (new SmsService)->send('+995599000001', 'code 123456');

    Http::assertSentCount(1);
});
