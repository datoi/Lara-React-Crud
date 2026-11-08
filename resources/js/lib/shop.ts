/**
 * Whether the ready-made shop (the marketplace) is shown. It is hidden while
 * nothing is on sale, so customers never land on empty pages, and comes back
 * by itself with the first product (owner's decision, 2026-11-08).
 *
 * The server decides (Product::shopIsOpen) and states it in a meta tag of the
 * page shell, so the answer is there before anything renders. Without the tag
 * the shop shows, as it always did.
 */
export function shopOpen(): boolean {
    return document.querySelector<HTMLMetaElement>('meta[name="kere-shop"]')?.content !== 'closed';
}
