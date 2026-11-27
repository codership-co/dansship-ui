import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ageInColombia,
  colombiaCalendarDaysUntil,
  colombiaToday,
  formatCalendarDay,
  parseCalendarDay,
  toCalendarDay,
} from './date';

/** Runs the block with the process clock in Bogota (UTC-5), where UTC midnight is the day before. */
function inBogotaTimezone() {
  const previousTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'America/Bogota';
  });

  afterAll(() => {
    process.env.TZ = previousTimezone;
  });
}

describe('formatCalendarDay', () => {
  inBogotaTimezone();

  it('shows the API calendar day as that same day, not the day before', () => {
    expect(formatCalendarDay('2027-01-31', 'es')).toBe('31 de enero de 2027');
    expect(formatCalendarDay('2026-12-01', 'es')).toBe('1 de diciembre de 2026');
  });
});

describe('parseCalendarDay', () => {
  inBogotaTimezone();

  it('keeps the same calendar day in Bogota', () => {
    const parsed = parseCalendarDay('1995-03-10');

    expect(parsed?.getFullYear()).toBe(1995);
    expect(parsed?.getMonth()).toBe(2);
    expect(parsed?.getDate()).toBe(10);
  });

  it('keeps the first day of the year in the same year', () => {
    const parsed = parseCalendarDay('2000-01-01');

    expect([parsed?.getFullYear(), parsed?.getMonth(), parsed?.getDate()]).toEqual([2000, 0, 1]);
  });

  it('ignores a time part and keeps the calendar day', () => {
    expect(parseCalendarDay('1995-03-10T00:00:00Z')?.getDate()).toBe(10);
  });

  it('returns undefined for an empty or invalid value', () => {
    expect(parseCalendarDay(undefined)).toBeUndefined();
    expect(parseCalendarDay(null)).toBeUndefined();
    expect(parseCalendarDay('')).toBeUndefined();
    expect(parseCalendarDay('not-a-date')).toBeUndefined();
  });
});

describe('toCalendarDay', () => {
  inBogotaTimezone();

  it('sends the picked day as that same calendar day', () => {
    expect(toCalendarDay(new Date(1995, 2, 10))).toBe('1995-03-10');
    expect(toCalendarDay(new Date(2000, 0, 1))).toBe('2000-01-01');
  });

  it('round-trips with parseCalendarDay', () => {
    expect(toCalendarDay(parseCalendarDay('2009-02-28') as Date)).toBe('2009-02-28');
  });
});

describe('colombiaToday', () => {
  inBogotaTimezone();

  it('is the Bogota calendar day, not the UTC one', () => {
    // 03:00 UTC on Nov 27 is still Nov 26 at 10 p. m. in Bogota.
    expect(toCalendarDay(colombiaToday(new Date('2026-11-27T03:00:00Z')))).toBe('2026-11-26');
  });

  it('is local midnight', () => {
    const today = colombiaToday(new Date('2026-11-26T15:00:00Z'));

    expect([today.getHours(), today.getMinutes()]).toEqual([0, 0]);
  });
});

describe('ageInColombia', () => {
  inBogotaTimezone();

  // Built inside each test, once the clock is in Bogota.
  const birthDate = () => parseCalendarDay('2010-11-26') as Date;

  it('adds the year on the birthday itself', () => {
    expect(ageInColombia(birthDate(), new Date('2026-11-26T15:00:00Z'))).toBe(16);
  });

  it('does not add the year the day before the birthday', () => {
    expect(ageInColombia(birthDate(), new Date('2026-11-25T15:00:00Z'))).toBe(15);
  });

  it('uses the Bogota day: the night before in Bogota is still the day before', () => {
    // 03:00 UTC on Nov 26 is Nov 25 at 10 p. m. in Bogota.
    expect(ageInColombia(birthDate(), new Date('2026-11-26T03:00:00Z'))).toBe(15);
  });

  it('counts a February 29 birthday from March 1 in a non-leap year', () => {
    const leapDay = parseCalendarDay('2008-02-29') as Date;

    expect(ageInColombia(leapDay, new Date('2026-02-28T15:00:00Z'))).toBe(17);
    expect(ageInColombia(leapDay, new Date('2026-03-01T15:00:00Z'))).toBe(18);
  });
});

describe('colombiaCalendarDaysUntil', () => {
  // 10:46 a. m. in Bogota on Nov 13.
  const expiration = '2026-11-13T15:46:57Z';

  it('counts the day before the last day as 1, even with fewer than 24 hours left', () => {
    expect(colombiaCalendarDaysUntil(expiration, new Date('2026-11-12T20:00:00Z'))).toBe(1);
  });

  it('is 0 during the whole last day, even after the expiry hour', () => {
    expect(colombiaCalendarDaysUntil(expiration, new Date('2026-11-13T09:00:00Z'))).toBe(0);
    expect(colombiaCalendarDaysUntil(expiration, new Date('2026-11-13T23:00:00Z'))).toBe(0);
  });

  it('is negative once the last day has passed', () => {
    expect(colombiaCalendarDaysUntil(expiration, new Date('2026-11-14T06:00:00Z'))).toBe(-1);
  });

  it('uses the Bogota calendar, not UTC', () => {
    // 03:00 UTC on Nov 13 is still Nov 12 at 10 p. m. in Bogota.
    expect(colombiaCalendarDaysUntil(expiration, new Date('2026-11-13T03:00:00Z'))).toBe(1);
  });
});
