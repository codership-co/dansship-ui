import type { AgendaEvent } from '@core/api';

export function isScheduleBuilderOverlayEvent(event: AgendaEvent) {
  if (event.event_type === 'space_rental_external' || event.event_type === 'internal_reserved_use') {
    return true;
  }

  return event.event_type === 'workshop' && event.status === 'published';
}
