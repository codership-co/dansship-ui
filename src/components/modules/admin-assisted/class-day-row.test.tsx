import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type ClassDayEntry, ClassDayRow, type ClassDayRowActions } from './class-day-row';

import '@core/i18n';

import type { AssistedBookingItem, PublishedClass } from '@core/api';

vi.mock('@contexts', () => ({ useOrPermissions: () => true }));

const published = {
  id: 'class-1',
  start_time: '2026-12-01T23:30:00Z',
  end_time: '2026-12-02T00:30:00Z',
  enrolled_count: 3,
  capacity: 12,
  two_for_one_eligible: false,
  instructor: { full_name: 'Fabio Garzón' },
} as PublishedClass;

const item = (extra: Partial<AssistedBookingItem> = {}) =>
  ({
    id: 'booking-1',
    scheduled_class_id: 'class-1',
    class_name: 'Bachata',
    start_time: published.start_time,
    end_time: published.end_time,
    origin: 'plan',
    status: 'active',
    has_companion: false,
    is_companion: false,
    can_return_credit: true,
    credit_restored: null,
    can_reimburse: false,
    can_add_companion: false,
    ...extra,
  }) as AssistedBookingItem;

const actions = (): ClassDayRowActions => ({
  onBook: vi.fn(),
  onMarkAttendance: vi.fn(),
  onCancel: vi.fn(),
  onAddCompanion: vi.fn(),
  onReimburse: vi.fn(),
});

const entry = (availability: ClassDayEntry['availability']): ClassDayEntry => ({
  id: 'class-1',
  name: 'Bachata',
  startTime: published.start_time,
  published,
  availability,
});

describe('ClassDayRow', () => {
  afterEach(cleanup);

  it('offers the 2x1 companion only when the booking can take one', () => {
    const { rerender } = render(
      <ClassDayRow entry={entry({ kind: 'reserved', booking: item() })} actions={actions()} />,
    );

    expect(screen.queryByRole('button', { name: 'Agregar acompañante' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Cancelar reserva' })).toBeTruthy();

    rerender(
      <ClassDayRow
        entry={entry({ kind: 'reserved', booking: item({ can_add_companion: true }) })}
        actions={actions()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Agregar acompañante' })).toBeTruthy();
  });

  it('reimburses a held class that still has its credit, and only then', () => {
    const handlers = actions();
    const attended = item({ status: 'attended', can_reimburse: true, can_return_credit: false });
    const { rerender } = render(
      <ClassDayRow entry={entry({ kind: 'attended', booking: attended })} actions={handlers} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reembolsar' }));
    expect(handlers.onReimburse).toHaveBeenCalledWith(attended);

    rerender(
      <ClassDayRow
        entry={entry({ kind: 'attended', booking: { ...attended, can_reimburse: false, credit_restored: true } })}
        actions={handlers}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Reembolsar' })).toBeNull();
    expect(screen.getByText('Crédito devuelto')).toBeTruthy();
  });

  it('lets a no-show be corrected or reimbursed', () => {
    const handlers = actions();
    const absent = item({ status: 'no_show', can_reimburse: true, can_return_credit: false });

    render(<ClassDayRow entry={entry({ kind: 'noShow', booking: absent })} actions={handlers} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corregir asistencia' }));

    expect(handlers.onMarkAttendance).toHaveBeenCalledWith(absent, true);
    expect(screen.getByRole('button', { name: 'Reembolsar' })).toBeTruthy();
  });

  it('keeps the booking button disabled while another class overlaps', () => {
    render(<ClassDayRow entry={entry({ kind: 'overlap', booking: item() })} actions={actions()} />);

    expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled();
    expect(screen.getByText('Ya tiene una clase a esa hora')).toBeTruthy();
  });
});
