<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpCode extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $code,
        public readonly string $firstName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Kere verification code');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.otp-code');
    }
}
