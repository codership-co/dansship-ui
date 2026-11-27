import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ParticipantTypesPanel } from './participant-types-panel';

import { typeAdmin } from '@components/modules/event-participation/participation.fixtures';
import { DansshipAPI } from '@core/api';
import '@core/i18n';

const ok = <T,>(data: T) => ({ ok: true, data, status: 200, error: null }) as never;

function renderPanel(isDraftEvent = true) {
  render(
    <MemoryRouter>
      <ParticipantTypesPanel eventId='event-1' eventCapacity={100} isPrivate={false} isDraftEvent={isDraftEvent} />
    </MemoryRouter>,
  );
}

describe('ParticipantTypesPanel', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.eventosAdmin, 'listPriceConditions').mockResolvedValue(ok([]));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens an event without types on a draft «General» that the API does not know yet', async () => {
    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([]));
    const createType = vi.spyOn(DansshipAPI.participationAdmin, 'createType');
    renderPanel();

    expect(await screen.findByDisplayValue('General')).toBeVisible();
    expect(screen.getByText('Sin guardar')).toBeVisible();
    expect(createType).not.toHaveBeenCalled();
  });

  it('"Agregar tipo" only adds a draft; "Guardar tipo" creates it and then saves its configuration', async () => {
    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([typeAdmin()]));
    const createType = vi
      .spyOn(DansshipAPI.participationAdmin, 'createType')
      .mockResolvedValue(ok(typeAdmin({ id: 'type-2', name: 'Nuevo tipo', contribution_model: 'free', fees: [] })));
    const updateType = vi
      .spyOn(DansshipAPI.participationAdmin, 'updateType')
      .mockResolvedValue(ok(typeAdmin({ id: 'type-2', name: 'Invitados', contribution_model: 'free', fees: [] })));
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar tipo de participante' }));
    expect(createType).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Nombre del tipo/), { target: { value: 'Invitados' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar tipo' }));

    await waitFor(() =>
      expect(updateType).toHaveBeenCalledWith('event-1', 'type-2', expect.objectContaining({ name: 'Invitados' })),
    );
    expect(createType).toHaveBeenCalledWith('event-1');
    expect(screen.queryByText('Sin guardar')).toBeNull();
  });

  it('"Cancelar" on a draft removes it', async () => {
    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([typeAdmin()]));
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar tipo de participante' }));
    expect(screen.getByText('Sin guardar')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText('Sin guardar')).toBeNull();
    expect(screen.getByDisplayValue('General')).toBeVisible();
  });

  it('deletes a saved type of a draft event after confirming', async () => {
    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(
      ok([typeAdmin(), typeAdmin({ id: 'type-2', name: 'Invitados' })]),
    );
    const deleteType = vi.spyOn(DansshipAPI.participationAdmin, 'deleteType').mockResolvedValue(ok(null));
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar tipo' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Eliminar tipo' }));

    await waitFor(() => expect(deleteType).toHaveBeenCalledWith('event-1', 'type-1'));
    await waitFor(() => expect(screen.getByDisplayValue('Invitados')).toBeVisible());
  });

  it('offers no delete once the event is published or the type has signups', async () => {
    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([typeAdmin({ signup_count: 2 })]));
    renderPanel();

    expect(await screen.findByDisplayValue('General')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Eliminar tipo' })).toBeNull();

    cleanup();
    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([typeAdmin()]));
    renderPanel(false);

    expect(await screen.findByDisplayValue('General')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Eliminar tipo' })).toBeNull();
  });
});
