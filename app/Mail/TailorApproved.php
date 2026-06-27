<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TailorApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $tailor) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to Kere — Your Account is Approved!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tailor-approved',
        );
    }
}
