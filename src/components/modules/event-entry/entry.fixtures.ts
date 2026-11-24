import type { DoorSearchRow, EntryPass, EntryScanResult } from '@core/api';

export const entryPass: EntryPass = {
  person_id: 'person-1',
  holder_name: 'Ana Gómez',
  email: 'ana@example.com',
  type_name: 'Invitados',
  event: { id: 'event-1', name: 'Clausura Dansship', starts_at: '2026-12-12T20:30:00Z', place: 'Estudio Dansship' },
  minors: [{ person_id: 'minor-1', full_name: 'Sofía', entered_at: null }],
  entered_at: null,
  server_time: '2026-12-12T20:00:00Z',
  code: 'E1.handle.123.mac',
  refresh_at: '2026-12-12T20:00:15Z',
  refresh_seconds: 10,
  rotation_seconds: 15,
};

export const validScan: EntryScanResult = {
  status: 'valid',
  reason: null,
  person: {
    person_id: 'person-1',
    full_name: 'Ana Gómez',
    type_name: 'Invitados',
    kind: 'guest',
    entered_at: '2026-12-12T21:00:00Z',
    validated_by_name: 'Puerta',
    minors: [{ person_id: 'minor-1', full_name: 'Sofía', entered_at: null }],
  },
};

export const searchRow: DoorSearchRow = {
  person_id: 'person-2',
  full_name: 'Bruno Díaz',
  email: 'bruno@example.com',
  type_name: 'Invitados',
  kind: 'guest',
  can_enter: true,
  reason: null,
  entered_at: null,
  validated_by_name: null,
  minors: [],
  donation: null,
};
