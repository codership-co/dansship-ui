import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { useTranslation } from 'react-i18next';

import type { Locale } from 'date-fns';

const localeMap: Record<string, Locale> = {
  en: enUS,
  es: es,
};

/**
 * Returns the date-fns Locale that matches the current i18n language.
 * Usage: `format(date, 'MMM d, yyyy', { locale })`
 */
export function useDateLocale(): Locale {
  const { i18n } = useTranslation();

  return localeMap[i18n.language] ?? enUS;
}

/**
 * Non-hook helper for getting locale from a language code.
 * Useful inside utility functions that receive the language code.
 */
export function getDateLocale(lang: string): Locale {
  return localeMap[lang] ?? enUS;
}
