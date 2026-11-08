/**
 * The delivery fee a new order pays, in lari. The server owns it
 * (config app.shipping_cost, the SHIPPING_COST variable; 0 while delivery is
 * free) and states it in a meta tag of the page shell, so pages show the right
 * fee before any request returns. An existing order shows its own stored fee.
 */
export function deliveryFee(): number {
    const fee = Number(document.querySelector<HTMLMetaElement>('meta[name="kere-delivery-fee"]')?.content);

    return Number.isFinite(fee) && fee >= 0 ? fee : 0;
}
