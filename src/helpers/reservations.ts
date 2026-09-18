import type { MyBooking, MyWorkshopRegistration, RentalRequest, RentalSeries } from '@core/api';

export type ReservationKind = 'class' | 'workshop' | 'rental' | 'rental_series';

export type ReservationItem =
  | { kind: 'class'; id: string; startsAt: string; booking: MyBooking }
  | { kind: 'workshop'; id: string; startsAt: string; registration: MyWorkshopRegistration }
  | { kind: 'rental'; id: string; startsAt: string; request: RentalRequest; roomName: string }
  | { kind: 'rental_series'; id: string; startsAt: string; series: RentalSeries; roomName: string };

export function classReservation(booking: MyBooking): ReservationItem {
  return {
    kind: 'class',
    id: `class-${booking.id}`,
    startsAt: booking.scheduled_class.start_time,
    booking,
  };
}

export function workshopReservation(registration: MyWorkshopRegistration): ReservationItem {
  return {
    kind: 'workshop',
    id: `workshop-${registration.id}`,
    startsAt: registration.starts_at,
    registration,
  };
}

export function rentalReservation(request: RentalRequest, roomName: string): ReservationItem {
  const startsAt =
    [...request.slots].sort((left, right) => left.start_time.localeCompare(right.start_time))[0]?.start_time ??
    request.created_at;

  return {
    kind: 'rental',
    id: `rental-${request.id}`,
    startsAt,
    request,
    roomName,
  };
}

export function rentalSeriesReservation(series: RentalSeries, roomName: string): ReservationItem {
  const slotStarts = series.requests.flatMap(request => request.slots.map(slot => slot.start_time)).sort();

  return {
    kind: 'rental_series',
    id: `rental-series-${series.id}`,
    startsAt: slotStarts[0] ?? `${series.series_start_date}T${series.start_time}`,
    series,
    roomName,
  };
}

export function reservationDisplayTitle(
  item: ReservationItem,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (item.kind === 'class') {
    return item.booking.scheduled_class.class_definition?.name ?? t('bookings:classFallback');
  }

  if (item.kind === 'workshop') {
    return t('bookings:workshopNamedTitle', { name: item.registration.workshop_name });
  }

  if (item.roomName) {
    return t('bookings:rentalNamedTitle', { name: item.roomName });
  }

  return t('bookings:rentalTitle');
}

export function sortReservationsAscending(items: Array<ReservationItem>): Array<ReservationItem> {
  return [...items].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

export function sortReservationsDescending(items: Array<ReservationItem>): Array<ReservationItem> {
  return [...items].sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());
}

const ACTIVE_RENTAL_STATUSES = new Set(['pending_payment', 'on_hold', 'confirmed']);

export function isUpcomingRental(request: RentalRequest, now = Date.now()): boolean {
  if (!ACTIVE_RENTAL_STATUSES.has(request.status)) {
    return false;
  }

  const ends = request.slots.map(slot => new Date(slot.end_time).getTime()).filter(value => !Number.isNaN(value));

  if (ends.length === 0) {
    return true;
  }

  return Math.max(...ends) > now;
}

export function isUpcomingRentalSeries(series: RentalSeries, now = Date.now()): boolean {
  if (!ACTIVE_RENTAL_STATUSES.has(series.status)) {
    return false;
  }

  if (series.series_end_date) {
    const end = new Date(`${series.series_end_date}T23:59:59`);

    if (!Number.isNaN(end.getTime()) && end.getTime() < now) {
      return false;
    }
  }

  const slotEnds = series.requests
    .flatMap(request => request.slots.map(slot => new Date(slot.end_time).getTime()))
    .filter(value => !Number.isNaN(value));

  if (slotEnds.length > 0) {
    return Math.max(...slotEnds) > now;
  }

  return true;
}

export function rentalStatusI18nKey(status: string) {
  switch (status) {
    case 'pending_payment':
      return 'pendingPayment';
    case 'on_hold':
      return 'onHold';
    case 'confirmed':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pendingPayment';
  }
}
