<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Kere's offer on a request (terms §8): price, delivery, completion time and,
 * for a remodel, the first payment. It names no tailor — the customer's
 * contract is with Kere alone (terms §3).
 */
class OfferSent extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kere-ის შეთავაზება თქვენს შეკვეთაზე — '.$this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.offer-sent',
            with: ['offer' => $this->order->offerSummary()],
        );
    }
}
