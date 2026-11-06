import type { AssistedBookingItem } from '@core/api';

/** What the admin can do for a person on one class of the day. */
export type ClassAvailability =
  /** No live booking; `cancelled` is a cancelled one that may still get its credit back. */
  | { kind: 'free'; cancelled?: AssistedBookingItem }
  /** Booked, class not held yet. */
  | { kind: 'reserved'; booking: AssistedBookingItem }
  /** Booked, class already held and attendance still open: the existing booking gets marked. */
  | { kind: 'markAttendance'; booking: AssistedBookingItem }
  | { kind: 'attended'; booking: AssistedBookingItem }
  | { kind: 'noShow'; booking: AssistedBookingItem }
  /** Another booking of the person overlaps this class: the API refuses it too. */
  | { kind: 'overlap'; booking: AssistedBookingItem };

/** The part of a class the rules look at; a published class or a booking's own class. */
export interface ClassSlot {
  id: string;
  start_time: string;
  end_time: string;
}

const overlaps = (slot: ClassSlot, other: AssistedBookingItem) =>
  other.end_time !== null &&
  new Date(other.start_time) < new Date(slot.end_time) &&
  new Date(other.end_time) > new Date(slot.start_time);

/** Mirrors the API rules: one non-cancelled booking per class, and none overlapping in time. */
export function classAvailability(
  slot: ClassSlot,
  bookings: Array<AssistedBookingItem>,
  now = new Date(),
): ClassAvailability {
  const live = bookings.filter(booking => booking.status !== 'cancelled');
  const own = live.find(booking => booking.scheduled_class_id === slot.id);

  if (own) {
    if (own.status === 'attended') {
      return { kind: 'attended', booking: own };
    }

    if (own.status === 'no_show') {
      return { kind: 'noShow', booking: own };
    }

    return new Date(slot.start_time) <= now
      ? { kind: 'markAttendance', booking: own }
      : { kind: 'reserved', booking: own };
  }

  const clash = live.find(booking => booking.scheduled_class_id !== slot.id && overlaps(slot, booking));

  if (clash) {
    return { kind: 'overlap', booking: clash };
  }

  const cancelled = bookings.find(
    booking => booking.status === 'cancelled' && booking.scheduled_class_id === slot.id && booking.can_reimburse,
  );

  return { kind: 'free', cancelled };
}
