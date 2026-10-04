import type { TFunction } from 'i18next';

/**
 * Calendar days (`YYYY-MM-DD`) as the API sends them for dates with no time,
 * such as the day a customer needs an order by.
 */

/** Tomorrow as a calendar day: the earliest "needed by" date the API accepts. */
export function tomorrowCalendarDay(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A calendar day written out in the interface language, e.g. "14 October 2026".
 * The month names come from the locale files rather than `toLocaleDateString`:
 * Chrome ships no Georgian date data and silently formats `ka-GE` in English.
 * Reading the string's parts directly also avoids `new Date('2026-10-14')`,
 * which is UTC midnight and so the previous day anywhere west of UTC.
 */
export function formatCalendarDay(day: string, t: TFunction): string {
    const [year, month, date] = day.split('-').map(Number);
    return t('calendar.day', { day: date, month: t(`calendar.months.${month}`), year });
}
