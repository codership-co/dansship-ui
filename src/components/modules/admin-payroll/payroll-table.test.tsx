import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PayrollCards, PayrollTable } from './payroll-table';

import '@core/i18n';

import type { PayrollDocument } from '@core/api';

function payrollDocument(overrides: Partial<PayrollDocument>): PayrollDocument {
  return {
    id: 'doc-1',
    user_id: 'user-1',
    full_name: 'Ana López',
    email: 'ana@example.com',
    payment_type: 'fixed_amount',
    period_year: 2026,
    period_month: 10,
    status: 'issued',
    total_amount: 100000,
    service_value: 100000,
    advances_discounted: 0,
    advance_remainder: 0,
    paid_amount: null,
    issued_at: '2026-10-31T15:00:00Z',
    paid_at: null,
    has_receipt: false,
    ...overrides,
  };
}

function renderTable(documents: Array<PayrollDocument>, onDownload = vi.fn(), onShowBreakdown = vi.fn()) {
  render(
    <MemoryRouter>
      <PayrollTable documents={documents} onDownload={onDownload} onShowBreakdown={onShowBreakdown} />
      <PayrollCards documents={documents} onDownload={onDownload} onShowBreakdown={onShowBreakdown} />
    </MemoryRouter>,
  );

  return onDownload;
}

describe('payroll rows', () => {
  afterEach(cleanup);

  it.each([
    ['issued', 'Por confirmar', 'outlineNeutral'],
    ['confirmed', 'Pendiente de pago', 'outlineWarning'],
    ['disputed', 'En desacuerdo', 'destructive'],
    ['paid', 'Pagada', 'outlineActive'],
    ['voided', 'Anulada', 'destructive'],
  ])('maps %s to the %s label and %s badge', (status, label, variant) => {
    renderTable([payrollDocument({ status })]);

    const badges = screen.getAllByText(label);

    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0].getAttribute('data-variant')).toBe(variant);
  });

  it('links the email to the person details on the payment documents tab', () => {
    renderTable([payrollDocument({})]);

    const link = screen.getAllByText('ana@example.com')[0].closest('a');

    expect(link?.getAttribute('href')).toBe('/admin/users/user-1?tab=payment-documents');
  });

  it('always offers the cuenta de cobro, even when voided', () => {
    const onDownload = renderTable([payrollDocument({ status: 'voided' })]);

    fireEvent.click(screen.getAllByText('Cuenta de cobro')[0]);

    expect(onDownload).toHaveBeenCalledWith('doc-1', 'invoice');
  });

  it('shows the receipt button only for paid documents with a receipt', () => {
    renderTable([
      payrollDocument({ id: 'a', status: 'paid', has_receipt: true, paid_amount: 100000 }),
      payrollDocument({ id: 'b', status: 'paid', has_receipt: false }),
      payrollDocument({ id: 'c', status: 'confirmed', has_receipt: true }),
    ]);

    // One receipt button per layout (table + cards) for the single eligible document.
    expect(screen.getAllByText('Comprobante de pago')).toHaveLength(2);
  });

  it('keeps documents without advances exactly as before (no breakdown line)', () => {
    renderTable([payrollDocument({})]);

    expect(screen.queryByText('Ver desglose')).toBeNull();
    expect(screen.queryByText(/anticipos/)).toBeNull();
  });

  it('shows the net with the service minus advances line and opens the breakdown', () => {
    const onShowBreakdown = vi.fn();
    const document = payrollDocument({ total_amount: 70000, service_value: 100000, advances_discounted: 30000 });

    renderTable([document], vi.fn(), onShowBreakdown);

    expect(screen.getAllByText(/Servicio .*100\.000.* − anticipos .*30\.000/).length).toBe(2);

    fireEvent.click(screen.getAllByText('Ver desglose')[0]);

    expect(onShowBreakdown).toHaveBeenCalledWith(document);
  });
});
