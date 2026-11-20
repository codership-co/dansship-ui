import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ClassSlotModal } from './class-slot-modal';

import '@core/i18n';

import type { ScheduledClass } from '@core/api';

const pastClass: ScheduledClass = {
  id: 'class-1',
  schedule_week_id: 'week-1',
  class_definition_id: 'def-1',
  room_id: 'room-1',
  instructor_id: null,
  start_time: '2026-11-19T23:00:00Z',
  end_time: '2026-11-20T00:00:00Z',
  capacity: 12,
  enrolled_count: 8,
  is_cancelled: false,
};

function renderModal(overrides: Partial<Parameters<typeof ClassSlotModal>[0]> = {}) {
  render(
    <ClassSlotModal
      isOpen
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      onDelete={vi.fn()}
      initialData={pastClass}
      rooms={[]}
      classes={[]}
      instructors={[]}
      isPublishedEdit
      canCancelPublishedClass
      {...overrides}
    />,
  );
}

describe('ClassSlotModal past-class mode', () => {
  afterEach(cleanup);

  it('offers only cancellation for a class that already happened', () => {
    renderModal({ isPastClass: true });

    expect(screen.getByText('Esta clase ya ocurrió. Solo puedes cancelarla.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar Clase' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Clase' }));

    expect(screen.getByText(/no contará para el pago del instructor/)).toBeInTheDocument();
  });

  it('keeps the confirmation and typed note open when cancelling fails', async () => {
    const onDelete = vi.fn().mockResolvedValue(false);
    renderModal({ isPastClass: true, onDelete });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Clase' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Llegó tarde' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar Clase' }).at(-1)!);

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith({ cancellationNote: 'Llegó tarde' }));
    expect(screen.getByRole('textbox')).toHaveValue('Llegó tarde');
  });

  it('keeps the save action for an upcoming published class', () => {
    renderModal({ isPastClass: false });

    expect(screen.getByRole('button', { name: 'Guardar Clase' })).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toBeEnabled();
  });
});
