<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Asks an adult to confirm that a sixteen- or seventeen-year-old may use Kere.
 *
 * Carries the one and only copy of the consent token: the database keeps a hash,
 * so this email is the sole route to the link. Losing it means asking the
 * customer to send it again, which is the right trade for a link that authorises
 * someone else's account.
 */
class GuardianConsentRequest extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $customer,
        public string $consentUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kere — consent needed for '.$this->customer->getFullName(),
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.guardian-consent-request');
    }
}
