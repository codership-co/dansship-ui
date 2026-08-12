import { addDaysToFormat, toColombiaDateKey } from './date';

import { MyBooking, PublishedClass, ScheduledClass } from '@core/api';

export interface BookingDay<T extends ScheduledClass = ScheduledClass> {
  day: string;
  classes: Array<T>;
}

export interface ResolveActiveBookingDayOptions {
  /** Backend-provided Colombia day (YYYY-MM-DD) for the next bookable class. */
  focusDay?: string | null;
}

/**
 * Pick which day tab to open.
 * Keep a prior selection when still valid; otherwise prefer backend `focusDay`
 * (from upcoming-week), then today if it has classes, then the first day with classes.
 */
export const resolveActiveBookingDay = <T extends ScheduledClass>(
  days: Array<BookingDay<T>>,
  previousDay?: BookingDay<T>,
  options?: ResolveActiveBookingDayOptions,
): BookingDay<T> | undefined => {
  if (previousDay) {
    const sameDay = days.find(day => day.day === previousDay.day);

    if (sameDay) {
      return sameDay;
    }
  }

  if (options?.focusDay) {
    const focused = days.find(day => day.day === options.focusDay && day.classes.length > 0);

    if (focused) {
      return focused;
    }
  }

  const todayKey = toColombiaDateKey(new Date());
  const today = days.find(day => day.day === todayKey && day.classes.length > 0);

  if (today) {
    return today;
  }

  return days.find(day => day.classes.length > 0);
};

export const sortClassesByDay = <T extends ScheduledClass>(
  classes: Array<T>,
  weekMonday: string,
): Array<BookingDay<T>> => {
  const rangeDays = Object.fromEntries(
    Array.from({ length: 7 }, (_, offset) => [addDaysToFormat(weekMonday, offset), [] as Array<T>]),
  ) as Record<string, Array<T>>;

  for (const scheduledClass of classes) {
    const dayKey = toColombiaDateKey(scheduledClass.start_time);

    if (rangeDays[dayKey]) {
      rangeDays[dayKey].push(scheduledClass);
    }
  }

  return Object.entries(rangeDays).map(([day, dayClasses]) => ({
    day,
    classes: dayClasses.sort(
      (first, second) => new Date(first.start_time).getTime() - new Date(second.start_time).getTime(),
    ),
  }));
};

export const hasOverlap = (cls: PublishedClass, myBookings: Array<MyBooking>) =>
  myBookings.some(booking => {
    if (!booking.scheduled_class || booking.scheduled_class.id === cls.id) return false;

    if (booking.status === 'cancelled') return false;

    const bookedStart = new Date(booking.scheduled_class.start_time).getTime();
    const bookedEnd = new Date(booking.scheduled_class.end_time).getTime();
    const classStart = new Date(cls.start_time).getTime();
    const classEnd = new Date(cls.end_time).getTime();

    return classStart < bookedEnd && bookedStart < classEnd;
  });

/** True when the authenticated user is the assigned instructor for this class. */
export const isOwnInstructedClass = (
  cls: Pick<ScheduledClass, 'instructor'>,
  userId: string | number | null | undefined,
): boolean => {
  if (userId === null || userId === undefined || !cls.instructor?.user_id) {
    return false;
  }

  return String(cls.instructor.user_id) === String(userId);
};
