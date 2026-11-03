import { format, type Locale } from 'date-fns';

import { toColombiaDateKey } from '@helpers';

const MONTHS_BACK = 12;
const MONTHS_AHEAD = 1;

export function toMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthKey(key: string) {
  const [year, month] = key.split('-').map(Number);

  return { year, month };
}

/** Month keys (YYYY-MM) around the current Bogotá month, newest first. */
export function buildMonthKeys(now: Date = new Date()) {
  const [year, month] = toColombiaDateKey(now).split('-').map(Number);
  const keys: Array<string> = [];

  for (let offset = MONTHS_AHEAD; offset >= -MONTHS_BACK; offset -= 1) {
    const date = new Date(year, month - 1 + offset, 1);

    keys.push(toMonthKey(date.getFullYear(), date.getMonth() + 1));
  }

  return keys;
}

export function formatMonthLabel(year: number, month: number, locale: Locale) {
  const label = format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale });

  return label.charAt(0).toUpperCase() + label.slice(1);
}
