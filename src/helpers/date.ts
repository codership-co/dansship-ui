import { addDays, differenceInCalendarDays, differenceInMinutes, format, formatDistance, parseISO } from 'date-fns';

import { getDateLocale } from '@hooks';

const COLOMBIA_TIMEZONE = 'America/Bogota';
const COLOMBIA_UTC_OFFSET_HOURS = 5;

const colombiaDay = (value: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: COLOMBIA_TIMEZONE }).format(value);

/**
 * Calendar days from today to `target` in the academy's calendar (America/Bogota):
 * 0 on the last day, 1 the day before, negative once it has passed. The API
 * counts a plan as valid through its whole last day, so 24-hour blocks would
 * call a plan expired hours too early.
 */
export const colombiaCalendarDaysUntil = (target: string | Date, now: Date = new Date()): number =>
  differenceInCalendarDays(
    parseISO(colombiaDay(typeof target === 'string' ? new Date(target) : target)),
    parseISO(colombiaDay(now)),
  );

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
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  if (asDate) {
    return monday;
  }

  return format(monday, 'yyyy-MM-dd');
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

export function toColombiaDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  return date.toLocaleDateString('en-CA', { timeZone: COLOMBIA_TIMEZONE });
}

export function isColombiaSeptember(value: Date | string = new Date()): boolean {
  return toColombiaDateKey(value).slice(5, 7) === '09';
}

export function colombiaDayStartUtc(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day, COLOMBIA_UTC_OFFSET_HOURS, 0, 0, 0)).toISOString();
}

export function getColombiaWeekRangeUtc(weekMonday: string) {
  return {
    startAt: colombiaDayStartUtc(weekMonday),
    endAt: colombiaDayStartUtc(getNextMonday(weekMonday)),
  };
}

export function formatTimeDifference(dateLeft: Date | string, dateRight: Date | string) {
  const totalMinutes = differenceInMinutes(dateLeft, dateRight);

  if (totalMinutes < 60) {
    return `${totalMinutes} m`;
  }

  const hours = Math.floor(totalMinutes / 60);

  return `${hours} h`;
}
