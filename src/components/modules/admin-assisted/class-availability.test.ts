import { describe, expect, it } from 'vitest';

import { classAvailability } from './class-availability';

import type { BookingStatus, MyBooking, PublishedClass } from '@core/api';

const NOW = new Date('2026-11-06T12:00:00Z');

const klass = (id: string, start: string, end: string) => ({ id, start_time: start, end_time: end }) as PublishedClass;

const booking = (classId: string, status: BookingStatus, start: string, end: string) =>
  ({
    id: `booking-${classId}`,
    status,
    scheduled_class_id: classId,
    scheduled_class: { id: classId, start_time: start, end_time: end },
  }) as MyBooking;

const FUTURE = klass('future', '2026-11-10T18:00:00Z', '2026-11-10T19:00:00Z');
const HELD = klass('held', '2026-11-05T18:00:00Z', '2026-11-05T19:00:00Z');

describe('classAvailability', () => {
  it('is free when the person has nothing', () => {
    expect(classAvailability(FUTURE, [], NOW).kind).toBe('free');
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

  it('ignores a cancelled booking', () => {
    const cancelled = booking('future', 'cancelled', FUTURE.start_time, FUTURE.end_time);

    expect(classAvailability(FUTURE, [cancelled], NOW).kind).toBe('free');
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
