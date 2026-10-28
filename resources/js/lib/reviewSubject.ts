import type { TFunction } from 'i18next';

/** What a review is about, as the API states it: the kind of order, and a ready-made piece's name. */
export interface ReviewSubject {
    kind: 'marketplace' | 'custom' | 'remodel' | null;
    product_name: string | null;
}

/** The product's name for a ready-made piece, otherwise the kind of order. */
export function reviewSubject({ kind, product_name }: ReviewSubject, t: TFunction): string {
    if (kind === 'marketplace' && product_name) return product_name;
    return kind ? t(`reviewKind.${kind}`) : '';
}
