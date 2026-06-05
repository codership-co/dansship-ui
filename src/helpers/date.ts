import { formatDistance } from 'date-fns';

import { getDateLocale } from '@hooks';

/**
 * Format a date as "Month Year" respecting the given language.
 * @param lang - i18n language code (e.g. 'en', 'es'). Defaults to 'en'.
 */
export const formatDate = (date: string | Date, lang = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
};

/**
 * Return a human-readable relative time string using date-fns (locale-aware).
 * @param lang - i18n language code (e.g. 'en', 'es'). Defaults to 'en'.
 */
export const getRelativeTime = (date: string | Date, lang = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
    locale: getDateLocale(lang),
  });
};

export function toIsoDayStart(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  return start.toISOString();
}

export function toIsoDayEnd(date: Date): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return end.toISOString();
}
