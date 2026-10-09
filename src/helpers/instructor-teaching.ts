import { addDaysToFormat, toColombiaDateKey } from './date';

import type { InstructorTeachingEvent, ScheduledClass } from '@core/api';

export interface TeachingClassItem {
  kind: 'class';
  id: string;
  startTime: string;
  endTime: string;
  scheduledClass: ScheduledClass;
}

export interface TeachingEventItem {
  kind: 'event';
  id: string;
  startTime: string;
  endTime: string;
  event: InstructorTeachingEvent;
}

export type TeachingItem = TeachingClassItem | TeachingEventItem;

export interface TeachingDay {
  day: string;
  items: Array<TeachingItem>;
}

export type NextTeaching =
  | { kind: 'class'; scheduledClass: ScheduledClass }
  | { kind: 'event'; event: InstructorTeachingEvent };

interface ClassUpcomingPayload {
  resolved_week_start: string;
  classes: Array<ScheduledClass>;
  focus_day: string | null;
}

interface TeachingUpcomingPayload {
  resolved_week_start: string;
  events: Array<InstructorTeachingEvent>;
  focus_day: string | null;
}

export interface TeachingResolution {
  week: string;
  jumped: boolean;
  /** Null means the chosen week still needs a class fetch. */
  classes: Array<ScheduledClass> | null;
  /** Null means the chosen week still needs a event fetch. */
  events: Array<InstructorTeachingEvent> | null;
  focusDay: string | null;
}

export function mergeTeachingWeek(
  classes: Array<ScheduledClass>,
  events: Array<InstructorTeachingEvent>,
  weekMonday: string,
): Array<TeachingDay> {
  const rangeDays = Object.fromEntries(
    Array.from({ length: 7 }, (_, offset) => [addDaysToFormat(weekMonday, offset), [] as Array<TeachingItem>]),
  ) as Record<string, Array<TeachingItem>>;

  for (const scheduledClass of classes) {
    const bucket = rangeDays[toColombiaDateKey(scheduledClass.start_time)];

    if (!bucket) continue;

    bucket.push({
      kind: 'class',
      id: scheduledClass.id,
      startTime: scheduledClass.start_time,
      endTime: scheduledClass.end_time,
      scheduledClass,
    });
  }

  for (const event of events) {
    const bucket = rangeDays[toColombiaDateKey(event.starts_at)];

    if (!bucket) continue;

    bucket.push({
      kind: 'event',
      id: event.id,
      startTime: event.starts_at,
      endTime: event.ends_at,
      event,
    });
  }

  return Object.entries(rangeDays).map(([day, items]) => ({
    day,
    items: [...items].sort(
      (first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime(),
    ),
  }));
}

export function resolveActiveTeachingDay(
  days: Array<TeachingDay>,
  previousDay?: TeachingDay,
  focusDay?: string | null,
): TeachingDay | undefined {
  if (previousDay) {
    const sameDay = days.find(day => day.day === previousDay.day);

    if (sameDay) return sameDay;
  }

  if (focusDay) {
    const focused = days.find(day => day.day === focusDay && day.items.length > 0);

    if (focused) return focused;
  }

  const todayKey = toColombiaDateKey(new Date());
  const today = days.find(day => day.day === todayKey && day.items.length > 0);

  if (today) return today;

  return days.find(day => day.items.length > 0);
}

export function findNextTeaching(
  classes: Array<ScheduledClass>,
  events: Array<InstructorTeachingEvent>,
  now = new Date(),
): NextTeaching | null {
  const nowMs = now.getTime();
  const candidates: Array<{ start: number; item: NextTeaching }> = [];

  for (const scheduledClass of classes) {
    if (scheduledClass.is_cancelled) continue;

    if (new Date(scheduledClass.end_time).getTime() <= nowMs) continue;

    candidates.push({
      start: new Date(scheduledClass.start_time).getTime(),
      item: { kind: 'class', scheduledClass },
    });
  }

  for (const event of events) {
    if (new Date(event.ends_at).getTime() <= nowMs) continue;

    candidates.push({
      start: new Date(event.starts_at).getTime(),
      item: { kind: 'event', event },
    });
  }

  candidates.sort((first, second) => first.start - second.start);

  return candidates[0]?.item ?? null;
}

export function chooseTeachingWeek(classWeek: string | null, eventWeek: string | null, fallbackWeek: string): string {
  if (classWeek && eventWeek) {
    return classWeek <= eventWeek ? classWeek : eventWeek;
  }

  return classWeek ?? eventWeek ?? fallbackWeek;
}

export function resolveTeachingSchedule(input: {
  currentWeek: string;
  classUpcoming: ClassUpcomingPayload | null;
  teachingUpcoming: TeachingUpcomingPayload | null;
}): TeachingResolution {
  const { currentWeek, classUpcoming, teachingUpcoming } = input;
  const classWeek = classUpcoming && classUpcoming.classes.length > 0 ? classUpcoming.resolved_week_start : null;
  const eventWeek =
    teachingUpcoming && teachingUpcoming.events.length > 0 ? teachingUpcoming.resolved_week_start : null;
  const week = chooseTeachingWeek(classWeek, eventWeek, currentWeek);

  let classes: Array<ScheduledClass> | null;

  if (!classUpcoming) {
    classes = week === currentWeek ? [] : null;
  } else if (classWeek === week) {
    classes = classUpcoming.classes;
  } else if (classWeek === null) {
    classes = [];
  } else {
    classes = null;
  }

  let events: Array<InstructorTeachingEvent> | null;

  if (!teachingUpcoming) {
    events = null;
  } else if (eventWeek === week) {
    events = teachingUpcoming.events;
  } else if (eventWeek === null) {
    events = [];
  } else {
    events = null;
  }

  const focusDay =
    classWeek === week
      ? (classUpcoming?.focus_day ?? teachingUpcoming?.focus_day ?? null)
      : (teachingUpcoming?.focus_day ?? null);

  return {
    week,
    jumped: week !== currentWeek,
    classes,
    events,
    focusDay,
  };
}
