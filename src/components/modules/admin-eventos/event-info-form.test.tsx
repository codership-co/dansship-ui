import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventInfoForm } from './event-info-form';
import { weeklyDates } from './event-session-rows';
import { EventWorkspace } from './event-workspace';

import {
  DANSSHIP_ERROR_CATEGORY,
  DansshipAPI,
  DansshipAPIError,
  type EventAdmin,
  type EventTypeLabel,
} from '@core/api';
import '@core/i18n';

vi.mock('@contexts', async importOriginal => ({
  ...(await importOriginal<typeof import('@contexts')>()),
  useOrPermissions: () => true,
}));

const ok = <T,>(data: T) => ({ ok: true, data, status: 200, error: null }) as never;
const labels: Array<EventTypeLabel> = [
  { id: 'label-taller', name: 'Taller', position: 0, is_offered: true, events_count: 3 },
  { id: 'label-muestra', name: 'Muestra', position: 1, is_offered: true, events_count: 1 },
];

function event(overrides: Partial<EventAdmin> = {}): EventAdmin {
  return {
    id: 'event-1',
    name: 'Clausura Dansship',
    description: null,
    slug: 'clausura',
    starts_at: '2026-12-13T01:30:00Z',
    ends_at: '2026-12-13T04:30:00Z',
    room_id: 'room-1',
    external_location: null,
    instructor_id: null,
    capacity: 100,
    image_url: null,
    payment_qr_url: null,
    is_collaboration: false,
    collaborator_email: null,
    collaborator_participation_percentage: 0,
    type: 'configured',
    type_label: 'Muestra',
    type_label_id: 'label-muestra',
    configuration_model: 'participant_types',
    status: 'draft',
    fields_locked: false,
    visibility: 'public',
    ...overrides,
  } as EventAdmin;
}

function openSelect(combobox: HTMLElement) {
  combobox.focus();
  fireEvent.keyDown(combobox, { key: 'ArrowDown', code: 'ArrowDown' });
}

