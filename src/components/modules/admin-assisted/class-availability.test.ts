import { describe, expect, it } from 'vitest';

import { classAvailability } from './class-availability';

import type { AssistedBookingItem } from '@core/api';

const NOW = new Date('2026-11-06T12:00:00Z');

const slot = (id: string, start: string, end: string) => ({ id, start_time: start, end_time: end });

const booking = (
  classId: string,
  status: AssistedBookingItem['status'],
  start: string,
  end: string,
  extra: Partial<AssistedBookingItem> = {},
) =>
  ({
    id: `booking-${classId}`,
    scheduled_class_id: classId,
    status,
    start_time: start,
    end_time: end,
    can_reimburse: false,
    ...extra,
  }) as AssistedBookingItem;

const FUTURE = slot('future', '2026-11-10T18:00:00Z', '2026-11-10T19:00:00Z');
const HELD = slot('held', '2026-11-05T18:00:00Z', '2026-11-05T19:00:00Z');

describe('classAvailability', () => {
  it('is free when the person has nothing', () => {
    expect(classAvailability(FUTURE, [], NOW)).toEqual({ kind: 'free', cancelled: undefined });
  });

  it('flags a booking on a class that has not happened as reserved', () => {
    const own = booking('future', 'active', FUTURE.start_time, FUTURE.end_time);

    expect(classAvailability(FUTURE, [own], NOW).kind).toBe('reserved');
  });

  it('marks the existing booking instead of creating another when the class already happened', () => {
    const own = booking('held', 'active', HELD.start_time, HELD.end_time);

    expect(classAvailability(HELD, [own], NOW)).toEqual({ kind: 'markAttendance', booking: own });
  });

  it('reports attended and no-show bookings', () => {
    expect(classAvailability(HELD, [booking('held', 'attended', HELD.start_time, HELD.end_time)], NOW).kind).toBe(
      'attended',
    );
    expect(classAvailability(HELD, [booking('held', 'no_show', HELD.start_time, HELD.end_time)], NOW).kind).toBe(
      'noShow',
    );
  });

  it('lets the class be booked again after a cancellation and offers the pending reimbursement', () => {
    const cancelled = booking('future', 'cancelled', FUTURE.start_time, FUTURE.end_time, { can_reimburse: true });
    const settled = booking('future', 'cancelled', FUTURE.start_time, FUTURE.end_time, { can_reimburse: false });

    expect(classAvailability(FUTURE, [cancelled], NOW)).toEqual({ kind: 'free', cancelled });
    expect(classAvailability(FUTURE, [settled], NOW)).toEqual({ kind: 'free', cancelled: undefined });
  });

  it('blocks a class that overlaps another booking but not one that only touches it', () => {
    const other = booking('other', 'active', '2026-11-10T18:30:00Z', '2026-11-10T19:30:00Z');
    const adjacent = booking('adjacent', 'active', '2026-11-10T19:00:00Z', '2026-11-10T20:00:00Z');

    expect(classAvailability(FUTURE, [other], NOW).kind).toBe('overlap');
    expect(classAvailability(FUTURE, [adjacent], NOW).kind).toBe('free');
  });

  it('does not let a cancelled overlapping booking block the class', () => {
    const cancelled = booking('other', 'cancelled', '2026-11-10T18:30:00Z', '2026-11-10T19:30:00Z');

    expect(classAvailability(FUTURE, [cancelled], NOW).kind).toBe('free');
  });
});
