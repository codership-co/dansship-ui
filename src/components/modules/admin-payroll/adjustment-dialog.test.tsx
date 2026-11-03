import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdjustmentDialog } from './adjustment-dialog';

import { DansshipAPI, type PayrollAdjustment } from '@core/api';
import '@core/i18n';

function ok<T>(data: T) {
  return { ok: true as const, data, status: 200, error: null };
}

const extra: PayrollAdjustment = {
  id: 'adj-1',
  type: 'extra',
  user_id: 'user-1',
  full_name: 'Ana López',
  email: 'ana@example.com',
  concept: 'Ensayos',
  note: null,
  event_id: null,
  event_name: null,
  period_year: 2026,
  period_month: 7,
  passes_to_year: null,
  passes_to_month: null,
  payment_date: null,
  amount: 30000,
  discounted: 0,
  balance: 30000,
  status: 'pending',
  document_id: null,
  can_edit: true,
  created_at: '2026-08-01T15:00:00Z',
};

function renderDialog(props: Partial<React.ComponentProps<typeof AdjustmentDialog>> = {}) {
  const handlers = { onClose: vi.fn(), onSaved: vi.fn(), onOpenAssignments: vi.fn() };

  render(<AdjustmentDialog kind='extra' editing={null} {...handlers} {...props} />);

  return handlers;
}

function mockEligibility(value: { has_active_assignment: boolean; month_has_document: boolean }) {
  return vi
    .spyOn(DansshipAPI.instructorPaymentsAdmin, 'getAdjustmentEligibility')
    .mockResolvedValue(ok(value) as never);
}

describe('AdjustmentDialog', () => {
  beforeEach(() => {
    vi.spyOn(DansshipAPI.instructorPaymentsAdmin, 'listAdjustmentEventOptions').mockResolvedValue(ok([]) as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the extra copy and keeps Guardar disabled until a person is chosen', () => {
    renderDialog();

    expect(screen.getByText('Nuevo adicional')).toBeTruthy();
    expect(screen.getByText('Pago extra por un mes. Aparece como línea propia en su cuenta de cobro.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the advance copy with the automatic discount help and no file upload', () => {
    renderDialog({ kind: 'advance' });

    expect(screen.getByText('Nuevo anticipo')).toBeTruthy();
    expect(screen.getByText('Adelanto de dinero a un colaborador.')).toBeTruthy();
    expect(screen.getByText('Se descontará automáticamente de la siguiente cuenta de cobro.')).toBeTruthy();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('fixes the person when editing and offers Guardar cambios', async () => {
    mockEligibility({ has_active_assignment: true, month_has_document: false });
    renderDialog({ editing: extra });

    expect(screen.getByText('Editar adicional')).toBeTruthy();
    expect(screen.getByText('Ana López')).toBeTruthy();
    expect(screen.queryByText('Cambiar')).toBeNull();
    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(false),
    );
  });

  it('warns without an active assignment, disables Guardar and links to the assignments tab', async () => {
    mockEligibility({ has_active_assignment: false, month_has_document: false });
    const handlers = renderDialog({ editing: extra });

    const warning = await screen.findByText(
      'Ana no tiene una Vinculación de Pago activa en Julio 2026, así que no se puede cargar.',
    );

    expect(warning).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByText('Abrir Vinculación de pago'));

    expect(handlers.onOpenAssignments).toHaveBeenCalled();
  });

  it('warns that the month already has a cuenta but keeps Guardar enabled', async () => {
    mockEligibility({ has_active_assignment: true, month_has_document: true });
    renderDialog({ editing: extra });

    expect(
      await screen.findByText('Ese mes ya tiene cuenta de cobro: este adicional se incluirá en la siguiente.'),
    ).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('saves the edit and reports it', async () => {
    mockEligibility({ has_active_assignment: true, month_has_document: false });
    const update = vi.spyOn(DansshipAPI.instructorPaymentsAdmin, 'updateExtra').mockResolvedValue(ok(extra) as never);
    const handlers = renderDialog({ editing: extra });

    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(handlers.onSaved).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith('adj-1', {
      period_year: 2026,
      period_month: 7,
      concept: 'Ensayos',
      amount: 30000,
      event_id: null,
    });
  });

  it('keeps the dialog open when the server rejects the save', async () => {
    mockEligibility({ has_active_assignment: true, month_has_document: false });
    vi.spyOn(DansshipAPI.instructorPaymentsAdmin, 'updateExtra').mockResolvedValue({
      ok: false,
      data: null,
      status: 422,
      error: null,
    } as never);
    const handlers = renderDialog({ editing: extra });

    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(DansshipAPI.instructorPaymentsAdmin.updateExtra).toHaveBeenCalled());
    expect(handlers.onSaved).not.toHaveBeenCalled();
    expect(screen.getByText('Editar adicional')).toBeTruthy();
  });
});