function renderAt(node: React.ReactNode, path = '/admin/eventos/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path='/admin/eventos/new' element={node} />
        <Route path='/admin/eventos/:eventId' element={<p>Página del evento</p>} />
        <Route path='/admin/eventos/:eventId/*' element={node} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventInfoForm', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    Element.prototype.hasPointerCapture = () => false;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.eventosAdmin, 'listTypeLabels').mockResolvedValue(ok(labels));
    vi.spyOn(DansshipAPI.inventoryAdmin, 'getRooms').mockResolvedValue(ok([{ id: 'room-1', name: 'Salón A' }]));
    vi.spyOn(DansshipAPI.instructorsAdmin, 'getInstructors').mockResolvedValue(ok([]));
    vi.spyOn(DansshipAPI.eventosAdmin, 'list').mockResolvedValue(
      ok([
        { kind: 'event', id: 'clausura-2025', name: 'Clausura 2025', type: 'configured', status: 'published' },
        { kind: 'event', id: 'recital', name: 'Recital', type: 'recital', status: 'published' },
      ]),
    );
    vi.spyOn(DansshipAPI.eventosAdmin, 'listSessions').mockResolvedValue(ok([]));
    vi.spyOn(DansshipAPI.participationAdmin, 'listEventTerms').mockResolvedValue(ok([]));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates a blank event configured by participant types; its General type waits in the editor', async () => {
    const create = vi.spyOn(DansshipAPI.eventosAdmin, 'createEvent').mockResolvedValue(ok(event({ id: 'new-1' })));
    const createType = vi.spyOn(DansshipAPI.participationAdmin, 'createType');
    renderAt(<EventInfoForm />);

    fireEvent.change(await screen.findByLabelText('Nombre *'), { target: { value: 'Taller de salsa' } });
    openSelect(screen.getByRole('combobox', { name: 'Tipo de evento' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Taller' }));
    fireEvent.change(screen.getByLabelText('Fecha *'), { target: { value: '2026-12-05' } });
    fireEvent.change(screen.getByLabelText('Inicio *'), { target: { value: '19:00' } });
    fireEvent.change(screen.getByLabelText('Fin *'), { target: { value: '21:00' } });
    openSelect(screen.getByRole('combobox', { name: 'Lugar' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Salón A' }));
    // "Mostrar la hora de fin" starts on; off keeps the end for the room but hides it from people.
    const showsEnd = screen.getByRole('switch', { name: 'Mostrar la hora de fin' });
    expect(showsEnd).toBeChecked();
    fireEvent.click(showsEnd);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));

    expect(await screen.findByText('Página del evento')).toBeVisible();
    expect(createType).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Taller de salsa',
        configuration_model: 'participant_types',
        type_label_id: 'label-taller',
        instructor_id: null,
        room_id: 'room-1',
        starts_at: '2026-12-05T19:00:00-05:00',
        ends_at: '2026-12-05T21:00:00-05:00',
        shows_end_time: false,
      }),
    );
  });

  it('saves the earliest row as the main session, the others as extra sessions, and the terms PDF', async () => {
    const create = vi.spyOn(DansshipAPI.eventosAdmin, 'createEvent').mockResolvedValue(ok(event({ id: 'new-1' })));
    const addSession = vi.spyOn(DansshipAPI.eventosAdmin, 'addSession').mockResolvedValue(ok({}));
    const uploadTerms = vi
      .spyOn(DansshipAPI.participationAdmin, 'uploadEventTermsPdf')
      .mockResolvedValue('terms/key.pdf');
    const saveTerms = vi.spyOn(DansshipAPI.participationAdmin, 'saveEventTerms').mockResolvedValue(ok({}));
    const { container } = renderAt(<EventInfoForm />);

    fireEvent.change(await screen.findByLabelText('Nombre *'), { target: { value: 'Recital' } });
    openSelect(screen.getByRole('combobox', { name: 'Tipo de evento' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Taller' }));
    fireEvent.change(screen.getByLabelText('Fecha *'), { target: { value: '2026-12-12' } });
    openSelect(screen.getByRole('combobox', { name: 'Lugar' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Salón A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sesión' }));
    fireEvent.change(screen.getAllByLabelText('Fecha *')[1], { target: { value: '2026-12-05' } });
    const pdf = new File(['%PDF'], 'terminos.pdf', { type: 'application/pdf' });
    fireEvent.change(
      [...container.querySelectorAll<HTMLInputElement>('input[type="file"]')].at(-1) as HTMLInputElement,
      { target: { files: [pdf] } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));

    await waitFor(() =>
      expect(saveTerms).toHaveBeenCalledWith('new-1', expect.objectContaining({ file_key: 'terms/key.pdf' })),
    );
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ starts_at: '2026-12-05T19:00:00-05:00' }));
    expect(addSession).toHaveBeenCalledWith(
      'new-1',
      expect.objectContaining({ starts_at: '2026-12-12T19:00:00-05:00', room_id: 'room-1' }),
    );
    expect(uploadTerms).toHaveBeenCalledWith('new-1', pdf);
  });

  it('"Repetir cada semana" adds one row per weekday between two dates', async () => {
    renderAt(<EventInfoForm />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repetir cada semana' }));
    fireEvent.change(screen.getByLabelText('Desde *'), { target: { value: '2026-12-01' } });
    fireEvent.change(screen.getByLabelText('Hasta *'), { target: { value: '2026-12-31' } });
    const [, repeatPlace] = screen.getAllByRole('combobox', { name: 'Lugar' });
    openSelect(repeatPlace);
    fireEvent.click(await screen.findByRole('option', { name: 'Salón A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sesiones' }));

    // Saturdays of December 2026: 5, 12, 19 and 26 (the empty first row is replaced).
    await waitFor(() =>
      expect(screen.getAllByLabelText('Fecha *').map(input => (input as HTMLInputElement).value)).toEqual([
        '2026-12-05',
        '2026-12-12',
        '2026-12-19',
        '2026-12-26',
      ]),
    );
  });

  it('duplicates only configured events into an undated draft', async () => {
    const duplicate = vi
      .spyOn(DansshipAPI.eventosAdmin, 'duplicate')
      .mockResolvedValue(ok(event({ id: 'copy-1', starts_at: null, ends_at: null })));
    renderAt(<EventInfoForm />);

    fireEvent.click(await screen.findByRole('radio', { name: /Duplicar un evento/ }));
    openSelect(screen.getByRole('combobox', { name: 'Evento a duplicar' }));
    expect(screen.queryByRole('option', { name: 'Recital' })).toBeNull();
    fireEvent.click(await screen.findByRole('option', { name: 'Clausura 2025' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));

    await waitFor(() => expect(duplicate).toHaveBeenCalledWith('clausura-2025'));
  });

  it('shows the undated notice of a duplicated draft and the refusal to publish it', async () => {
    vi.spyOn(DansshipAPI.eventosAdmin, 'updateEvent').mockResolvedValue({
      ok: false,
      data: null,
      status: 409,
      error: new DansshipAPIError(
        {
          category: DANSSHIP_ERROR_CATEGORY.VALIDATION_ERROR,
          error_code: 'EVENT_SCHEDULE_REQUIRED',
          message: 'x',
          details: {},
        } as never,
        409,
      ),
    } as never);
    const toastError = vi.spyOn(toast, 'error');

    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([]));
    vi.spyOn(DansshipAPI.participationAdmin, 'getSummary').mockResolvedValue(ok(null));
    vi.spyOn(DansshipAPI.participationAdmin, 'listPeople').mockResolvedValue(
      ok({ filters: [], columns: [], rows: [] }),
    );
    vi.spyOn(DansshipAPI.eventosAdmin, 'listPriceConditions').mockResolvedValue(ok([]));
    renderAt(<EventWorkspace event={event({ starts_at: null, ends_at: null })} />, '/admin/eventos/event-1/x');

    expect(await screen.findByText(/Borrador copiado sin fechas/)).toBeVisible();
    fireEvent.click(screen.getByRole('switch', { name: 'Publicado' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Ponle fecha a las sesiones del evento antes de publicarlo.'),
    );
  });

  it('stops offering a label from "Editar lista" instead of deleting it', async () => {
    const update = vi.spyOn(DansshipAPI.eventosAdmin, 'updateTypeLabel').mockResolvedValue(ok(labels[0]));
    renderAt(<EventInfoForm />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar lista' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Dejar de ofrecer' })[0]);

    await waitFor(() => expect(update).toHaveBeenCalledWith('label-taller', { is_offered: false }));
    expect(within(dialog).queryByRole('button', { name: /Eliminar|Borrar/ })).toBeNull();
  });

  it('removes the event QR and falls back to Dansship’s', async () => {
    const remove = vi.spyOn(DansshipAPI.eventosAdmin, 'removePaymentQr').mockResolvedValue(ok(event()));
    renderAt(
      <EventInfoForm event={event({ payment_qr_url: 'https://cdn.test/qr.png' })} />,
      '/admin/eventos/event-1/x',
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Quitar QR' }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('event-1'));
    expect(await screen.findByText('Se usa el QR de Dansship.')).toBeVisible();
  });

  it('offers the terms upload with no "Sin términos" hint while the event has no terms PDF', async () => {
    renderAt(<EventInfoForm event={event()} />, '/admin/eventos/event-1/x');

    expect(await screen.findByText('Sin términos')).toBeVisible();
    expect(screen.queryByText(/no se pide la casilla/)).toBeNull();
  });

  it('explains why there is nothing to duplicate when every event is a legacy one', async () => {
    vi.spyOn(DansshipAPI.eventosAdmin, 'list').mockResolvedValue(
      ok([{ kind: 'event', id: 'recital', name: 'Recital', type: 'recital', status: 'published' }]),
    );
    renderAt(<EventInfoForm />);

    fireEvent.click(await screen.findByRole('radio', { name: /Duplicar un evento/ }));

    expect(screen.getByRole('combobox', { name: 'Evento a duplicar' })).toBeDisabled();
    expect(screen.getByText(/Todavía no hay eventos configurados por tipos de participante/)).toBeVisible();
  });

  it('offers only Público and Privado', async () => {
    renderAt(<EventInfoForm event={event()} />, '/admin/eventos/event-1/x');

    openSelect(await screen.findByRole('combobox', { name: 'Visibilidad del evento' }));

    expect((await screen.findAllByRole('option')).map(option => option.textContent)).toEqual(['Público', 'Privado']);
  });
});

describe('weeklyDates', () => {
  it('lists the chosen weekday between both dates, both included', () => {
    expect(weeklyDates('2026-12-05', '2026-12-19', 5)).toEqual(['2026-12-05', '2026-12-12', '2026-12-19']);
    expect(weeklyDates('2026-12-01', '2026-12-04', 6)).toEqual([]);
  });
});
