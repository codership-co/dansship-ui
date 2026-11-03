import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PayrollAdjustmentsPanel } from './payroll-adjustments-panel';

import { DansshipAPI, type PayrollAdjustment } from '@core/api';
import '@core/i18n';

function ok<T>(data: T) {
  return { ok: true as const, data, status: 200, error: null };
}

const summary = {
  pending_extras_amount: 30000,
  pending_extras_count: 1,
  advances_balance_amount: 0,
  advances_balance_count: 0,
};

const item: PayrollAdjustment = {
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

function mockList(items: Array<PayrollAdjustment>) {
  return vi
    .spyOn(DansshipAPI.instructorPaymentsAdmin, 'listPayrollAdjustments')
    .mockResolvedValue(ok({ items, total: items.length, page: 1, page_size: 20, summary }) as never);
}

function renderPanel() {
  render(
    <MemoryRouter>
      <PayrollAdjustmentsPanel onOpenAssignments={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('PayrollAdjustmentsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists rows, shows the tiles over the response summary and both header buttons', async () => {
    mockList([item]);
    renderPanel();

    expect(await screen.findAllByText('Ensayos')).not.toHaveLength(0);
    expect(screen.getByText('Nuevo adicional')).toBeTruthy();
    expect(screen.getByText('Nuevo anticipo')).toBeTruthy();
    expect(screen.getByText('Adicionales pendientes')).toBeTruthy();
    expect(screen.getByText('1 pendiente')).toBeTruthy();
  });

  it('shows the first-use empty state', async () => {
    mockList([]);
    renderPanel();

    expect(await screen.findByText(/Aún no hay adicionales ni anticipos/)).toBeTruthy();
  });

  it('shows the error with Reintentar and keeps the header buttons', async () => {
    const list = vi
      .spyOn(DansshipAPI.instructorPaymentsAdmin, 'listPayrollAdjustments')
      .mockResolvedValue({ ok: false, data: null, status: 500, error: null } as never);
    renderPanel();

    expect(await screen.findByText('No pudimos cargar los adicionales y anticipos')).toBeTruthy();
    expect(screen.getByText('Nuevo adicional')).toBeTruthy();

    list.mockResolvedValue(ok({ items: [item], total: 1, page: 1, page_size: 20, summary }) as never);
    fireEvent.click(screen.getByText('Reintentar'));

    await waitFor(() => expect(screen.getAllByText('Ensayos')).not.toHaveLength(0));
  });

  it('asks for confirmation before deleting and deletes through the extra endpoint', async () => {
    mockList([item]);
    const remove = vi.spyOn(DansshipAPI.instructorPaymentsAdmin, 'deleteExtra').mockResolvedValue(ok(null) as never);
    renderPanel();

    fireEvent.click((await screen.findAllByText('Eliminar'))[0]);

    expect(await screen.findByText('Eliminar adicional')).toBeTruthy();
    expect(
      screen.getByText(/¿Eliminar el adicional de Ana López por .*30\.000\? Esta acción no se puede deshacer\./),
    ).toBeTruthy();

    fireEvent.click(screen.getAllByText('Eliminar').at(-1) as HTMLElement);

    await waitFor(() => expect(remove).toHaveBeenCalledWith('adj-1'));
  });
});
