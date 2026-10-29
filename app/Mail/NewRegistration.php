<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Tells Kere that someone has registered, at the address REGISTRATION_ALERT_EMAIL
 * names. It carries the name and the role only: contact details stay in the
 * admin panel rather than in an inbox.
 */
class NewRegistration extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        $who = $this->user->role === 'tailor' ? 'მკერავი' : 'მომხმარებელი';

        return new Envelope(
            subject: "ახალი რეგისტრაცია Kere-ზე: {$who} — {$this->user->getFullName()}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-registration',
        );
    }
}
