import { formatDistance } from 'date-fns';

import { getDateLocale } from '@hooks';

export const formatDate = (date: string | Date, lang = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
};

export const formatDateTime = (date: string | Date, lang = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
};

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
