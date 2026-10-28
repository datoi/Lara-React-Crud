<?php

use App\Mail\GuardianConsentRequest;
use App\Mail\NewOrderAlert;
use App\Mail\OfferSent;
use App\Mail\OrderConfirmation;
use App\Mail\OrderStatusUpdated;
use App\Mail\OtpCode;
use App\Mail\TailorApproved;
use App\Mail\TailorRejected;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TailorRequest;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Str;

/**
 * Every email to a customer or tailor is written in Georgian (owner's rule,
 * 2026-10-14): a Georgian subject, a Georgian page, and none of the English
 * wording the templates used to carry.
 */
function mailOrder(string $type, array $attributes = []): Order
{
    $customer = User::factory()->create(['role' => 'customer', 'first_name' => 'ნინო', 'last_name' => 'ბერიძე']);

    $order = Order::create(array_merge([
        'user_id' => $customer->id,
        'order_number' => ($type === 'remodel' ? 'RMD-' : 'ORD-').Str::upper(Str::random(8)),
        'order_type' => $type,
        'status' => 'pending',
        'payment_status' => $type === 'marketplace' ? 'paid' : 'not_required',
        'subtotal' => 100, 'shipping' => 15, 'total' => 115,
        'first_name' => 'ნინო', 'last_name' => 'ბერიძე', 'email' => $customer->email,
        'address' => 'N/A', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
    ], $attributes));

    if ($type === 'marketplace') {
        OrderItem::create(['order_id' => $order->id, 'product_name' => 'Linen Dress', 'color' => '#000000', 'size' => 'M', 'quantity' => 1, 'price' => 100]);
    }

    return $order;
}

/** Kere's offer on an open request, priced apart from the tailor's estimate behind it. */
function withOffer(Order $order, User $tailor): Order
{
    $estimate = TailorRequest::create(['order_id' => $order->id, 'tailor_id' => $tailor->id, 'offered_price' => 100, 'ready_in_days' => 5, 'status' => 'pending']);
    $order->update(['offer_request_id' => $estimate->id, 'offer_price' => 120, 'offer_days' => 6, 'offer_sent_at' => now()]);

    return $order;
}

function expectGeorgian($mailable): void
{
    $html = $mailable->render();

    expect($mailable->envelope()->subject)->toMatch('/\p{Georgian}/u')
        ->and($html)->toContain('lang="ka"')
        ->and($html)->toMatch('/\p{Georgian}/u');

    // What a reader sees, not the link addresses (which say "dashboard").
    $text = strip_tags(preg_replace('/<style.*?<\/style>/s', '', $html));

    foreach (['Hi ', 'Your order', 'dashboard', 'Order #', 'Questions?', 'Thank you'] as $english) {
        expect($text)->not->toContain($english);
    }
}

test('every email to customers and tailors is Georgian', function () {
    $tailor = User::factory()->create(['role' => 'tailor', 'first_name' => 'გიორგი', 'last_name' => 'მკერავი', 'specialty' => 'კაბები', 'years_experience' => 5]);
    $minor = User::factory()->create(['role' => 'customer', 'first_name' => 'ანა', 'last_name' => 'კაპანაძე', 'guardian_relationship' => 'parent']);
    $marketplace = mailOrder('marketplace');
    $remodel = mailOrder('remodel', ['status' => 'pending_assignment']);
    $custom = mailOrder('custom', ['status' => 'pending_assignment']);

    $mailables = [
        new OtpCode('123456', 'ნინო'),
        new OrderConfirmation($marketplace),
        new OrderConfirmation($remodel),
        new OrderConfirmation(mailOrder('custom', ['status' => 'pending_assignment'])),
        new NewOrderAlert($marketplace, $marketplace->user),
        new NewOrderAlert($remodel, $remodel->user),
        new OfferSent(withOffer($remodel, $tailor)),
        new OfferSent(withOffer($custom, $tailor)),
        new TailorApproved($tailor),
        new TailorRejected($tailor, 'პორტფოლიო არ არის სრული'),
        new GuardianConsentRequest($minor, 'https://kereforyou.com/guardian-consent/x'),
    ];

    foreach (['processing', 'shipped', 'finished', 'delivered', 'cancelled'] as $status) {
        $mailables[] = new OrderStatusUpdated($marketplace, $status);
    }

    foreach ($mailables as $mailable) {
        expectGeorgian($mailable);
    }
});

test('the rejection email shows the reason the admin gave', function () {
    $tailor = User::factory()->create(['role' => 'tailor', 'first_name' => 'გიორგი']);

    expect((new TailorRejected($tailor, 'პორტფოლიო არ არის სრული'))->render())->toContain('პორტფოლიო არ არის სრული');
});

test('the code email states how long the code really lasts', function () {
    expect((new OtpCode('123456', 'ნინო'))->render())->toContain(Verification::LIFETIME_MINUTES.' წუთის');
});

test('an offer email carries Kere\'s price and days, and names no tailor', function () {
    $tailor = User::factory()->create(['role' => 'tailor', 'first_name' => 'გიორგი', 'last_name' => 'მკერავიძე']);
    $remodel = withOffer(mailOrder('remodel', ['status' => 'pending_assignment']), $tailor);

    // ₾120 + ₾15 delivery = ₾135; the first payment is ₾60 + ₾15.
    expect((new OfferSent($remodel))->render())
        ->toContain('₾120.00')
        ->toContain('₾135.00')
        ->toContain('₾75.00')
        ->toContain('6 დღეში')
        ->not->toContain('მკერავიძე')
        ->not->toContain('₾100.00');
});

test('a finished paid remodel asks for the second half by amount', function () {
    $remodel = mailOrder('remodel', ['status' => 'finished', 'payment_status' => 'deposit_paid', 'deposit_amount' => 65]);

    expect((new OrderStatusUpdated($remodel, 'finished'))->render())->toContain('₾50.00');
});
