import { describe, expect, it } from 'vitest';

import { findNextTeaching, mergeTeachingWeek, resolveTeachingSchedule } from './instructor-teaching';

import type { InstructorTeachingEvent, ScheduledClass } from '@core/api';

const WEEK = '2026-09-21';

function scheduledClass(
  overrides: Partial<ScheduledClass> & Pick<ScheduledClass, 'id' | 'start_time' | 'end_time'>,
): ScheduledClass {
  return {
    schedule_week_id: 'week',
    class_definition_id: 'def',
    room_id: 'room',
    instructor_id: 'instructor',
    capacity: 10,
    enrolled_count: 1,
    ...overrides,
  } as ScheduledClass;
}

function event(
  overrides: Partial<InstructorTeachingEvent> & Pick<InstructorTeachingEvent, 'id' | 'starts_at' | 'ends_at'>,
): InstructorTeachingEvent {
  return {
    name: 'Evento de salsa',
    room: { id: 'room', name: 'Sala 1', image_url: null },
    capacity: 12,
    registered_count: 3,
    ...overrides,
  };
}

describe('mergeTeachingWeek', () => {
  it('sorts a class and a event on the same day by start time', () => {
    const days = mergeTeachingWeek(
      [scheduledClass({ id: 'class-1', start_time: '2026-09-21T23:00:00.000Z', end_time: '2026-09-22T00:00:00.000Z' })],
      [event({ id: 'event-1', starts_at: '2026-09-21T15:00:00.000Z', ends_at: '2026-09-21T17:00:00.000Z' })],
      WEEK,
    );
    const monday = days.find(day => day.day === '2026-09-21');

    expect(monday?.items.map(item => item.kind)).toEqual(['event', 'class']);
    expect(monday?.items.map(item => item.id)).toEqual(['event-1', 'class-1']);
  });

  it('keeps a event-only day selectable', () => {
    const days = mergeTeachingWeek(
      [],
      [event({ id: 'event-1', starts_at: '2026-09-22T15:00:00.000Z', ends_at: '2026-09-22T17:00:00.000Z' })],
      WEEK,
    );

    expect(days.find(day => day.day === '2026-09-22')?.items).toHaveLength(1);
    expect(days.find(day => day.day === '2026-09-21')?.items).toHaveLength(0);
  });

  it('drops a event that starts outside the requested week', () => {
    const days = mergeTeachingWeek(
      [],
      [event({ id: 'later', starts_at: '2026-09-28T15:00:00.000Z', ends_at: '2026-09-28T17:00:00.000Z' })],
      WEEK,
    );

    expect(days.every(day => day.items.length === 0)).toBe(true);
  });
});

describe('resolveTeachingSchedule', () => {
  const salsa = event({
    id: 'event-1',
    starts_at: '2026-09-21T15:00:00.000Z',
    ends_at: '2026-09-21T17:00:00.000Z',
  });
  const danceClass = scheduledClass({
    id: 'class-1',
    start_time: '2026-09-28T15:00:00.000Z',
    end_time: '2026-09-28T16:00:00.000Z',
  });

  it('lands on the earlier event week and still loads classes for that week', () => {
    const resolution = resolveTeachingSchedule({
      currentWeek: WEEK,
      classUpcoming: {
        resolved_week_start: '2026-09-28',
        classes: [danceClass],
        focus_day: '2026-09-28',
      },
      teachingUpcoming: {
        resolved_week_start: WEEK,
        events: [salsa],
        focus_day: WEEK,
      },
    });

    expect(resolution.week).toBe(WEEK);
    expect(resolution.jumped).toBe(false);
    expect(resolution.events).toEqual([salsa]);
    expect(resolution.classes).toBeNull();
    expect(resolution.focusDay).toBe(WEEK);
  });

  it('stays on the class week when it is earlier and fetches that week’s events', () => {
    const resolution = resolveTeachingSchedule({
      currentWeek: WEEK,
      classUpcoming: {
        resolved_week_start: WEEK,
        classes: [danceClass],
        focus_day: WEEK,
      },
      teachingUpcoming: {
        resolved_week_start: '2026-09-28',
        events: [salsa],
        focus_day: '2026-09-28',
      },
    });

    expect(resolution.week).toBe(WEEK);
    expect(resolution.classes).toEqual([danceClass]);
    expect(resolution.events).toBeNull();
    expect(resolution.focusDay).toBe(WEEK);
  });

  it('uses a event-only week when there are no classes', () => {
    const resolution = resolveTeachingSchedule({
      currentWeek: WEEK,
      classUpcoming: { resolved_week_start: WEEK, classes: [], focus_day: null },
      teachingUpcoming: {
        resolved_week_start: '2026-09-28',
        events: [salsa],
        focus_day: '2026-09-28',
      },
    });

    expect(resolution.week).toBe('2026-09-28');
    expect(resolution.jumped).toBe(true);
    expect(resolution.classes).toEqual([]);
    expect(resolution.events).toEqual([salsa]);
  });
});

describe('findNextTeaching', () => {
  const now = new Date('2026-09-21T12:00:00.000Z');

  it('prefers the earlier event over a later class', () => {
    const next = findNextTeaching(
      [
        scheduledClass({
          id: 'class-1',
          start_time: '2026-09-21T20:00:00.000Z',
          end_time: '2026-09-21T21:00:00.000Z',
        }),
      ],
      [event({ id: 'event-1', starts_at: '2026-09-21T15:00:00.000Z', ends_at: '2026-09-21T17:00:00.000Z' })],
      now,
    );

    expect(next).toMatchObject({ kind: 'event', event: { id: 'event-1' } });
  });

  it('skips a cancelled class and an ended event', () => {
    const next = findNextTeaching(
      [
        scheduledClass({
          id: 'cancelled',
          start_time: '2026-09-21T13:00:00.000Z',
          end_time: '2026-09-21T14:00:00.000Z',
          is_cancelled: true,
        }),
        scheduledClass({
          id: 'later',
          start_time: '2026-09-21T20:00:00.000Z',
          end_time: '2026-09-21T21:00:00.000Z',
        }),
      ],
      [event({ id: 'ended', starts_at: '2026-09-21T10:00:00.000Z', ends_at: '2026-09-21T11:00:00.000Z' })],
      now,
    );

    expect(next).toMatchObject({ kind: 'class', scheduledClass: { id: 'later' } });
  });
});
