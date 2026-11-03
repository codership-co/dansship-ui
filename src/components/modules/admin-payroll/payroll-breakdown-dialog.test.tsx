import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PayrollBreakdownDialog } from './payroll-breakdown-dialog';

import '@core/i18n';

import type { PayrollDocument } from '@core/api';

const document = {
  id: 'doc-1',
  user_id: 'user-1',
  full_name: 'Ana López',
  total_amount: 70000,
  service_value: 100000,
  advances_discounted: 30000,
  advance_remainder: 0,
} as PayrollDocument;

describe('PayrollBreakdownDialog', () => {
  afterEach(cleanup);

  it('shows the three rows and no overflow note when nothing is left to discount', () => {
    render(<PayrollBreakdownDialog document={document} period='Octubre 2026' onClose={vi.fn()} />);

    expect(screen.getByText('Detalle de la cuenta')).toBeTruthy();
    expect(screen.getByText('Valor del servicio')).toBeTruthy();
    expect(screen.getByText('Anticipos descontados')).toBeTruthy();
    expect(screen.getByText('Neto a pagar')).toBeTruthy();
    expect(screen.getByText(/− .*30\.000/)).toBeTruthy();
    expect(screen.queryByText(/El anticipo superaba/)).toBeNull();
  });

  it('explains what stays pending when the advance exceeded the service value', () => {
    render(
      <PayrollBreakdownDialog
        document={{ ...document, total_amount: 0, advances_discounted: 100000, advance_remainder: 30000 }}
        period='Octubre 2026'
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/El anticipo superaba el valor del servicio: quedan .*30\.000/)).toBeTruthy();
  });

  it('closes with the single Cerrar button', () => {
    const onClose = vi.fn();

    render(<PayrollBreakdownDialog document={document} period='Octubre 2026' onClose={onClose} />);
    fireEvent.click(screen.getAllByText('Cerrar')[0]);

    expect(onClose).toHaveBeenCalled();
  });
});
