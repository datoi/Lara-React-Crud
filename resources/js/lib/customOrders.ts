/**
 * Whether the design studio takes orders. The terms cover remodels and
 * ready-made clothing only (v1.1, §5), so placing a custom order is paused
 * until they cover custom orders too; designing and saving stay open.
 *
 * The server owns the switch (config app.custom_orders_open, which also
 * refuses the order) and states it in a meta tag of the page shell, so the
 * two cannot disagree.
 */
export function customOrdersOpen(): boolean {
    return document.querySelector<HTMLMetaElement>('meta[name="kere-custom-orders"]')?.content === 'open';
}
