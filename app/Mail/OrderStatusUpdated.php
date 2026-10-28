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

    public string $statusLabel;

    public string $statusMessage;

    public function __construct(public Order $order, public string $newStatus)
    {
        // The same words the customer's dashboard uses for each status.
        $this->statusLabel = match ($newStatus) {
            'processing' => 'პროცესშია',
            'shipped'    => 'გაიგზავნა',
            'finished'   => 'დამთავრდა',
            'delivered'  => 'ჩამოვიდა',
            'cancelled'  => 'გაუქმებულია',
            default      => $newStatus,
        };

        $this->statusMessage = match ($newStatus) {
            'processing' => 'მკერავმა დაიწყო მუშაობა თქვენს შეკვეთაზე.',
            'shipped'    => 'შეკვეთა კურიერს გადაეცა და მალე მოგიტანთ.',
            'finished'   => $order->paymentStageDue() === 'balance'
                ? 'სამოსი მზადაა. ნახეთ მისი ფოტოები და გადაიხადეთ დარჩენილი ₾'.number_format($order->amountDue('balance'), 2).' თქვენს პანელზე — ამის შემდეგ სამოსს კურიერი დაგიბრუნებთ.'
                : 'შეკვეთა მზადაა და მალე კურიერს გადაეცემა.',
            'delivered'  => 'შეკვეთა ჩაბარებულია. თუ რამე პრობლემაა, შეგვატყობინეთ შეკვეთის გვერდიდან 24 საათში, ფოტოებით. ასევე შეგიძლიათ დატოვოთ შეფასება.',
            'cancelled'  => 'სამწუხაროდ, შეკვეთა გაუქმდა. თუ თანხა უკვე გადაიხადეთ, ის ბარათზე დაგიბრუნდებათ. კითხვების შემთხვევაში დაგვიკავშირდით.',
            default      => 'შეკვეთის სტატუსი განახლდა.',
        };
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'შეკვეთის სტატუსი განახლდა — '.$this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-status-updated',
        );
    }
}
