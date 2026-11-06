import type { MyBooking, PublishedClass } from '@core/api';

/** What the admin can do for a person on one class of the day. */
export type ClassAvailability =
  | { kind: 'free' }
  /** Booked, class not held yet. */
  | { kind: 'reserved'; booking: MyBooking }
  /** Booked, class already held and attendance still open: the existing booking gets marked. */
  | { kind: 'markAttendance'; booking: MyBooking }
  | { kind: 'attended'; booking: MyBooking }
  | { kind: 'noShow'; booking: MyBooking }
  /** Another booking of the person overlaps this class: the API refuses it too. */
  | { kind: 'overlap'; booking: MyBooking };

const overlaps = (item: PublishedClass, other: MyBooking) => {
  const scheduled = other.scheduled_class;

  return (
    new Date(scheduled.start_time) < new Date(item.end_time) && new Date(scheduled.end_time) > new Date(item.start_time)
  );
};

/** Mirrors the API rules: one non-cancelled booking per class, and none overlapping in time. */
export function classAvailability(
  item: PublishedClass,
  bookings: Array<MyBooking>,
  now = new Date(),
): ClassAvailability {
  const live = bookings.filter(booking => booking.status !== 'cancelled');
  const own = live.find(booking => booking.scheduled_class_id === item.id);

  if (own) {
    if (own.status === 'attended') {
      return { kind: 'attended', booking: own };
    }

    if (own.status === 'no_show') {
      return { kind: 'noShow', booking: own };
    }

    return new Date(item.start_time) <= now
      ? { kind: 'markAttendance', booking: own }
      : { kind: 'reserved', booking: own };
  }

  const clash = live.find(booking => booking.scheduled_class_id !== item.id && overlaps(item, booking));

  return clash ? { kind: 'overlap', booking: clash } : { kind: 'free' };
}
