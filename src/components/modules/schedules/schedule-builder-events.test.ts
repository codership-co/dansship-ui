import { describe, expect, it } from 'vitest';

import { isScheduleBuilderOverlayEvent } from './schedule-builder-events';

import type { AgendaEvent } from '@core/api';

function agenda(event_type: AgendaEvent['event_type'], status?: string): AgendaEvent {
  return {
    event_type,
    source_id: 'source-1',
    room_id: 'room-1',
    start_time: '2026-11-07T15:00:00.000Z',
    end_time: '2026-11-07T17:00:00.000Z',
    status,
    metadata: {},
  };
}

describe('isScheduleBuilderOverlayEvent', () => {
  it('draws a published workshop and leaves a draft off the grid', () => {
    expect(isScheduleBuilderOverlayEvent(agenda('workshop', 'published'))).toBe(true);
    expect(isScheduleBuilderOverlayEvent(agenda('workshop', 'draft'))).toBe(false);
  });
});
