/**
 * Kere's own merchant identity.
 *
 * A card acquirer requires a shopper to be able to find and contact the
 * merchant without going through their bank, so these have to be published
 * rather than only held in the Flitt portal. They live here, once, because the
 * identification code and the phone number are facts rather than copy: the same
 * digits in both locales, and a number that drifted between the footer and the
 * terms would be worse than one that was missing.
 *
 * The legal name and the address do differ per locale and are translated —
 * `company.legalName` and `company.address` in `en.json` / `ka.json`.
 */

/** Public Registry identification code for შპს კერე შენთვის */
export const COMPANY_ID_CODE = '406562376';

/** As a customer should read it */
export const COMPANY_PHONE = '+995 597 03 23 48';

/** The same number with the spaces taken out, for `tel:` */
export const COMPANY_PHONE_HREF = '+995597032348';

export const COMPANY_EMAIL = 'kereforyou@gmail.com';
