import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventSessionsPanel } from './event-sessions-panel';

import { DansshipAPI, type EventAdmin, type EventSession } from '@core/api';
import '@core/i18n';

const rehearsal: EventSession = {
  id: 'session-extra',
  starts_at: '2026-11-21T20:00:00.000Z',
  ends_at: '2026-11-21T22:00:00.000Z',
  room_id: 'room-1',
  room_name: 'Sala Norte',
  external_location: null,
  status: 'active',
  label: 'Ensayo',
  is_main: false,
  occurrence_date: '2026-11-21',
};

const mainSession: EventSession = {
  id: 'session-main',
  starts_at: '2026-11-28T23:00:00.000Z',
  ends_at: '2026-11-29T01:00:00.000Z',
  room_id: null,
  room_name: null,
  external_location: 'Teatro',
  status: 'active',
  label: null,
  is_main: true,
  occurrence_date: null,
};

function eventFixture(overrides: Partial<EventAdmin> = {}): EventAdmin {
  return {
    id: 'event-1',
    type: 'recital',
    fields_locked: false,
    visibility: 'link_only',
    access_token: 'token-1',
    room_id: 'room-1',
    ...overrides,
  } as EventAdmin;
}

describe('EventSessionsPanel', () => {
  beforeEach(() => {
    vi.spyOn(DansshipAPI.eventosAdmin, 'listInvites').mockResolvedValue({ ok: true, data: [] } as never);
    vi.spyOn(DansshipAPI.eventosAdmin, 'listSessions').mockResolvedValue({
      ok: true,
      data: [mainSession, rehearsal],
    } as never);
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('moves an additional session without sending occurrence_date', async () => {
    const updateSession = vi.spyOn(DansshipAPI.eventosAdmin, 'updateSession').mockResolvedValue({
      ok: true,
      data: rehearsal,
    } as never);
    render(<EventSessionsPanel event={eventFixture()} rooms={[{ id: 'room-1', name: 'Sala Norte' }]} />);

    const row = await screen.findByText(/Ensayo/);
    fireEvent.click(within(row.closest('li') as HTMLElement).getByRole('button', { name: 'Editar' }));
    const editor = row.closest('li') as HTMLElement;
    fireEvent.change(within(editor).getByLabelText('Inicio'), { target: { value: '2026-11-28T15:00' } });
    fireEvent.change(within(editor).getByLabelText('Fin'), { target: { value: '2026-11-28T17:00' } });
    fireEvent.click(within(editor).getByRole('button', { name: 'Guardar sesión' }));

    await waitFor(() => {
      expect(updateSession).toHaveBeenCalledWith(
        'event-1',
        'session-extra',
        expect.not.objectContaining({ occurrence_date: expect.anything() }),
      );
    });
    const payload = updateSession.mock.calls[0][2];
    expect(payload.starts_at).toBe(new Date('2026-11-28T15:00').toISOString());
    expect(payload.ends_at).toBe(new Date('2026-11-28T17:00').toISOString());
    expect(payload).not.toHaveProperty('occurrence_date');
  });

  it('locks the main session time when registrations are holding and keeps the place editable', async () => {
    const updateSession = vi.spyOn(DansshipAPI.eventosAdmin, 'updateSession').mockResolvedValue({
      ok: true,
      data: mainSession,
    } as never);
    render(
      <EventSessionsPanel
        event={eventFixture({ fields_locked: true })}
        rooms={[{ id: 'room-1', name: 'Sala Norte' }]}
      />,
    );

    const row = (await screen.findByText(/Principal/)).closest('li') as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: 'Editar' }));

    expect(screen.getByText('La hora de la función está bloqueada porque ya hay inscripciones.')).toBeInTheDocument();
    expect(within(row).queryByLabelText('Inicio')).not.toBeInTheDocument();
    fireEvent.change(within(row).getByLabelText('Lugar'), { target: { value: 'Parque' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Guardar sesión' }));

    await waitFor(() => {
      expect(updateSession).toHaveBeenCalledWith(
        'event-1',
        'session-main',
        expect.objectContaining({ external_location: 'Parque', room_id: null }),
      );
    });
    expect(updateSession.mock.calls[0][2]).not.toHaveProperty('starts_at');
    expect(updateSession.mock.calls[0][2]).not.toHaveProperty('ends_at');
  });

  it('sends excluded dates with the weekly preview', async () => {
    const previewRecurrence = vi.spyOn(DansshipAPI.eventosAdmin, 'previewRecurrence').mockResolvedValue({
      ok: true,
      data: { occurrences: [], conflicts: [] },
    } as never);
    render(<EventSessionsPanel event={eventFixture()} rooms={[{ id: 'room-1', name: 'Sala Norte' }]} />);

    fireEvent.change(await screen.findByLabelText('Fechas excluidas'), { target: { value: '2026-12-12, 2026-12-19' } });
    fireEvent.click(screen.getByRole('button', { name: 'Previsualizar' }));

    await waitFor(() => {
      expect(previewRecurrence).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({ excluded_dates: ['2026-12-12', '2026-12-19'], weekday: 5 }),
      );
    });
  });

  it('copies the access link', async () => {
    render(<EventSessionsPanel event={eventFixture()} rooms={[{ id: 'room-1', name: 'Sala Norte' }]} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Copiar enlace' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/eventos/acceso/token-1`);
    });
  });
});
