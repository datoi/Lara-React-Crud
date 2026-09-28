import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Check, FileText, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { getAuthToken } from '../../hooks/useAuth';
import DesignSpecList, { readProductName, readSpec } from '../DesignSpecList';
import { ProductImage } from '../marketplace/ProductImage';
import { OpenDesignPicture } from './OpenDesignPicture';
import { isImageUrl, type OpenOrder, type StudioProduct } from './openOrders';

/**
 * Everything a tailor needs to decide on one open request, and the offer
 * itself: the picture large, then what the customer asked for, then the form.
 */
export function OpenDesignDialog({ order, product, title, dateLabel, onClose, onRequested, returnFocusTo }: {
    order: OpenOrder | null;
    product: StudioProduct | null;
    title: string;
    dateLabel: string;
    onClose: () => void;
    onRequested: (orderId: number) => void;
    /** The card that opened the dialog, which gets focus back when it closes */
    returnFocusTo: HTMLElement | null;
}) {
    const { t } = useTranslation();

    return (
        <Dialog.Root open={order !== null} onOpenChange={open => { if (!open) onClose(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[150] bg-[#2a1418]/30" />
                <Dialog.Content
                    className="kere-modal fixed left-1/2 top-1/2 z-[151] max-h-[90dvh] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
                    aria-describedby={undefined}
                    onCloseAutoFocus={event => {
                        event.preventDefault();
                        returnFocusTo?.focus();
                    }}
                >
                    {order && (
                        <OpenDesignDetails
                            // Remounting per order resets the offer form, so a draft
                            // for one request never carries over to the next.
                            key={order.id}
                            order={order}
                            product={product}
                            title={title}
                            dateLabel={dateLabel}
                            onRequested={onRequested}
                        />
                    )}
                    <Dialog.Close className="absolute right-3 top-3 p-2" aria-label={t('newsletterPopup.close')}>
                        <X size={18} />
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function OpenDesignDetails({ order, product, title, dateLabel, onRequested }: {
    order: OpenOrder;
    product: StudioProduct | null;
    title: string;
    dateLabel: string;
    onRequested: (orderId: number) => void;
}) {
    const { t } = useTranslation();
    const token = getAuthToken();
    const [message, setMessage] = useState('');
    const [price, setPrice] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    const design = order.custom_design_data;
    const isRemodel = order.order_type === 'remodel';
    const remodelImages = design?.remodel_images ?? [];
    const fileUrl = design?.design_file_url;
    const spec = readSpec(design?.customization);
    const alreadyRequested = order.my_request_status === 'pending';
    const priceMissing = isRemodel && price.trim() === '';

    const handleSend = async () => {
        if (!token || sending) return;
        setSending(true);
        setSendError(null);
        try {
            const res = await fetch(`/api/tailor/orders/${order.id}/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: JSON.stringify({
                    message: message.trim() || null,
                    offered_price: price.trim() !== '' ? Number(price) : null,
                }),
            });
            if (!res.ok) throw new Error();
            onRequested(order.id);
        } catch {
            setSendError(t('tailorComponents.offerFailed'));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:p-6">
            <div className="space-y-2">
                <div className="aspect-square overflow-hidden border border-slate-200">
                    <OpenDesignPicture order={order} product={product} label={title} />
                </div>
                {isRemodel && remodelImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-1.5">
                        {remodelImages.slice(1).map((src, idx) => (
                            <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden border border-slate-200">
                                <ProductImage src={src} alt={`${title} ${idx + 2}`} className="h-full w-full object-cover" loading="lazy" />
                            </a>
                        ))}
                    </div>
                )}
                {!isRemodel && fileUrl && !isImageUrl(fileUrl) && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-slate-600 underline underline-offset-4">
                        <FileText className="h-3.5 w-3.5" /> {t('tailorComponents.openDesignFile')}
                    </a>
                )}
            </div>

            <div className="min-w-0 space-y-4">
                <div className="pr-8">
                    <Dialog.Title>{title}</Dialog.Title>
                    <p className="mt-1 text-xs text-slate-500">
                        {order.customer.name} · {dateLabel} · <span className="font-mono">{order.order_number}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{t('tailorComponents.offersSoFar', { count: order.requests_count })}</p>
                </div>

                {isRemodel && design?.change_request && (
                    <DetailBlock label={t('tailorComponents.remodelChangeLabel')}>{design.change_request}</DetailBlock>
                )}
                {isRemodel && order.expected_price != null && (
                    <DetailBlock label={t('tailorComponents.remodelExpectedPrice')}>₾{order.expected_price}</DetailBlock>
                )}

                {spec.length > 0 && (
                    <DesignSpecList spec={spec} garment={readProductName(design?.customization)} label={t('tailorComponents.studioSpec')} />
                )}

                <DetailBlock label={t('measurements.providedTitle')}>
                    {order.measurements_count > 0
                        ? t('measurements.countForBidders', { count: order.measurements_count })
                        : t('measurements.noneForBidders')}
                </DetailBlock>

                {design?.customization_request && (
                    <DetailBlock label={t('tailorComponents.customizationRequest')}>{design.customization_request}</DetailBlock>
                )}
                {design?.tailor_notes && (
                    <DetailBlock label={t('tailorComponents.customNotesSection')}>{design.tailor_notes}</DetailBlock>
                )}

                <div className="border-t border-slate-200 pt-4">
                    {alreadyRequested ? (
                        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <Check className="h-3.5 w-3.5" /> {t('tailorComponents.offerSentBadge')}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {isRemodel && (
                                <div>
                                    <label htmlFor={`offer-price-${order.id}`} className="mb-1 block text-xs font-medium text-slate-600">
                                        {t('tailorComponents.offerPriceLabel')}
                                    </label>
                                    <div className="relative max-w-[180px]">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₾</span>
                                        <input
                                            id={`offer-price-${order.id}`}
                                            type="number"
                                            min="0"
                                            inputMode="decimal"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            placeholder={t('tailorComponents.offerPricePlaceholder')}
                                            className="w-full border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        />
                                    </div>
                                </div>
                            )}
                            <label htmlFor={`offer-message-${order.id}`} className="block text-xs font-medium text-slate-600">
                                {t('tailorComponents.offerMessageLabel')}
                            </label>
                            <textarea
                                id={`offer-message-${order.id}`}
                                value={message}
                                onChange={e => setMessage(e.target.value.slice(0, 500))}
                                placeholder={t('tailorComponents.offerMessagePlaceholder')}
                                rows={3}
                                maxLength={500}
                                className="w-full resize-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            {sendError && <p role="alert" className="text-xs text-destructive">{sendError}</p>}
                            {priceMissing && <p className="text-xs text-slate-400">{t('tailorComponents.offerPriceRequired')}</p>}
                            <Button variant="default" size="sm" onClick={handleSend} disabled={sending || priceMissing} className="text-xs">
                                {sending
                                    ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t('tailorComponents.offerSending')}</>
                                    : t('tailorComponents.offerSendBtn')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="whitespace-pre-line text-sm text-slate-700">{children}</p>
        </div>
    );
}
