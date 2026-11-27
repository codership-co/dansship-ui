import { describe, expect, it } from 'vitest';

import { minorBookingToastKey } from './use-my-bookings';

import { DANSSHIP_ERROR_CODE } from '@core/api';

describe('minorBookingToastKey', () => {
  it('speaks of the companion only when one was sent', () => {
    expect(minorBookingToastKey(DANSSHIP_ERROR_CODE.ACTING_FOR_FORBIDDEN, true)).toBe('bookings:companionNotInFamily');
    expect(minorBookingToastKey(DANSSHIP_ERROR_CODE.MANAGED_AGE_RANGE, true)).toBe('bookings:companionMinorCannotBook');
  });

  it('speaks of the attendee when no companion was sent', () => {
    expect(minorBookingToastKey(DANSSHIP_ERROR_CODE.ACTING_FOR_FORBIDDEN, false)).toBe('bookings:attendeeNotInCare');
    expect(minorBookingToastKey(DANSSHIP_ERROR_CODE.MANAGED_ACCOUNT_INACTIVE, false)).toBe('bookings:minorCannotBook');
    expect(minorBookingToastKey(DANSSHIP_ERROR_CODE.MANAGED_NO_ACTIVE_GUARDIAN, false)).toBe(
      'bookings:minorCannotBook',
    );
  });
});
