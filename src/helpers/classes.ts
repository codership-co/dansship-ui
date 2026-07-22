import { addDaysToFormat, toColombiaDateKey } from './date';

import { MyBooking, PublishedClass } from '@core/api';

export interface BookingDay {
  day: string;
  classes: Array<PublishedClass>;
}

export const sortClassesByDay = (classes: Array<PublishedClass>, weekMonday: string) => {
  const rangeDays = Object.fromEntries(
    Array.from({ length: 7 }, (_, offset) => [addDaysToFormat(weekMonday, offset), [] as Array<PublishedClass>]),
  ) as Record<string, Array<PublishedClass>>;

  for (const scheduledClass of classes) {
    const dayKey = toColombiaDateKey(scheduledClass.start_time);

    if (rangeDays[dayKey]) {
      rangeDays[dayKey].push(scheduledClass);
    }
  }

  return Object.entries(rangeDays).map<BookingDay>(([day, dayClasses]) => ({
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
