<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Flitt (flitt.com, formerly Fondy) card payment gateway.
 *
 * Flow: create a checkout token server-side (createCheckoutToken), hand it to the
 * client's card form, then confirm the result either from the server callback
 * (verifyCallbackSignature) or by asking Flitt directly (fetchOrderStatus). The
 * two confirmation paths exist because a webhook cannot reach a local dev machine,
 * and because a customer who closes the tab mid-payment must still end up settled.
 *
 * Amounts go out in tetri — Flitt speaks minor units — and the currency is GEL.
 *
 * Credentials have no defaults on purpose. An earlier draft of this service fell
 * back to Flitt's shared public sandbox merchant, which is convenient right up to
 * the deploy where FLITT_SECRET_KEY is missing and live checkout silently signs
 * with a sandbox key instead of failing. isConfigured() is the guard: callers
 * refuse to start a payment rather than sign with nothing.
 */
class FlittService
{
    /**
     * Checkout languages Flitt renders, of the two this site speaks. One is sent
     * with every token: leave it out and the gateway chooses for itself, which is
     * how a Georgian-default storefront handed its customers an English card form.
     */
    public const LANGUAGES = ['ka', 'en'];

    public const DEFAULT_LANGUAGE = 'ka';

    private string $merchantId;

    private string $secret;

    private string $apiUrl;

    public function __construct()
    {
        $this->merchantId = (string) config('services.flitt.merchant_id');
        $this->secret     = (string) config('services.flitt.secret_key');
        $this->apiUrl     = rtrim((string) config('services.flitt.api_url'), '/');
    }

    /** Whether a merchant id and secret are actually present. */
    public function isConfigured(): bool
    {
        return $this->merchantId !== '' && $this->secret !== '';
    }

    /** An amount in lari as Flitt takes it, in tetri. */
    public function toMinor(float $amount): int
    {
        return (int) round($amount * 100);
    }

    /** The amount Flitt should be asked for at a payment stage, in tetri. */
    public function minorUnits(Order $order, string $stage = 'full'): int
    {
        return $this->toMinor($order->amountDue($stage));
    }

    /**
     * A fresh gateway reference for this order. Generated, not stored.
     *
     * Flitt rejects a second token for an order_id it already holds ("1013
     * Duplicate order"), so the order number cannot be the gateway's id — one
     * abandoned checkout would make the order unpayable forever. Every attempt
     * takes its own '<order_number>_<random>' instead.
     *
     * A remodel is paid in two halves, and a payment that lands late must be
     * credited to the half it was for, not to whichever one is due by then. So
     * those references carry their stage: '_d-' for the first half, '_b-' for
     * the second. A full payment keeps the original form.
     */
    public function newReference(Order $order, string $stage = 'full'): string
    {
        $marker = ['deposit' => 'd-', 'balance' => 'b-'][$stage] ?? '';

        return $order->order_number.'_'.$marker.Str::lower(Str::random(8));
    }

    /** The payment stage a gateway reference was minted for. */
    public function stageFor(string $reference): string
    {
        if (preg_match('/_([db])-[a-z0-9]+$/', $reference, $m)) {
            return $m[1] === 'd' ? 'deposit' : 'balance';
        }

        return 'full';
    }

    /**
     * Record the attempt the gateway accepted, so a status query knows what to
     * ask about.
     *
     * Only ever called after a token comes back. Storing the reference before
     * that leaves an order pointing at an attempt the gateway never saw, and
     * every later verify() then asks about an order Flitt has never heard of
     * and logs the failure at error level. The column is unique, so a collision
     * — vanishingly unlikely, but it would surface as a 500 rather than the 502
     * the caller promises — is caught and reported as a failed attempt.
     */
    private function rememberAttempt(Order $order, string $reference): bool
    {
        try {
            $order->forceFill(['payment_reference' => $reference])->save();
        } catch (QueryException $e) {
            Log::error("Flitt reference {$reference} could not be stored for {$order->order_number}: ".$e->getMessage());

            return false;
        }

        return true;
    }

    /**
     * The order number a gateway reference belongs to.
     *
     * Order numbers are '<PREFIX>-<8 uppercase alphanumerics>' and never contain
     * an underscore, so the separator cannot collide with one. Anything without
     * a suffix — a payment started before this column existed — is already an
     * order number and passes through unchanged.
     */
    public function orderNumberFor(string $reference): string
    {
        return Str::before($reference, '_');
    }

    /**
     * The checkout language for what the client says it is displaying.
     *
     * Falls back rather than refusing: the language is cosmetic and a payment is
     * not, so an unrecognised value costs the customer a Georgian page, not their
     * order. This is also the validation — the value reaches a signed request to
     * the gateway, so it is never passed through as it arrives.
     */
    public function languageFor(?string $requested): string
    {
        return in_array($requested, self::LANGUAGES, true) ? $requested : self::DEFAULT_LANGUAGE;
    }

