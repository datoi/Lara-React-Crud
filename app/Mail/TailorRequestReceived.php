<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TailorRequestReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public User  $tailor,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'A Tailor Wants to Make Your Design — ' . $this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tailor-request-received',
        );
    }
}
