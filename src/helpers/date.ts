import { addDays, differenceInMinutes, format, formatDistance, parseISO } from 'date-fns';

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

export function getMonday(d: Date): string;
export function getMonday(d: Date, asDate: true): Date;
export function getMonday(d: Date, asDate: false): string;
export function getMonday(d: Date, asDate = false): Date | string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -5 : 1);
  const finalDate = new Date(date.setDate(diff));

  if (asDate) {
    return finalDate;
  }

  return format(finalDate, 'yyyy-MM-dd');
}

export function addDaysToFormat(date: string, days: number) {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd');
}

export function getNextMonday(mondayStr: string) {
  return addDaysToFormat(mondayStr, 7);
}

export function getPrevMonday(mondayStr: string) {
  return addDaysToFormat(mondayStr, -7);
}

export function formatTimeDifference(dateLeft: Date | string, dateRight: Date | string) {
  const totalMinutes = differenceInMinutes(dateLeft, dateRight);

  if (totalMinutes < 60) {
    return `${totalMinutes} m`;
  }

  const hours = Math.floor(totalMinutes / 60);

  return `${hours} h`;
}
