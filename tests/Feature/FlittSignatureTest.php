<?php

use App\Services\FlittService;

/**
 * The signature is the only thing standing between the public Flitt callback
 * route and an order being marked paid, so it is pinned here rather than
 * trusted to stay right.
 */
function flitt(string $secret = 'test', string $merchant = '1396424'): FlittService
{
    config()->set('services.flitt.merchant_id', $merchant);
    config()->set('services.flitt.secret_key', $secret);
    config()->set('services.flitt.api_url', 'https://pay.flitt.com/api');

    return new FlittService;
}

test('signature is sha1 of the secret and the values, ordered by key', function () {
    $params = [
        'order_id'    => 'test123456',
        'merchant_id' => '1396424',
        'order_desc'  => 'test order',
        'amount'      => 100,
        'currency'    => 'USD',
    ];

    // Sorted by key: amount, currency, merchant_id, order_desc, order_id.
    $expected = sha1('test|100|USD|1396424|test order|test123456');

    expect(flitt()->signature($params))->toBe($expected);
});

test('empty values are dropped rather than signed as blanks', function () {
    $withBlank = ['merchant_id' => '1396424', 'amount' => 100, 'order_desc' => ''];
    $without   = ['merchant_id' => '1396424', 'amount' => 100];

    expect(flitt()->signature($withBlank))->toBe(flitt()->signature($without));
});

test('the signature field never signs itself', function () {
    $params = ['merchant_id' => '1396424', 'amount' => 100];
    $signed = $params + ['signature' => 'whatever'];

    expect(flitt()->signature($signed))->toBe(flitt()->signature($params));
});

test('a correctly signed callback verifies', function () {
    $service = flitt();
    $payload = ['order_id' => 'ORD-ABC', 'amount' => 4500, 'currency' => 'GEL', 'order_status' => 'approved'];
    $payload['signature'] = $service->signature($payload);

    expect($service->verifyCallbackSignature($payload))->toBeTrue();
});

test('a tampered amount fails verification', function () {
    $service = flitt();
    $payload = ['order_id' => 'ORD-ABC', 'amount' => 4500, 'currency' => 'GEL', 'order_status' => 'approved'];
    $payload['signature'] = $service->signature($payload);

    $payload['amount'] = 1;

    expect($service->verifyCallbackSignature($payload))->toBeFalse();
});

test('a callback with no signature fails verification', function () {
    expect(flitt()->verifyCallbackSignature(['order_id' => 'ORD-ABC', 'order_status' => 'approved']))->toBeFalse();
});

test('response_signature_string is excluded from the signed set', function () {
    $service = flitt();
    $payload = ['order_id' => 'ORD-ABC', 'amount' => 4500];
    $payload['signature'] = $service->signature($payload);
    $payload['response_signature_string'] = 'test|4500|ORD-ABC';

    expect($service->verifyCallbackSignature($payload))->toBeTrue();
});

test('a signature from a different secret fails verification', function () {
    $payload = ['order_id' => 'ORD-ABC', 'amount' => 4500];
    $payload['signature'] = flitt('their-secret')->signature($payload);

    expect(flitt('our-secret')->verifyCallbackSignature($payload))->toBeFalse();
});

test('nothing verifies while the gateway is unconfigured', function () {
    $service = flitt(secret: '');
    $payload = ['order_id' => 'ORD-ABC', 'signature' => 'anything'];

    expect($service->isConfigured())->toBeFalse()
        ->and($service->verifyCallbackSignature($payload))->toBeFalse();
});

test('amounts are converted to tetri without float drift', function () {
    $order = new App\Models\Order(['order_number' => 'ORD-X', 'total' => 45.10]);

    expect(flitt()->minorUnits($order))->toBe(4510);
});
