<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupportRequest extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User   $user,
        public string $subject,
        public string $body,
    ) {}

    public function envelope(): Envelope
    {
        $senderName = trim(($this->user->first_name ?? '') . ' ' . ($this->user->last_name ?? '')) ?: $this->user->email;

        return new Envelope(
            subject:  '[Kere Support] ' . $this->subject,
            replyTo: [new Address($this->user->email, $senderName)],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.support-request',
        );
    }
}
