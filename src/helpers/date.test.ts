import { describe, expect, it } from 'vitest';

import { colombiaCalendarDaysUntil } from './date';

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
