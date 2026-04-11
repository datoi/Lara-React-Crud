<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public string $statusMessage;

    public function __construct(public Order $order, public string $newStatus)
    {
        $this->statusMessage = match ($newStatus) {
            'processing' => 'Your order is being carefully crafted by your tailor.',
            'shipped'    => 'Your order has been shipped and is on its way to you!',
            'finished'   => 'Your order is finished and ready for delivery.',
            'delivered'  => 'Your order has been delivered. Enjoy your new garment!',
            'cancelled'  => 'Unfortunately, your order has been cancelled. Please contact support if you have questions.',
            default      => 'Your order status has been updated.',
        };
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order ' . $this->order->order_number . ' — Status Updated',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-status-updated',
        );
    }
}
