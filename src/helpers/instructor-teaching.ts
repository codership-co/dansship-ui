import { addDaysToFormat, toColombiaDateKey } from './date';

import type { InstructorTeachingWorkshop, ScheduledClass } from '@core/api';

export interface TeachingClassItem {
  kind: 'class';
  id: string;
  startTime: string;
  endTime: string;
  scheduledClass: ScheduledClass;
}

export interface TeachingWorkshopItem {
  kind: 'workshop';
  id: string;
  startTime: string;
  endTime: string;
  workshop: InstructorTeachingWorkshop;
}

export type TeachingItem = TeachingClassItem | TeachingWorkshopItem;

export interface TeachingDay {
  day: string;
  items: Array<TeachingItem>;
}

export type NextTeaching =
  | { kind: 'class'; scheduledClass: ScheduledClass }
  | { kind: 'workshop'; workshop: InstructorTeachingWorkshop };

interface ClassUpcomingPayload {
  resolved_week_start: string;
  classes: Array<ScheduledClass>;
  focus_day: string | null;
}

interface TeachingUpcomingPayload {
  resolved_week_start: string;
  workshops: Array<InstructorTeachingWorkshop>;
  focus_day: string | null;
}

export interface TeachingResolution {
  week: string;
  jumped: boolean;
  /** Null means the chosen week still needs a class fetch. */
  classes: Array<ScheduledClass> | null;
  /** Null means the chosen week still needs a workshop fetch. */
  workshops: Array<InstructorTeachingWorkshop> | null;
  focusDay: string | null;
}

export function mergeTeachingWeek(
  classes: Array<ScheduledClass>,
  workshops: Array<InstructorTeachingWorkshop>,
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

  for (const workshop of workshops) {
    const bucket = rangeDays[toColombiaDateKey(workshop.starts_at)];

    if (!bucket) continue;

    bucket.push({
      kind: 'workshop',
      id: workshop.id,
      startTime: workshop.starts_at,
      endTime: workshop.ends_at,
      workshop,
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
  workshops: Array<InstructorTeachingWorkshop>,
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

  for (const workshop of workshops) {
    if (new Date(workshop.ends_at).getTime() <= nowMs) continue;

    candidates.push({
      start: new Date(workshop.starts_at).getTime(),
      item: { kind: 'workshop', workshop },
    });
  }

  candidates.sort((first, second) => first.start - second.start);

  return candidates[0]?.item ?? null;
}

export function chooseTeachingWeek(
  classWeek: string | null,
  workshopWeek: string | null,
  fallbackWeek: string,
): string {
  if (classWeek && workshopWeek) {
    return classWeek <= workshopWeek ? classWeek : workshopWeek;
  }

  return classWeek ?? workshopWeek ?? fallbackWeek;
}

export function resolveTeachingSchedule(input: {
  currentWeek: string;
  classUpcoming: ClassUpcomingPayload | null;
  teachingUpcoming: TeachingUpcomingPayload | null;
}): TeachingResolution {
  const { currentWeek, classUpcoming, teachingUpcoming } = input;
  const classWeek = classUpcoming && classUpcoming.classes.length > 0 ? classUpcoming.resolved_week_start : null;
  const workshopWeek =
    teachingUpcoming && teachingUpcoming.workshops.length > 0 ? teachingUpcoming.resolved_week_start : null;
  const week = chooseTeachingWeek(classWeek, workshopWeek, currentWeek);

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

  let workshops: Array<InstructorTeachingWorkshop> | null;

  if (!teachingUpcoming) {
    workshops = null;
  } else if (workshopWeek === week) {
    workshops = teachingUpcoming.workshops;
  } else if (workshopWeek === null) {
    workshops = [];
  } else {
    workshops = null;
  }

  const focusDay =
    classWeek === week
      ? (classUpcoming?.focus_day ?? teachingUpcoming?.focus_day ?? null)
      : (teachingUpcoming?.focus_day ?? null);

  return {
    week,
    jumped: week !== currentWeek,
    classes,
    workshops,
    focusDay,
  };
}
