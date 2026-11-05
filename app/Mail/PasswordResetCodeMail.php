<?php

namespace App\Mail;

use App\Models\PasswordResetCode;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public int $minutes = PasswordResetCode::LIFETIME_MINUTES;

    public function __construct(
        public readonly string $code,
        public readonly string $firstName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Kere — პაროლის აღდგენის კოდი');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.password-reset-code');
    }
}
