/**
 * The card schemes Kere accepts, as artwork rather than the words "VISA" and "MC".
 *
 * Both files are cut out on transparency, so they sit on whatever is behind them
 * and carry no plate of their own, and each is served at twice its rendered height
 * to stay sharp. The intrinsic width and height are the real file dimensions, so
 * the box is reserved and nothing shifts as the images load.
 *
 * The label and the surrounding type come from the caller: the footer and the
 * cart summary sit on different backgrounds and set text differently. The row
 * itself is the only thing this owns, which is what keeps the two in step.
 */
export function PaymentMarks({ label, className = '' }: { label?: string; className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            {label && <span>{label}</span>}
            <img src="/assets/payment/visa.png" alt="Visa" width={198} height={64} loading="lazy" className="h-5 w-auto" />
            <img src="/assets/payment/mastercard.png" alt="Mastercard" width={102} height={64} loading="lazy" className="h-5 w-auto" />
        </div>
    );
}
