import { format } from 'date-fns';

import { MyBooking, PublishedClass } from '@core/api';

export interface BookingDay {
  day: string;
  classes: Array<PublishedClass>;
}

export const sortClassesByDay = (classes: Array<PublishedClass>, startAt: string, endAt: string) => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const rangeDays: Record<string, Array<PublishedClass>> = {};

  while (start < end) {
    const dateKey = format(start, 'yyyy-MM-dd');
    rangeDays[dateKey] = [];
    start.setDate(start.getDate() + 1);
  }

  const classesByDay = classes.reduce((acc, scheduledClass) => {
    const dayKey = format(new Date(scheduledClass.start_time), 'yyyy-MM-dd');

    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }

    acc[dayKey].push(scheduledClass);

    return acc;
  }, rangeDays);

  const orderedDays = Object.keys(classesByDay).sort((first, second) => first.localeCompare(second));

  return orderedDays.map<BookingDay>(day => ({
    day: day,
    classes: classesByDay[day].sort(
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
