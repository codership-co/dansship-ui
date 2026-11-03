import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdjustmentsCards, AdjustmentsTable } from './adjustments-table';

import '@core/i18n';

import type { PayrollAdjustment } from '@core/api';

function adjustment(overrides: Partial<PayrollAdjustment>): PayrollAdjustment {
  return {
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
    ...overrides,
  };
}

function renderRows(items: Array<PayrollAdjustment>) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onOpenDocument: vi.fn() };

  render(
    <MemoryRouter>
      <AdjustmentsTable items={items} {...handlers} />
      <AdjustmentsCards items={items} {...handlers} />
    </MemoryRouter>,
  );

  return handlers;
}

describe('adjustment rows', () => {
  afterEach(cleanup);

  it('links the email to the person 360 view', () => {
    renderRows([adjustment({})]);

    expect(screen.getAllByText('ana@example.com')[0].closest('a')?.getAttribute('href')).toBe('/admin/users/user-1');
  });

  it('maps type and status to badge variants', () => {
    renderRows([
      adjustment({ id: 'a' }),
      adjustment({ id: 'b', type: 'advance', status: 'applied', can_edit: false, document_id: 'doc-1' }),
    ]);

    expect(screen.getAllByText('Adicional')[0].getAttribute('data-variant')).toBe('secondary');
    expect(screen.getAllByText('Anticipo')[0].getAttribute('data-variant')).toBe('outlineTertiary');
    expect(screen.getAllByText('Pendiente')[0].getAttribute('data-variant')).toBe('outlineWarning');
    expect(screen.getAllByText('Aplicado')[0].getAttribute('data-variant')).toBe('outlineActive');
  });

  it('offers edit and delete only on pending rows with nothing discounted', () => {
    const handlers = renderRows([adjustment({})]);

    fireEvent.click(screen.getAllByText('Editar')[0]);
    fireEvent.click(screen.getAllByText('Eliminar')[0]);

    expect(handlers.onEdit).toHaveBeenCalled();
    expect(handlers.onDelete).toHaveBeenCalled();
  });

  it('hides the actions on a partially discounted advance and shows its discounted and balance', () => {
    renderRows([
      adjustment({
        type: 'advance',
        concept: null,
        note: 'Adelanto',
        period_year: null,
        period_month: null,
        payment_date: '2026-07-02',
        amount: 50000,
        discounted: 20000,
        balance: 30000,
        can_edit: false,
        document_id: 'doc-9',
      }),
    ]);

    expect(screen.queryByText('Editar')).toBeNull();
    expect(screen.queryByText('Eliminar')).toBeNull();
    expect(screen.getAllByText(/Descontado .*20\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Saldo .*30\.000/).length).toBeGreaterThan(0);
  });

  it('opens the document only when one applied it', () => {
    const handlers = renderRows([
      adjustment({ id: 'a' }),
      adjustment({ id: 'b', document_id: 'doc-1', status: 'applied' }),
    ]);

    expect(screen.getAllByText('Cuenta de cobro')).toHaveLength(2);

    fireEvent.click(screen.getAllByText('Cuenta de cobro')[0]);

    expect(handlers.onOpenDocument).toHaveBeenCalledWith('doc-1');
  });

  it('shows the related event and where an extra will go when its month already has a cuenta', () => {
    renderRows([adjustment({ event_name: 'Gala', passes_to_year: 2026, passes_to_month: 8 })]);

    expect(screen.getAllByText('Evento: Gala').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pasa a la cuenta de Agosto 2026').length).toBeGreaterThan(0);
  });
});
