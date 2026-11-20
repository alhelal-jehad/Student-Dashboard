import { currentLocale } from './index';

/** The API stores UTC ISO strings. Display uses the user's own time zone via Intl. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(currentLocale(), { dateStyle: 'medium' }).format(new Date(iso));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(currentLocale()).format(value);
}

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(currentLocale(), { style: 'currency', currency }).format(value);
}