    /**
     * Create a checkout token for an order. Returns the token, or null if Flitt
     * refused or could not be reached — the caller turns that into a 502.
     */
    public function createCheckoutToken(Order $order, ?string $lang = null, string $stage = 'full'): ?string
    {
        if (! $this->isConfigured()) {
            Log::error('Flitt is not configured — set FLITT_MERCHANT_ID and FLITT_SECRET_KEY.');

            return null;
        }

        $reference = $this->newReference($order, $stage);
        $label = ['deposit' => ' (first 50%)', 'balance' => ' (second 50%)'][$stage] ?? '';

        $params = [
            'order_id'            => $reference,
            'merchant_id'         => $this->merchantId,
            'order_desc'          => "Kere order {$order->order_number}{$label}",
            'amount'              => $this->minorUnits($order, $stage),
            'currency'            => 'GEL',
            'lang'                => $this->languageFor($lang),
            'server_callback_url' => url('/api/payments/flitt/callback'),
            // Carries the id as well as the number: the completion page confirms
            // through /api/orders/{id}/verify-payment, which is keyed by id.
            'response_url'        => url('/checkout/complete?order='.$order->order_number.'&id='.$order->id),
        ];
        $params['signature'] = $this->signature($params);

        try {
            $response = Http::acceptJson()->timeout(20)->post("{$this->apiUrl}/checkout/token", [
                'request' => $params,
            ]);
        } catch (\Throwable $e) {
            Log::error("Flitt token request failed for {$order->order_number}: ".$e->getMessage());

            return null;
        }

        $body = $response->json('response', []);

        if (($body['response_status'] ?? null) !== 'success' || empty($body['token'])) {
            Log::error("Flitt token rejected for {$order->order_number}: ".$response->body());

            return null;
        }

        if (! $this->rememberAttempt($order, $reference)) {
            return null;
        }

        return $body['token'];
    }

    /**
     * Where to send the customer to pay with a token we just minted.
     *
     * Built here rather than in the client so the gateway's address has one
     * home: the client is handed a URL to follow, not a host to assemble.
     */
    public function checkoutUrl(string $token): string
    {
        return "{$this->apiUrl}/checkout?token={$token}";
    }

    /**
     * Ask Flitt for the current state of an order. Returns the response payload
     * (order_status, amount, currency, payment_id, …) or null on failure.
     */
    public function fetchOrderStatus(string $orderNumber): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $params = [
            'order_id'    => $orderNumber,
            'merchant_id' => $this->merchantId,
        ];
        $params['signature'] = $this->signature($params);

        try {
            $response = Http::acceptJson()->timeout(20)->post("{$this->apiUrl}/status/order_id", [
                'request' => $params,
            ]);
        } catch (\Throwable $e) {
            Log::error("Flitt status request failed for {$orderNumber}: ".$e->getMessage());

            return null;
        }

        $body = $response->json('response', []);

        if (($body['response_status'] ?? null) !== 'success') {
            Log::error("Flitt status rejected for {$orderNumber}: ".$response->body());

            return null;
        }

        return $body;
    }

    /**
     * Ask Flitt to give money back on a payment, fully or in part.
     *
     * Returns the response payload — reverse_status is 'approved' or
     * 'processing' when the money is on its way back — or null when Flitt could
     * not be reached, which leaves the outcome unknown: the reverse may have
     * gone through with only the answer lost. The reverse_id is the idempotency
     * key: a retry that sends the same one cannot refund twice.
     */
    public function reverse(string $reference, int $amountMinor, string $reverseId, ?string $comment = null): ?array
    {
        if (! $this->isConfigured()) {
            Log::error('Flitt is not configured — cannot refund '.$reference);

            return null;
        }

        $params = [
            'order_id'    => $reference,
            'merchant_id' => $this->merchantId,
            'amount'      => $amountMinor,
            'currency'    => 'GEL',
            'reverse_id'  => $reverseId,
            'comment'     => $comment ? mb_substr($comment, 0, 1000) : null,
        ];
        $params['signature'] = $this->signature($params);

        try {
            $response = Http::acceptJson()->timeout(30)->post("{$this->apiUrl}/reverse/order_id", [
                'request' => array_filter($params, fn ($value) => $value !== null),
            ]);
        } catch (\Throwable $e) {
            Log::error("Flitt reverse request failed for {$reference}: ".$e->getMessage());

            return null;
        }

        $body = $response->json('response', []);

        if (($body['response_status'] ?? null) !== 'success') {
            Log::error("Flitt reverse rejected for {$reference}: ".$response->body());
        }

        return is_array($body) ? $body : null;
    }

    /**
     * Verify a server callback against our secret. This is the only thing standing
     * between the public callback route and an order being marked paid, so it is
     * compared with hash_equals rather than ===.
     */
    public function verifyCallbackSignature(array $data): bool
    {
        $provided = $data['signature'] ?? null;

        if (! is_scalar($provided) || (string) $provided === '' || ! $this->isConfigured()) {
            return false;
        }

        // Neither field is ever part of the signed set.
        unset($data['signature'], $data['response_signature_string']);

        // The route is public and anyone can post to it, so nothing here may
        // reach the string cast in signature() unchecked: an array or object
        // field turns "Array to string conversion" into a 500 with a stack
        // trace, on an endpoint whose whole contract is to answer 200. Flitt
        // sends flat scalars; anything else is not from Flitt.
        foreach ($data as $value) {
            if ($value !== null && ! is_scalar($value)) {
                return false;
            }
        }

        return hash_equals($this->signature($data), (string) $provided);
    }

    /**
     * A Flitt signature: SHA-1 over the secret followed by every non-empty
     * parameter value, ordered by key and joined with '|'. Empty values are
     * dropped rather than signed as blanks, which is what the gateway does on
     * its side — sign them and every request comes back as an invalid signature.
     */
    public function signature(array $params): string
    {
        unset($params['signature']);

        $params = array_filter($params, fn ($value) => strlen((string) $value) > 0);
        ksort($params);

        return sha1($this->secret.'|'.implode('|', array_values($params)));
    }
}
