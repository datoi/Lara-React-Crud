/**
 * Georgian Lari, formatted one way everywhere.
 *
 * The designer shows prices in two registers on the same screen — a running
 * total and the surcharge a tile adds — and they were drifting apart: ₾45.00
 * beside +₾5. Two decimals always, and the leading sign only where the number
 * is a change rather than an amount.
 */
export function money(amount: number, signed = false): string {
    const sign = amount < 0 ? '-' : signed ? '+' : '';

    return `${sign}₾${Math.abs(amount).toFixed(2)}`;
}
