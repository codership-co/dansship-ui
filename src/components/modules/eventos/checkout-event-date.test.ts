import { describe, expect, it } from 'vitest';

import { checkoutEventDate } from './checkout-event-date';

describe('checkoutEventDate', () => {
  it('formats the date parts and the long label in Bogota time', () => {
    expect(checkoutEventDate('2026-11-28T20:00:00Z')).toEqual({
      weekday: 'SÁB',
      day: '28',
      month: 'NOV',
      longLabel: 'Sáb. 28 de noviembre · 3:00 p. m.',
    });
  });

  it('uses the Bogota calendar day near midnight UTC', () => {
    expect(checkoutEventDate('2026-11-29T02:30:00Z')?.day).toBe('28');
  });

  it('returns null when the date is missing or invalid', () => {
    expect(checkoutEventDate(null)).toBeNull();
    expect(checkoutEventDate('not-a-date')).toBeNull();
  });
});
