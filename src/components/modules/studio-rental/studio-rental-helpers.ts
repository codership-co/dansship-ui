import { format } from 'date-fns';

import { DANSSHIP_ERROR_CODE, DansshipAPIError } from '@core/api';

export const WHOLE_ROOM = '__whole_room__';
export const BOGOTA_OFFSET = '-05:00';

export type StudioRentalHourRange = {
  date: string;
  startHour: number;
  endHour: number;
};

export function formatDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function toBogotaBoundary(dateValue: string, endOfDay: boolean): string {
  return endOfDay ? `${dateValue}T23:59:59.999${BOGOTA_OFFSET}` : `${dateValue}T00:00:00.000${BOGOTA_OFFSET}`;
}

export function padHour(hour: number): string {
  return String(hour).padStart(2, '0');
}

export function selectionToIso(selection: StudioRentalHourRange): { start_time: string; end_time: string } {
  return {
    start_time: `${selection.date}T${padHour(selection.startHour)}:00:00${BOGOTA_OFFSET}`,
    end_time: `${selection.date}T${padHour(selection.endHour)}:00:00${BOGOTA_OFFSET}`,
  };
}

export function hoursBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();

  return Math.max(ms / (1000 * 60 * 60), 0);
}

export function resolveStudioRentalMutationError(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string,
): string {
  const apiError =
    error instanceof DansshipAPIError
      ? error
      : error && typeof error === 'object' && 'body' in error && (error as DansshipAPIError).body
        ? (error as DansshipAPIError)
        : null;

  if (apiError?.body) {
    const code = String(apiError.body.error_code ?? '');
    const message = String(apiError.body.message ?? '');

    if (
      code === DANSSHIP_ERROR_CODE.STUDIO_RENTAL_LEAD_TIME_REQUIRED ||
      message.toLowerCase().includes('at least 24 hours')
    ) {
      return t('studioRental:toast.leadTimeRequired');
    }

    if (code === DANSSHIP_ERROR_CODE.STUDIO_RENTAL_SLOT_CONFLICT || code === 'AGENDA_ROOM_OCCUPANCY_CONFLICT') {
      return t('studioRental:toast.slotConflict');
    }

    if (code === DANSSHIP_ERROR_CODE.STUDIO_RENTAL_OUTSIDE_AVAILABILITY) {
      return t('studioRental:toast.outsideAvailability');
    }

    if (message.toLowerCase().includes('has not been configured')) {
      return t('studioRental:toast.priceNotConfigured');
    }
  }

  return t(fallbackKey);
}
