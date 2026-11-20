import i18next from 'i18next';
import en from './locales/en.json';

export type Locale = 'en' | 'ar';
export const LOCALES: readonly Locale[] = ['en', 'ar'];
const RTL: ReadonlySet<Locale> = new Set(['ar']);
const STORAGE_KEY = 'locale'; // non-sensitive preference; tokens never go in web storage

// English ships in the entry chunk. Other locales load on demand to protect the JS budget.
const loaders: Record<Exclude<Locale, 'en'>, () => Promise<{ default: object }>> = {
  ar: () => import('./locales/ar.json'),
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function savedLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

export async function initI18n(locale: Locale): Promise<void> {
  await i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: en } },
    // Safe: we never render translated strings as HTML, only via textContent.
    interpolation: { escapeValue: false },
  });
  await setLocale(locale);
}

export async function setLocale(locale: Locale): Promise<void> {
  if (locale !== 'en' && !i18next.hasResourceBundle(locale, 'translation')) {
    i18next.addResourceBundle(locale, 'translation', (await loaders[locale]()).default);
  }
  await i18next.changeLanguage(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL.has(locale) ? 'rtl' : 'ltr';
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable: preference just isn't remembered */
  }
}

export function currentLocale(): Locale {
  return isLocale(i18next.language) ? i18next.language : 'en';
}

export const t = (key: string, options?: Record<string, unknown>): string =>
  options ? i18next.t(key, options) : i18next.t(key);
