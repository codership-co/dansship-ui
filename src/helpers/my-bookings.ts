import type { MyBooking } from '@core/api';

export function canCancelBooking(booking: MyBooking, now = Date.now()) {
  const startsAt = new Date(booking.scheduled_class.start_time).getTime();
  const isFuture = startsAt > now;
  const planAllowsCancel = booking.is_cancellable !== false;

  return isFuture && planAllowsCancel && booking.status === 'active';
}

export function isAcademyCancelledBooking(booking: MyBooking) {
  return booking.status === 'cancelled' && Boolean(booking.scheduled_class.is_cancelled);
}

export type BookingCountdownKind = 'inProgress' | 'today' | 'tomorrow' | 'hours' | 'days';

export interface BookingCountdown {
  kind: BookingCountdownKind;
  hours: number;
  days: number;
}

export function getBookingCountdown(startTime: string, now = new Date()): BookingCountdown {
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();

  if (Number.isNaN(start.getTime()) || diffMs <= 0) {
    return { kind: 'inProgress', hours: 0, days: 0 };
  }

  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round((startDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    return { kind: 'today', hours, days: 0 };
  }

  if (dayDiff === 1) {
    return { kind: 'tomorrow', hours, days: 1 };
  }

  if (dayDiff < 1) {
    return { kind: 'hours', hours, days: 0 };
  }

  return { kind: 'days', hours, days: dayDiff };
}
